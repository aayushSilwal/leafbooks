const cloudinary = require('../config/cloudinary');
const Book = require('../Models/Book');
const Publisher = require('../Models/Publisher');

// Upload a book
exports.uploadBook = async (req, res) => {
  try {
    const { title, author, description, genre, tags, price, isFree, status } = req.body;

    // Validate required fields
    if (!title || !author || !description || !genre) {
      return res.status(400).json({ success: false, message: "Title, author, description and genre are required." });
    }

    if (!req.files?.cover || !req.files?.bookFile) {
      return res.status(400).json({ success: false, message: "Cover image and book file are required." });
    }

    // Find publisher profile
    const publisher = await Publisher.findOne({ user: req.user._id });
    if (!publisher) {
      return res.status(403).json({ success: false, message: "You are not a publisher." });
    }

    // Upload cover image to Cloudinary
    const coverUpload = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'leafbooks/covers', transformation: [{ width: 600, height: 900, crop: 'fill' }] },
        (err, result) => err ? reject(err) : resolve(result)
      );
      stream.end(req.files.cover[0].buffer);
    });

    // Upload book file to Cloudinary
    const bookUpload = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'leafbooks/books', resource_type: 'raw' },
        (err, result) => err ? reject(err) : resolve(result)
      );
      stream.end(req.files.bookFile[0].buffer);
    });

    // Parse tags
    const parsedTags = tags
      ? tags.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    // Create book
    const book = new Book({
      title: title.trim(),
      author: author.trim(),
      description: description.trim(),
      genre,
      tags: parsedTags,
      price: isFree === 'true' ? 0 : parseFloat(price) || 0,
      isFree: isFree === 'true',
      coverImage: { url: coverUpload.secure_url, publicId: coverUpload.public_id },
      bookFile: { url: bookUpload.secure_url, publicId: bookUpload.public_id },
      publisher: publisher._id,
      uploadedBy: req.user._id,
      status: status === 'published' ? 'published' : 'draft',
    });

    await book.save();

    return res.status(201).json({
      success: true,
      message: status === 'published' ? "Book published successfully!" : "Book saved as draft.",
      book
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error during upload." });
  }
};

// Get all books by the logged-in publisher
exports.getMyBooks = async (req, res) => {
  try {
    const publisher = await Publisher.findOne({ user: req.user._id });
    if (!publisher) return res.status(403).json({ success: false, message: "Not a publisher." });

    const books = await Book.find({ publisher: publisher._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, books });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// GET /api/books/home — returns trending, free, and recommended books
exports.getHomeBooks = async (req, res) => {
  try {
    const [trending, freeBooks, recent] = await Promise.all([
      Book.find({ status: 'published' })
        .sort({ totalSales: -1, totalBorrows: -1 })
        .limit(8)
        .populate('publisher', 'publisherName'),

      Book.find({ status: 'published', isFree: true })
        .sort({ createdAt: -1 })
        .limit(8)
        .populate('publisher', 'publisherName'),

      Book.find({ status: 'published' })
        .sort({ createdAt: -1 })
        .limit(8)
        .populate('publisher', 'publisherName'),
    ]);

    return res.status(200).json({ success: true, trending, freeBooks, recommended: recent });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// GET /api/books/:id — single book detail
exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('publisher', 'publisherName bio')
      .populate('uploadedBy', 'name');

    if (!book || book.status !== 'published') {
      return res.status(404).json({ success: false, message: "Book not found." });
    }

    return res.status(200).json({ success: true, book });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// GET /api/books/bookshelf — returns user's bookshelf
exports.getBookshelf = async (req, res) => {
  try {
    const user = await require('../Models/Users').findById(req.user._id)
      .populate({
        path: 'bookshelf',
        populate: { path: 'publisher', select: 'publisherName' }
      });

    return res.status(200).json({ success: true, bookshelf: user.bookshelf || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// POST /api/books/bookshelf/add — add book to bookshelf
exports.addToBookshelf = async (req, res) => {
  try {
    const { bookId } = req.body;
    const User = require('../Models/Users');
    const user = await User.findById(req.user._id);

    if (user.bookshelf?.includes(bookId)) {
      return res.status(400).json({ success: false, message: "Already in bookshelf." });
    }

    await User.findByIdAndUpdate(req.user._id, { $addToSet: { bookshelf: bookId } });
    return res.status(200).json({ success: true, message: "Added to bookshelf!" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// DELETE /api/books/bookshelf/remove — remove book from bookshelf
exports.removeFromBookshelf = async (req, res) => {
  try {
    const { bookId } = req.body;
    await require('../Models/Users').findByIdAndUpdate(
      req.user._id,
      { $pull: { bookshelf: bookId } }
    );
    return res.status(200).json({ success: true, message: "Removed from bookshelf." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// GET /api/books/store — paginated, filtered, sorted books
exports.getStoreBooks = async (req, res) => {
  try {
    const {
      search = "",
      genre = "",
      sort = "newest",
      page = 1,
      limit = 18
    } = req.query;

    const query = { status: 'published' };

    if (search.trim()) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
      ];
    }

    if (genre && genre !== 'All') query.genre = genre;

    const sortMap = {
      newest:  { createdAt: -1 },
      popular: { totalSales: -1, totalBorrows: -1 },
      price_asc:  { price: 1 },
      price_desc: { price: -1 },
    };

    const sortOption = sortMap[sort] || sortMap.newest;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [books, total] = await Promise.all([
      Book.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('publisher', 'publisherName'),
      Book.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      books,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// POST /api/books/purchase — mock purchase, records ownership
exports.purchaseBook = async (req, res) => {
  try {
    const { bookId } = req.body;
    const User = require('../Models/Users');

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ success: false, message: "Book not found." });
    if (book.status !== 'published') return res.status(400).json({ success: false, message: "Book not available." });

    const user = await User.findById(req.user._id);

    // Check if already purchased
    if (user.purchasedBooks?.includes(bookId)) {
      return res.status(400).json({ success: false, message: "You already own this book." });
    }

    // Record purchase + add to bookshelf
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { purchasedBooks: bookId, bookshelf: bookId }
    });

    // Increment sales count
    await Book.findByIdAndUpdate(bookId, { $inc: { totalSales: 1 } });

    return res.status(200).json({ success: true, message: "Purchase successful! Book added to your bookshelf." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// GET /api/books/owned — check which books user owns
exports.getOwnedBooks = async (req, res) => {
  try {
    const User = require('../Models/Users');
    const user = await User.findById(req.user._id).select('purchasedBooks');
    return res.status(200).json({ success: true, purchasedBooks: user.purchasedBooks || [] });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// GET /api/books/library — purchased books + reading history
exports.getLibrary = async (req, res) => {
  try {
    const User = require('../Models/Users');
    const user = await User.findById(req.user._id)
      .populate({
        path: 'purchasedBooks',
        populate: { path: 'publisher', select: 'publisherName' }
      })
      .populate({
        path: 'readingHistory.book',
        populate: { path: 'publisher', select: 'publisherName' }
      });

    // Filter out reading history entries where the book was deleted (null)
    const validReadingHistory = (user.readingHistory || []).filter(h => h.book != null);

    // Also clean up stale entries from DB so they don't accumulate
    if (validReadingHistory.length !== (user.readingHistory || []).length) {
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { readingHistory: { book: null } }
      });
    }

    return res.status(200).json({
      success: true,
      purchasedBooks: (user.purchasedBooks || []).filter(b => b != null),
      readingHistory: validReadingHistory
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// POST /api/books/reading-history — log a book read
exports.logReadingHistory = async (req, res) => {
  try {
    const { bookId } = req.body;
    const User = require('../Models/Users');

    // Update last read or push new entry
    const user = await User.findById(req.user._id);
    const existing = user.readingHistory?.find(r => r.book?.toString() === bookId);

    if (existing) {
      await User.updateOne(
        { _id: req.user._id, 'readingHistory.book': bookId },
        { $set: { 'readingHistory.$.lastRead': new Date() }, $inc: { 'readingHistory.$.timesRead': 1 } }
      );
    } else {
      await User.findByIdAndUpdate(req.user._id, {
        $push: { readingHistory: { book: bookId, lastRead: new Date(), timesRead: 1 } }
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// PATCH /api/books/:id/status — toggle publish/unpublish
exports.toggleBookStatus = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ success: false, message: "Book not found." });

    const publisher = await require('../Models/Publisher').findOne({ user: req.user._id });
    if (!publisher || book.publisher.toString() !== publisher._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    book.status = book.status === 'published' ? 'draft' : 'published';
    await book.save();

    return res.status(200).json({ success: true, status: book.status, message: `Book ${book.status === 'published' ? 'published' : 'unpublished'}.` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// DELETE /api/books/:id — delete a book
exports.deleteBook = async (req, res) => {
  try {
    const cloudinary = require('../config/cloudinary');
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ success: false, message: "Book not found." });

    const publisher = await require('../Models/Publisher').findOne({ user: req.user._id });
    if (!publisher || book.publisher.toString() !== publisher._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    // Delete files from Cloudinary
    await Promise.all([
      cloudinary.uploader.destroy(book.coverImage.publicId),
      cloudinary.uploader.destroy(book.bookFile.publicId, { resource_type: 'raw' }),
    ]);

    await book.deleteOne();

    return res.status(200).json({ success: true, message: "Book deleted." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// PATCH /api/books/:id — edit book details
exports.editBook = async (req, res) => {
  try {
    const cloudinary = require('../config/cloudinary');
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ success: false, message: "Book not found." });

    const publisher = await require('../Models/Publisher').findOne({ user: req.user._id });
    if (!publisher || book.publisher.toString() !== publisher._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    const { title, author, description, genre, tags, price, isFree } = req.body;

    // Update text fields
    if (title)       book.title       = title.trim();
    if (author)      book.author      = author.trim();
    if (description) book.description = description.trim();
    if (genre)       book.genre       = genre;
    if (tags !== undefined) book.tags = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (isFree !== undefined) {
      book.isFree = isFree === 'true';
      book.price  = isFree === 'true' ? 0 : parseFloat(price) || book.price;
    } else if (price !== undefined) {
      book.price = parseFloat(price) || 0;
    }

    // Replace cover image if new one uploaded
    if (req.files?.cover?.[0]) {
      // Delete old cover
      await cloudinary.uploader.destroy(book.coverImage.publicId);
      // Upload new cover
      const coverUpload = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'leafbooks/covers', transformation: [{ width: 600, height: 900, crop: 'fill' }] },
          (err, result) => err ? reject(err) : resolve(result)
        );
        stream.end(req.files.cover[0].buffer);
      });
      book.coverImage = { url: coverUpload.secure_url, publicId: coverUpload.public_id };
    }

    await book.save();

    return res.status(200).json({ success: true, message: "Book updated successfully!", book });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// PATCH /api/books/:id — edit book details
exports.editBook = async (req, res) => {
  try {
    const { title, author, description, genre, tags, price, isFree } = req.body;
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ success: false, message: "Book not found." });

    const publisher = await require('../Models/Publisher').findOne({ user: req.user._id });
    if (!publisher || book.publisher.toString() !== publisher._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    // Update text fields
    if (title)       book.title       = title.trim();
    if (author)      book.author      = author.trim();
    if (description) book.description = description.trim();
    if (genre)       book.genre       = genre;
    if (tags)        book.tags        = tags.split(',').map(t => t.trim()).filter(Boolean);
    book.isFree = isFree === 'true';
    book.price  = book.isFree ? 0 : parseFloat(price) || 0;

    // Replace cover image if new one uploaded
    if (req.file) {
      const cloudinary = require('../config/cloudinary');
      // Delete old cover
      await cloudinary.uploader.destroy(book.coverImage.publicId);
      // Upload new cover
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'leafbooks/covers', transformation: [{ width: 600, height: 900, crop: 'fill' }] },
          (err, res) => err ? reject(err) : resolve(res)
        );
        stream.end(req.file.buffer);
      });
      book.coverImage = { url: result.secure_url, publicId: result.public_id };
    }

    await book.save();
    return res.status(200).json({ success: true, message: "Book updated successfully!", book });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// GET /api/books/:id/edit — get book for editing (publisher only)
exports.getBookForEdit = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ success: false, message: "Book not found." });

    const publisher = await require('../Models/Publisher').findOne({ user: req.user._id });
    if (!publisher || book.publisher.toString() !== publisher._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    return res.status(200).json({ success: true, book });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// PATCH /api/books/:id/edit — update book details
exports.editBook = async (req, res) => {
  try {
    const cloudinary = require('../config/cloudinary');
    const { title, author, description, genre, tags, price, isFree } = req.body;

    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ success: false, message: "Book not found." });

    const publisher = await require('../Models/Publisher').findOne({ user: req.user._id });
    if (!publisher || book.publisher.toString() !== publisher._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    // Update text fields
    if (title)       book.title       = title.trim();
    if (author)      book.author      = author.trim();
    if (description) book.description = description.trim();
    if (genre)       book.genre       = genre;
    if (tags !== undefined) book.tags = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (isFree !== undefined) book.isFree = isFree === 'true';
    if (!book.isFree && price) book.price = parseFloat(price);
    if (book.isFree) book.price = 0;

    // Replace cover image if new one uploaded
    if (req.file) {
      // Delete old cover
      await cloudinary.uploader.destroy(book.coverImage.publicId);

      // Upload new cover
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'leafbooks/covers', transformation: [{ width: 600, height: 900, crop: 'fill' }] },
          (err, result) => err ? reject(err) : resolve(result)
        );
        stream.end(req.file.buffer);
      });

      book.coverImage = { url: result.secure_url, publicId: result.public_id };
    }

    await book.save();

    return res.status(200).json({ success: true, message: "Book updated successfully!", book });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// GET /api/books/:id/edit — get book for editing (publisher only)
exports.getBookForEdit = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ success: false, message: "Book not found." });

    const publisher = await require('../Models/Publisher').findOne({ user: req.user._id });
    if (!publisher || book.publisher.toString() !== publisher._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    return res.status(200).json({ success: true, book });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// PUT /api/books/:id — update book
exports.updateBook = async (req, res) => {
  try {
    const cloudinary = require('../config/cloudinary');
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ success: false, message: "Book not found." });

    const publisher = await require('../Models/Publisher').findOne({ user: req.user._id });
    if (!publisher || book.publisher.toString() !== publisher._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    const { title, author, description, genre, tags, price, isFree } = req.body;

    // Update text fields
    if (title) book.title = title.trim();
    if (author) book.author = author.trim();
    if (description) book.description = description.trim();
    if (genre) book.genre = genre;
    if (tags !== undefined) book.tags = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (isFree !== undefined) book.isFree = isFree === 'true';
    if (!book.isFree && price !== undefined) book.price = parseFloat(price) || 0;
    if (book.isFree) book.price = 0;

    // Replace cover image if new one uploaded
    if (req.files?.cover?.[0]) {
      await cloudinary.uploader.destroy(book.coverImage.publicId);
      const coverUpload = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'leafbooks/covers', transformation: [{ width: 600, height: 900, crop: 'fill' }] },
          (err, result) => err ? reject(err) : resolve(result)
        );
        stream.end(req.files.cover[0].buffer);
      });
      book.coverImage = { url: coverUpload.secure_url, publicId: coverUpload.public_id };
    }

    // Replace book file if new one uploaded
    if (req.files?.bookFile?.[0]) {
      await cloudinary.uploader.destroy(book.bookFile.publicId, { resource_type: 'raw' });
      const bookUpload = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'leafbooks/books', resource_type: 'raw' },
          (err, result) => err ? reject(err) : resolve(result)
        );
        stream.end(req.files.bookFile[0].buffer);
      });
      book.bookFile = { url: bookUpload.secure_url, publicId: bookUpload.public_id };
    }

    await book.save();

    return res.status(200).json({ success: true, message: "Book updated successfully!", book });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};


// GET /api/books/publisher-stats — dashboard stats + analytics for publisher
exports.getPublisherStats = async (req, res) => {
  try {
    const Publisher = require('../Models/Publisher');
    const Order = require('../Models/Order');

    const publisher = await Publisher.findOne({ user: req.user._id });
    if (!publisher) return res.status(403).json({ success: false, message: "Not a publisher." });

    const books = await Book.find({ publisher: publisher._id }).sort({ createdAt: -1 });
    const bookIds = books.map(b => b._id);

    const totalBooks = books.length;
    const published  = books.filter(b => b.status === 'published').length;
    const drafts     = books.filter(b => b.status === 'draft').length;
    const totalBorrows = books.reduce((sum, b) => sum + (b.totalBorrows || 0), 0);

    // Sales + earnings from completed orders only
    const [salesAgg, earningsAgg, perBookSales] = await Promise.all([
      Order.aggregate([
        { $match: { book: { $in: bookIds }, status: 'completed' } },
        { $group: { _id: null, count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        { $match: { book: { $in: bookIds }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Order.aggregate([
        { $match: { book: { $in: bookIds }, status: 'completed' } },
        { $group: { _id: '$book', sales: { $sum: 1 } } }
      ])
    ]);

    const totalSales    = salesAgg[0]?.count || 0;
    const totalEarnings = earningsAgg[0]?.total || 0;

    // Map per-book sales from orders
    const salesByBook = {};
    perBookSales.forEach(s => { salesByBook[s._id.toString()] = s.sales; });

    // Top books by sales (using real order counts)
    const topBySales = [...books]
      .map(b => ({
        _id: b._id,
        title: b.title,
        coverImage: b.coverImage,
        totalSales: salesByBook[b._id.toString()] || 0,
        totalBorrows: b.totalBorrows || 0,
        price: b.price,
        isFree: b.isFree
      }))
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5);

    // Genre breakdown (published books only)
    const genreMap = {};
    books.forEach(b => {
      if (b.status === 'published') {
        genreMap[b.genre] = (genreMap[b.genre] || 0) + 1;
      }
    });
    const genreBreakdown = Object.entries(genreMap)
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count);

    // Recent books for quick access
    const recentBooks = books.slice(0, 4).map(b => ({
      ...b.toObject(),
      totalSales: salesByBook[b._id.toString()] || 0
    }));

    return res.status(200).json({
      success: true,
      stats: { totalBooks, published, drafts, totalSales, totalBorrows, totalEarnings },
      topBySales,
      genreBreakdown,
      recentBooks
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};