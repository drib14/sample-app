const User = require('../models/User');
const Otp = require('../models/Otp');
const sendEmail = require('../utils/sendEmail');
const { verificationCodeTemplate, welcomeTemplate } = require('../utils/emailTemplates');
const jwt = require('jsonwebtoken');

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const registerInit = async (req, res) => {
  try {
    const { firstName, lastName, gender, email, dob, address, username } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    const otp = generateOTP();
    const userData = { firstName, lastName, gender, email, dob, address, username };

    // Delete any existing OTP for this email
    await Otp.deleteMany({ email });

    await Otp.create({ email, otp, userData });

    const htmlContent = verificationCodeTemplate(otp, 'register');
    await sendEmail(email, 'Maki Registration Verification', `Your verification code is: ${otp}`, htmlContent);

    res.status(200).json({ message: 'Verification code sent to email' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const registerVerify = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const otpRecord = await Otp.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const newUser = await User.create(otpRecord.userData);
    await Otp.deleteMany({ email });

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Send Welcome Email
    const htmlContent = welcomeTemplate(newUser.firstName);
    await sendEmail(email, 'Welcome to Maki!', `Hi ${newUser.firstName}, welcome to Maki!`, htmlContent);

    res.status(201).json({ token, user: newUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loginInit = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = generateOTP();
    await Otp.deleteMany({ email });
    await Otp.create({ email, otp });

    const htmlContent = verificationCodeTemplate(otp, 'login');
    await sendEmail(email, 'Maki Login Verification', `Your login verification code is: ${otp}`, htmlContent);

    res.status(200).json({ message: 'Verification code sent to email' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loginVerify = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const otpRecord = await Otp.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await Otp.deleteMany({ email });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({ token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerInit, registerVerify, loginInit, loginVerify };
