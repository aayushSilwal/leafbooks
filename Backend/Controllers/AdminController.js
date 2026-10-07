const User = require('../Models/Users');
const Publisher = require('../Models/Publisher');
const Book = require('../Models/Book');
const Review = require('../Models/Review');
const Order = require('../Models/Order');
const Gift = require('../Models/Gift');
const Lend = require('../Models/Lend');
const cloudinary = require('../config/cloudinary');
const jwt = require('jsonwebtoken');

// ── POST /api/admin/login ──────────────────────────────────
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD)
      return res.status(403).json({ success: false, message: "Invalid admin credentials." });

    const token = jwt.sign({ isAdmin: true, email }, process.env.JWT_SECRET, { expiresIn: '12h' });
    return res.status(200).json({ success: true, token });
  } catch {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── GET /api/admin/stats ───────────────────────────────────
exports.getAdminStats = async (req, res) => {
  try {
    const [totalUsers, totalPublishers, totalBooks, pendingPublishers, publishedBooks, totalOrders, totalRevenue] = await Promise.all([
      User.countDocuments(),
      Publisher.countDocuments(),
      Book.countDocuments(),
      Publisher.countDocuments({ approved: false }),
      Book.countDocuments({ status: 'published' }),
      Order.countDocuments({ status: 'completed' }),
      Order.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers, totalPublishers, totalBooks,
        pendingPublishers, publishedBooks,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── GET /api/admin/users ───────────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const query = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const [users, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 })
        .skip((page - 1) * limit).limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    return res.status(200).json({ success: true, users, total });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── GET /api/admin/users/:id/detail ───────────────────────
exports.getUserDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const [user, publisher, readingHistory, purchases, giftsSent, giftsReceived] = await Promise.all([
      User.findById(id).select('-password'),
      Publisher.findOne({ user: id }),
      Order.find({ user: id, status: 'completed' })
        .populate('book', 'title author coverImage')
        .sort({ createdAt: -1 })
        .limit(50),
      Order.find({ user: id, status: 'completed' })
        .populate('book', 'title author coverImage')
        .sort({ createdAt: -1 }),
      Gift.find({ sender: id })
        .populate('book', 'title author coverImage')
        .populate('recipient', 'name email picture')
        .sort({ createdAt: -1 }),
      Gift.find({ recipient: id })
        .populate('book', 'title author coverImage')
        .populate('sender', 'name email picture')
        .sort({ createdAt: -1 }),
    ]); 

    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    let publishedBooks = [];
    if (publisher) {
      publishedBooks = await Book.find({ publisher: publisher._id })
        .select('title author coverImage genre price isFree status')
        .sort({ createdAt: -1 });
    }

    // Reading history from user's bookshelf or re-use orders as a proxy
    // Adapt this if you have a dedicated ReadingHistory model
    const readingHistoryData = await Order.find({ user: id, status: 'completed' })
      .populate('book', 'title author coverImage')
      .sort({ updatedAt: -1 })
      .limit(30);

    return res.status(200).json({
      success: true,
      user,
      publisher,
      publishedBooks,
      readingHistory: readingHistoryData.map(o => ({
        book: o.book,
        readAt: o.updatedAt,
      })),
      purchases: purchases.map(o => ({
        book: o.book,
        price: o.amount,
        purchasedAt: o.createdAt,
      })),
      giftsSent: giftsSent.map(g => ({
        book: g.book,
        recipient: g.recipient,
        giftedAt: g.createdAt,
        status: g.status,
      })),
      giftsReceived: giftsReceived.map(g => ({
        book: g.book,
        sender: g.sender,
        giftedAt: g.createdAt,
        status: g.status,
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── DELETE /api/admin/users/:id ────────────────────────────
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const publisher = await Publisher.findOne({ user: userId });
    if (publisher) {
      const books = await Book.find({ publisher: publisher._id });
      await Promise.all(books.map(async (book) => {
        await Promise.allSettled([
          cloudinary.uploader.destroy(book.coverImage?.publicId),
          cloudinary.uploader.destroy(book.bookFile?.publicId, { resource_type: 'raw' }),
        ]);
        await Review.deleteMany({ book: book._id });
        await User.updateMany({}, { $pull: { purchasedBooks: book._id, bookshelf: book._id } });
        await book.deleteOne();
      }));
      await publisher.deleteOne();
    }

    await Review.deleteMany({ user: userId });
    await Order.deleteMany({ user: userId });
    await Gift.deleteMany({ $or: [{ sender: userId }, { recipient: userId }] });
    await Lend.deleteMany({ $or: [{ lender: userId }, { borrower: userId }] });
    if (user.picturePublicId) await cloudinary.uploader.destroy(user.picturePublicId);
    await User.findByIdAndDelete(userId);

    return res.status(200).json({ success: true, message: "User deleted." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── GET /api/admin/publishers ──────────────────────────────
exports.getPublishers = async (req, res) => {
  try {
    const { filter = 'pending' } = req.query;
    const query = filter === 'pending' ? { approved: false }
                : filter === 'approved' ? { approved: true } : {};

    const publishers = await Publisher.find(query)
      .populate('user', 'name email picture createdAt')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, publishers });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── PATCH /api/admin/publishers/:id/approve ────────────────
exports.approvePublisher = async (req, res) => {
  try {
    const { approved } = req.body;
    const publisher = await Publisher.findById(req.params.id).populate('user', 'name email');
    if (!publisher) return res.status(404).json({ success: false, message: "Publisher not found." });

    publisher.approved = approved;
    await publisher.save();

    if (approved) {
      await User.findByIdAndUpdate(publisher.user._id, { role: 'publisher' });
    } else {
      await User.findByIdAndUpdate(publisher.user._id, { role: 'user', publisherProfile: null });
      await publisher.deleteOne();
    }

    return res.status(200).json({
      success: true,
      message: approved ? "Publisher approved!" : "Publisher rejected and removed."
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── GET /api/admin/books ───────────────────────────────────
exports.getBooks = async (req, res) => {
  try {
    const { filter = 'all' } = req.query;
    const query = filter === 'published' ? { status: 'published' }
                : filter === 'draft'     ? { status: 'draft' } : {};

    const books = await Book.find(query)
      .populate('publisher', 'publisherName')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, books });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── DELETE /api/admin/books/:id ────────────────────────────
exports.adminDeleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ success: false, message: "Book not found." });

    await Promise.allSettled([
      cloudinary.uploader.destroy(book.coverImage?.publicId),
      cloudinary.uploader.destroy(book.bookFile?.publicId, { resource_type: 'raw' }),
    ]);

    await Review.deleteMany({ book: book._id });
    await Order.deleteMany({ book: book._id });
    await Gift.deleteMany({ book: book._id });
    await Lend.deleteMany({ book: book._id });
    await User.updateMany({}, { $pull: { purchasedBooks: book._id, bookshelf: book._id } });
    await book.deleteOne();

    return res.status(200).json({ success: true, message: "Book deleted." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── GET /api/admin/orders ──────────────────────────────────
exports.getOrders = async (req, res) => {
  try {
    const { filter = 'all' } = req.query;
    const query = filter === 'all' ? {} : { status: filter };

    const orders = await Order.find(query)
      .populate('user', 'name email picture')
      .populate('book', 'title author coverImage')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── GET /api/admin/revenue ─────────────────────────────────
exports.getRevenue = async (req, res) => {
  try {
    const [totalAgg, monthlyAgg, topBooksAgg] = await Promise.all([
      Order.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            revenue: { $sum: '$amount' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
      ]),
      Order.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: '$book', revenue: { $sum: '$amount' }, sales: { $sum: 1 } } },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'book' } },
        { $unwind: '$book' },
        { $project: { title: '$book.title', revenue: 1, sales: 1 } }
      ])
    ]);

    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthlyRevenue = monthlyAgg.map(m => ({
      month: `${MONTHS[m._id.month - 1]} ${m._id.year}`,
      revenue: m.revenue,
      orders: m.orders,
    }));

    return res.status(200).json({
      success: true,
      totalRevenue: totalAgg[0]?.total || 0,
      totalOrders: totalAgg[0]?.count || 0,
      monthlyRevenue,
      topBooks: topBooksAgg,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── GET /api/admin/reviews ─────────────────────────────────
exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'name email picture')
      .populate('book', 'title author coverImage')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, reviews });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── DELETE /api/admin/reviews/:id ─────────────────────────
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found." });
    return res.status(200).json({ success: true, message: "Review deleted." });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── GET /api/admin/lends ───────────────────────────────────
exports.getLends = async (req, res) => {
  try {
    const { filter = 'all' } = req.query;
    const query = filter === 'all' ? {} : { status: filter };

    const lends = await Lend.find(query)
      .populate('book', 'title author coverImage')
      .populate('lender', 'name email picture')
      .populate('borrower', 'name email picture')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, lends });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── GET /api/admin/gifts ───────────────────────────────────
exports.getGifts = async (req, res) => {
  try {
    const { filter = 'all' } = req.query;
    const query = filter === 'all' ? {} : { status: filter };

    const gifts = await Gift.find(query)
      .populate('book', 'title author coverImage')
      .populate('sender', 'name email picture')
      .populate('recipient', 'name email picture')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, gifts });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};