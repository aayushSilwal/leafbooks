const Publisher = require('../Models/Publisher');
const User = require('../Models/Users');

// POST /api/publisher/become
exports.becomePublisher = async (req, res) => {
  const { publisherName, bio } = req.body;

  if (!publisherName?.trim()) {
    return res.status(400).json({ success: false, message: "Publisher Name is required" });
  }

  try {
    // Check if already applied or is a publisher
    const existingPublisher = await Publisher.findOne({ user: req.user._id });
    if (existingPublisher) {
      return res.status(400).json({ success: false, message: "You have already applied to become a publisher." });
    }

    const publisher = new Publisher({
      user: req.user._id,
      publisherName: publisherName.trim(),
      bio: bio?.trim() || '',
      approved: false
    });

    await publisher.save();

    // Link publisher profile to user — role stays "user" until admin approves
    await User.findByIdAndUpdate(req.user._id, {
      publisherProfile: publisher._id
    });

    return res.status(200).json({
      success: true,
      message: "Application submitted! Awaiting admin approval."
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/publisher/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('publisherProfile');

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/publisher/me — returns full user with role for frontend
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('publisherProfile');

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};