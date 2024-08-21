const crypto = require("crypto");
const nodemailer = require("nodemailer");

let otpStorage = {}; // Temporary storage for OTPs

const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const sendOtp = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.GMAIL,
      pass: process.env.PASS,
    },
  });

  const mailOptions = {
    from: process.env.GMAIL,
    to: email,
    subject: "OTP Verifiction",
    html: `
    <html>
        <body>
            <h2 style="color: #333;">Your OTP Verification Code</h2>
            <p style="font-size: 16px;">Your OTP code is <b style="font-size: 24px; color: #007bff;">${otp}</b> to verify on Bet App.</p>
            <p style="font-size: 14px; color: #555;">This code is valid for 10 minutes.</p>
            <p style="font-size: 12px; color: #777;">If you did not request this code, please ignore this email.</p>
        </body>
    </html>
`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw error;
  }
};

const verifyOtp = (email, otp) => {
  if (otpStorage[email] === otp) {
    delete otpStorage[email];
    return true;
  }
  return false;
};

module.exports = { generateOtp, sendOtp, verifyOtp };
