const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require("../Models/Users");
const { generateVerificationToken, sendVerificationEmail } = require('../utils/emailUtils');

// Signup
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const user = await UserModel.findOne({ email });
    if (user) {
      return res.status(409).json({
        message: 'User already exists, you can login',
        success: false
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (isVerified false initially)
    const newUser = new UserModel({ name, email, password: hashedPassword, isVerified: false });
    await newUser.save();

    // Generate verification token & send email
    const token = generateVerificationToken(newUser._id);
    await sendVerificationEmail(newUser.email, token);

    res.status(201).json({
      message: "Signup success! Please check your email to verify your account.",
      success: true
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    const errorMsg = 'email or password is wrong';

    if (!user) return res.status(403).json({ message: errorMsg, success: false });

    // Block login if email not verified
    if (!user.isVerified) {
      return res.status(403).json({
        message: "Email not verified. Please check your inbox.",
        success: false
      });
    }

    // Compare password
    const isPassEqual = await bcrypt.compare(password, user.password);
    if (!isPassEqual) return res.status(403).json({ message: errorMsg, success: false });

    // Generate JWT
    const jwtToken = jwt.sign({ email: user.email, _id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.status(200).json({
      message: "Login success",
      success: true,
      jwtToken,
      email: user.email,
      name: user.name
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

module.exports = { signup, login };
