const Review = require('../Models/Review');
const User = require('../Models/Users');

// POST /api/reviews/:bookId — add or update a review
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const { bookId } = req.params;

    if (!rating || !comment?.trim()) {
      return res.status(400).json({ success: false, message: "Rating and comment are required." });
    }

    // Check user owns the book
    const user = await User.findById(req.user._id);
    if (!user.purchasedBooks?.includes(bookId)) {
      return res.status(403).json({ success: false, message: "You must own this book to review it." });
    }

    // Upsert — update if exists, create if not
    const review = await Review.findOneAndUpdate(
      { book: bookId, user: req.user._id },
      { rating, comment: comment.trim() },
      { upsert: true, new: true }
    ).populate('user', 'name picture');

    return res.status(200).json({ success: true, message: "Review submitted!", review });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// GET /api/reviews/:bookId — get all reviews for a book
exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ book: req.params.bookId })
      .populate('user', 'name picture')
      .sort({ createdAt: -1 });

    const avgRating = reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

    return res.status(200).json({ success: true, reviews, avgRating, total: reviews.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// DELETE /api/reviews/:bookId — delete own review
exports.deleteReview = async (req, res) => {
  try {
    await Review.findOneAndDelete({ book: req.params.bookId, user: req.user._id });
    return res.status(200).json({ success: true, message: "Review deleted." });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};