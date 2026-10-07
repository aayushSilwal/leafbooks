const { OAuth2Client } = require("google-auth-library");
const User = require("../Models/Users");
const jwt = require("jsonwebtoken");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, message: "No credential provided" });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    let user = await User.findOne({ email: payload.email });

    if (!user) {
      // New user — create with picture
      user = await User.create({
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        password: null,
        authType: "google",
        isVerified: true,
      });
    } else {
      // Existing user — always update picture and name from Google
      user = await User.findByIdAndUpdate(
        user._id,
        { picture: payload.picture, name: payload.name },
        { new: true }
      );
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Email not verified. Please verify your email first."
      });
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({ success: true, token, user });

  } catch (err) {
    console.error("Google Auth Error:", err);
    res.status(400).json({ success: false, message: "Invalid Google Token" });
  }
};

module.exports = { googleAuth };