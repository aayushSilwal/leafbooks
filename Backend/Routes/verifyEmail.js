const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const UserModel = require("../Models/Users");

// GET /verify-email?token=XYZ
router.get("/", async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).json({ message: "Missing token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findById(decoded.userId);

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) return res.status(200).json({ message: "Email already verified" });

    user.isVerified = true;
    await user.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Invalid or expired token" });
  }
});

module.exports = router;
