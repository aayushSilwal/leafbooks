const User = require('../Models/Users');
const Publisher = require('../Models/Publisher');
const Book = require('../Models/Book');
const Review = require('../Models/Review');
const Gift = require('../Models/Gift');
const Lend = require('../Models/Lend');
const bcrypt = require('bcrypt');
const cloudinary = require('../config/cloudinary');

// GET /api/user/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    return res.status(200).json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// PUT /api/user/profile — update name
exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: "Name is required." });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name: name.trim() },
      { new: true }
    ).select('-password');

    return res.status(200).json({ success: true, message: "Profile updated!", user });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// PUT /api/user/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: "All fields are required." });

    if (newPassword.length < 8)
      return res.status(400).json({ success: false, message: "New password must be at least 8 characters." });

    const user = await User.findById(req.user._id);

    if (user.authType === 'google')
      return res.status(400).json({ success: false, message: "Google accounts cannot change password here." });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ success: false, message: "Current password is incorrect." });

    const hashed = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(req.user._id, { password: hashed });

    return res.status(200).json({ success: true, message: "Password changed successfully!" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// PUT /api/user/profile-picture
exports.updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No image provided." });

    const user = await User.findById(req.user._id);

    if (user.picturePublicId) {
      await cloudinary.uploader.destroy(user.picturePublicId);
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'leafbooks/avatars', transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }] },
        (err, result) => err ? reject(err) : resolve(result)
      );
      stream.end(req.file.buffer);
    });

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { picture: result.secure_url, picturePublicId: result.public_id },
      { new: true }
    ).select('-password');

    return res.status(200).json({ success: true, message: "Profile picture updated!", user: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// DELETE /api/user/account — full cascade delete
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. If publisher — delete all books + Cloudinary files
    const publisher = await Publisher.findOne({ user: userId });
    if (publisher) {
      const books = await Book.find({ publisher: publisher._id });
      const bookIds = books.map(b => b._id);

      // Collect all book IDs first
      await Promise.all(books.map(async (book) => {
        // Delete Cloudinary files
        await Promise.allSettled([
          cloudinary.uploader.destroy(book.coverImage?.publicId),
          cloudinary.uploader.destroy(book.bookFile?.publicId, { resource_type: 'raw' }),
        ]);

        // Delete all reviews on this book
        await Review.deleteMany({ book: book._id });

        // Remove from purchasedBooks and bookshelf
        await User.updateMany(
          {},
          { $pull: { purchasedBooks: book._id, bookshelf: book._id } }
        );

        // Remove reading history entries for this book using $pull with book field
        await User.updateMany(
          { 'readingHistory.book': book._id },
          { $pull: { readingHistory: { book: book._id } } }
        );

        // Delete any gifts or lends involving this book
        await Gift.deleteMany({ book: book._id });
        await Lend.deleteMany({ book: book._id });

        await book.deleteOne();
      }));

      await publisher.deleteOne();
    }

    // 2. Delete all reviews written by this user
    await Review.deleteMany({ user: userId });

    // 3. Delete all gifts sent or received by this user
    await Gift.deleteMany({ $or: [{ sender: userId }, { recipient: userId }] });

    // 4. Delete all lends by or to this user
    await Lend.deleteMany({ $or: [{ lender: userId }, { borrower: userId }] });

    // 5. Remove this user's reading history entries from their own account
    // (already deleted with the user doc below, but clean up references in others)
    await User.updateMany(
      {},
      { $pull: { readingHistory: { book: { $in: [] } } } } // no-op placeholder
    );

    // 6. Delete profile picture from Cloudinary
    const user = await User.findById(userId);
    if (user?.picturePublicId) {
      await cloudinary.uploader.destroy(user.picturePublicId);
    }

    // 7. Delete the user
    await User.findByIdAndDelete(userId);

    return res.status(200).json({ success: true, message: "Account deleted successfully." });
  } catch (err) {
    console.error("Delete account error:", err);
    return res.status(500).json({ success: false, message: "Server error during deletion." });
  }
};