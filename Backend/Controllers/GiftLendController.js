const Gift = require('../Models/Gift');
const Lend = require('../Models/Lend');
const User = require('../Models/Users');
const Book = require('../Models/Book');

// ── Helper: check full read access ────────────────────────
exports.userHasAccess = async (userId, bookId) => {
  const user = await User.findById(userId).select('purchasedBooks');

  // Owns it
  if (user?.purchasedBooks?.some(id => id.toString() === bookId.toString())) return true;

  // Accepted gift
  const gift = await Gift.findOne({ book: bookId, recipient: userId, status: 'accepted' });
  if (gift) return true;

  // Active lend
  const lend = await Lend.findOne({
    book: bookId,
    borrower: userId,
    status: 'active',
    expiresAt: { $gt: new Date() }
  });
  if (lend) return true;

  return false;
};
 
// ── Check Access ───────────────────────────────────────────
// GET /api/gifting/check-access/:bookId
exports.checkAccess = async (req, res) => {
  try {
    const hasAccess = await exports.userHasAccess(req.user._id, req.params.bookId);
    return res.status(200).json({ success: true, hasAccess });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── GIFT ───────────────────────────────────────────────────
// POST /api/gifting/send
exports.sendGift = async (req, res) => {
  try {
    const { bookId, recipientEmail, message } = req.body;

    if (!recipientEmail?.trim())
      return res.status(400).json({ success: false, message: "Recipient email is required." });

    const recipient = await User.findOne({ email: recipientEmail.toLowerCase().trim() });
    if (!recipient)
      return res.status(404).json({ success: false, message: "No user found with that email." });

    if (recipient._id.toString() === req.user._id.toString())
      return res.status(400).json({ success: false, message: "You can't gift a book to yourself." });

    // Check sender owns book
    const sender = await User.findById(req.user._id).select('purchasedBooks');
    const owns = sender?.purchasedBooks?.some(id => id.toString() === bookId);
    if (!owns)
      return res.status(403).json({ success: false, message: "You don't own this book." });

    // Check recipient doesn't already own it
    const recipientUser = await User.findById(recipient._id).select('purchasedBooks');
    const recipientOwns = recipientUser?.purchasedBooks?.some(id => id.toString() === bookId);
    if (recipientOwns)
      return res.status(400).json({ success: false, message: "This user already owns this book." });

    // Check no pending gift already exists
    const existing = await Gift.findOne({ book: bookId, sender: req.user._id, status: 'pending' });
    if (existing)
      return res.status(400).json({ success: false, message: "You already have a pending gift for this book." });

    const gift = await Gift.create({
      book: bookId,
      sender: req.user._id,
      recipient: recipient._id,
      message: message?.trim() || ''
    });

    return res.status(201).json({ success: true, message: `Gift sent to ${recipient.name}!`, gift });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// GET /api/gifting/received
exports.getReceivedGifts = async (req, res) => {
  try {
    const gifts = await Gift.find({ recipient: req.user._id, status: 'pending' })
      .populate('book', 'title coverImage author')
      .populate('sender', 'name picture email')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, gifts });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// GET /api/gifting/sent
exports.getSentGifts = async (req, res) => {
  try {
    const gifts = await Gift.find({ sender: req.user._id })
      .populate('book', 'title coverImage author')
      .populate('recipient', 'name picture email')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, gifts });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// PATCH /api/gifting/:id/respond — accept or decline
exports.respondToGift = async (req, res) => {
  try {
    const { action } = req.body;
    if (!['accepted', 'declined'].includes(action))
      return res.status(400).json({ success: false, message: "Invalid action." });

    const gift = await Gift.findOne({ _id: req.params.id, recipient: req.user._id, status: 'pending' });
    if (!gift)
      return res.status(404).json({ success: false, message: "Gift not found." });

    if (action === 'accepted') {
      // Transfer ownership — remove from sender, add to recipient
      await User.findByIdAndUpdate(gift.sender, {
        $pull: { purchasedBooks: gift.book, bookshelf: gift.book }
      });
      await User.findByIdAndUpdate(gift.recipient, {
        $addToSet: { purchasedBooks: gift.book }
      });
    }

    gift.status = action;
    await gift.save();

    return res.status(200).json({
      success: true,
      message: action === 'accepted'
        ? "Gift accepted! Book added to your library. It has been removed from the sender."
        : "Gift declined."
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── LEND ───────────────────────────────────────────────────
// POST /api/gifting/lend
exports.lendBook = async (req, res) => {
  try {
    const { bookId, borrowerEmail } = req.body;

    if (!borrowerEmail?.trim())
      return res.status(400).json({ success: false, message: "Borrower email is required." });

    const borrower = await User.findOne({ email: borrowerEmail.toLowerCase().trim() });
    if (!borrower)
      return res.status(404).json({ success: false, message: "No user found with that email." });

    if (borrower._id.toString() === req.user._id.toString())
      return res.status(400).json({ success: false, message: "You can't lend a book to yourself." });

    // Check lender owns book
    const lender = await User.findById(req.user._id).select('purchasedBooks');
    const owns = lender?.purchasedBooks?.some(id => id.toString() === bookId);
    if (!owns)
      return res.status(403).json({ success: false, message: "You don't own this book." });

    // Check no active lend to this person
    const existing = await Lend.findOne({
      book: bookId,
      lender: req.user._id,
      borrower: borrower._id,
      status: 'active'
    });
    if (existing)
      return res.status(400).json({ success: false, message: "You're already lending this book to this user." });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const lend = await Lend.create({
      book: bookId,
      lender: req.user._id,
      borrower: borrower._id,
      expiresAt,
      status: 'active'
    });

    return res.status(201).json({
      success: true,
      message: `Book lent to ${borrower.name} for 7 days!`,
      lend
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// GET /api/gifting/borrowed — books borrowed by logged-in user
exports.getBorrowedBooks = async (req, res) => {
  try {
    // Auto-expire old lends
    await Lend.updateMany(
      { borrower: req.user._id, status: 'active', expiresAt: { $lt: new Date() } },
      { status: 'expired' }
    );

    const lends = await Lend.find({ borrower: req.user._id, status: 'active' })
      .populate('book', 'title coverImage author genre')
      .populate('lender', 'name picture')
      .sort({ expiresAt: 1 });

    return res.status(200).json({ success: true, lends });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// GET /api/gifting/lent-out — books lender has lent
exports.getLentBooks = async (req, res) => {
  try {
    await Lend.updateMany(
      { lender: req.user._id, status: 'active', expiresAt: { $lt: new Date() } },
      { status: 'expired' }
    );

    const lends = await Lend.find({ lender: req.user._id, status: 'active' })
      .populate('book', 'title coverImage author')
      .populate('borrower', 'name picture email')
      .sort({ expiresAt: 1 });

    return res.status(200).json({ success: true, lends });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// DELETE /api/gifting/lend/:id/return — early return
exports.returnBook = async (req, res) => {
  try {
    const lend = await Lend.findOne({
      _id: req.params.id,
      $or: [{ lender: req.user._id }, { borrower: req.user._id }],
      status: 'active'
    });

    if (!lend) return res.status(404).json({ success: false, message: "Lend record not found." });

    lend.status = 'returned';
    await lend.save();

    return res.status(200).json({ success: true, message: "Book returned successfully." });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};