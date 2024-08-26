const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const { generateOtp, sendOtp } = require("../utils/otp");
const Transactions = require("../models/transaction");

let otpStorage = {};

exports.requestOtp = async (req, res) => {
  const { username, email, password, mobileNumber } = req.body;

  if (!username || !email || !password || !mobileNumber) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Validate input
  if (username.length < 5)
    return res
      .status(400)
      .json({ error: "Username must be at least 5 characters long." });

  if (password.length < 6)
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters long." });

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: "Invalid email address." });

  if (mobileNumber && mobileNumber.length !== 10)
    return res
      .status(400)
      .json({ error: "Mobile number must be 10 digits long." });

  try {
    // Check if username or email already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (existingUser)
      return res
        .status(400)
        .json({ error: "Username or email already exists." });

    // Check if mobile number already exists
    const mobile = await User.findOne({ mobileNumber });
    if (mobile)
      return res.status(400).json({ error: "Phone number already exists." });

    // Generate and send OTP
    const otpCode = generateOtp();
    otpStorage[email] = {
      otp: otpCode,
      userData: { username, email, password, mobileNumber },
    };
    await sendOtp(email, otpCode);

    res.json({
      message:
        "OTP sent to your email. Please verify to complete registration.",
    });
  } catch (error) {
    console.error("Error requesting OTP:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  // Validate input
  if (!email || !otp)
    return res.status(400).json({ error: "OTP is required." });

  try {
    // Verify OTP
    const otpEntry = otpStorage[email];
    if (!otpEntry || otpEntry.otp !== otp)
      return res.status(400).json({ error: "Invalid or expired OTP." });

    // Hash password
    const hashedPassword = await bcrypt.hash(otpEntry.userData.password, 10);

    // Create and save user
    const newUser = new User({
      username: otpEntry.userData.username,
      email: otpEntry.userData.email,
      password: hashedPassword,
      mobileNumber: otpEntry.userData.mobileNumber,
      role: "user",
    });

    await newUser.save();

    // Clean up OTP storage
    delete otpStorage[email];

    res.json({ message: "Account created successfully!" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const existingUser = await User.findOne({ email: email });
    if (existingUser.suspend === true) {
      return res.status(400).json({ error: "Your account is blocked" });
    }
    if (!existingUser) {
      return res.status(400).json({ error: "Invalid Credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Capture the user's IP address
    const newipAddress =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    // Clear the previous IP address by setting it to an empty string
    existingUser.ipAddress = "";

    // Update with the new IP address
    existingUser.ipAddress = newipAddress;

    // Add the current date to the beginning of the signInHistory array
    existingUser.signInHistory.unshift(new Date());

    await existingUser.save();

    // Generate JWT token
    const id = existingUser._id;
    const userEmail = existingUser.email;

    const token = jwt.sign(
      { id: id, email: userEmail },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d", // Token expires in 30 days
      }
    );
    res.cookie("betAppUserToken", token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: true,
      sameSite: "None",
    });

    return res.status(200).json({
      id,
      username: existingUser.username,
      email: userEmail,
      message: "Sign-in successful",
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
};

exports.logout = (req, res) => {
  res.clearCookie("betAppUserToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Match the secure flag based on the environment
    sameSite: "None", // Match the SameSite attribute
    path: "/", // Specify the path if necessary
  });
  res.json({ message: "Logged out successfully" });
};

exports.checkCookie = (req, res) => {
  try {
    const token = req.cookies.betAppUserToken;
    if (token) {
      return res.status(200).json({ message: true });
    }
    return res.status(200).json({ message: false });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getUserProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    // Find user by ID and exclude the password field
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { username } = req.body;
  let avatarUrl;
  if (req.file) {
    avatarUrl = req.file.path; // This will be the Cloudinary URL
  }

  if (!username && !avatarUrl) {
    return res.status(400).json({
      error: "You need to update at least one field (username or avatar).",
    });
  }

  try {
    const updateData = {};
    if (username) updateData.username = username;
    if (avatarUrl) updateData.avatar = avatarUrl;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      fields: { username: 1, avatar: 1 },
    });

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: {
        username: updatedUser.username,
        avatar: updatedUser.avatar,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.changePassword = async (req, res) => {
  const userId = req.user.id; // Assuming user ID is available in req.user
  const { currentPassword, newPassword, confirmPassword } = req.body;

  // Validate input
  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: "All fields are required." });
  }

  if (newPassword !== confirmPassword) {
    return res
      .status(400)
      .json({ error: "New password and confirmation do not match." });
  }

  try {
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Compare current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect." });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

exports.updateBankAccountDetails = async (req, res) => {
  const userId = req.user.id;
  const { accountNumber, bankName, ifscCode, accountHolderName } = req.body;
  //console.log(accountNumber, bankName, ifscCode, accountHolderName);
  if (!accountNumber || !bankName || !ifscCode || !accountHolderName) {
    return res.status(400).json({ error: "All fields are required" });
  }
  if (ifscCode.length !== 11) {
    return res.status(400).json({ error: "IFSC Code is not correct" });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        "bankAccountDetails.accountHolderName": accountHolderName,
        "bankAccountDetails.accountNumber": accountNumber,
        "bankAccountDetails.bankName": bankName,
        "bankAccountDetails.ifscCode": ifscCode,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Bank account details updated successfully",
      bankAccountDetails: updatedUser.bankAccountDetails,
    });
  } catch (error) {
    console.error("Error updating bank account details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateUpiId = async (req, res) => {
  const userId = req.user.id;
  const { upiId } = req.body;

  if (!upiId) {
    return res.status(400).json({ error: "UPI ID is required" });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { upiId },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "UPI ID updated successfully",
      upiId: updatedUser.upiId,
    });
  } catch (error) {
    console.error("Error updating UPI ID:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getBankAccountDetails = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId).select("bankAccountDetails upiId");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      bankAccountDetails: user.bankAccountDetails,
      upiId: user.upiId,
    });
  } catch (error) {
    console.error("Error fetching bank account details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

    await user.save();

    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    const message = `You are receiving this email because you have requested the reset of a password. Please click on this link: \n\n ${resetUrl}`;

    await sendEmail({
      email: user.email,
      subject: "Password reset token",
      message,
    });

    res.json({ message: "Email sent" });
  } catch (error) {
    console.error("Error in forgot password:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  //console.log(token);
  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid token or token expired" });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error in reset password:", error);
    res.status(500).json({ error: "Server error" });
  }
};
