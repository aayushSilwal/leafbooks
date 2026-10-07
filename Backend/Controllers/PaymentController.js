const crypto = require('crypto');
const axios = require('axios');
const Order = require('../Models/Order');
const Book = require('../Models/Book');
const User = require('../Models/Users');

const generateSignature = (message) => {
  const secret = process.env.ESEWA_SECRET_KEY;
  return crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('base64');
};

const generateTransactionId = () => {
  return `LB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

// POST /api/payment/initiate
exports.initiatePayment = async (req, res) => {
  try {
    const { bookId } = req.body;

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ success: false, message: "Book not found." });
    if (book.isFree) return res.status(400).json({ success: false, message: "This book is free." });
    if (book.status !== 'published') return res.status(400).json({ success: false, message: "Book not available." });

    const user = await User.findById(req.user._id).select('purchasedBooks');
    if (user.purchasedBooks?.some(id => id.toString() === bookId)) {
      return res.status(400).json({ success: false, message: "You already own this book." });
    }

    const transactionId = generateTransactionId();
    const amount = parseFloat(book.price.toFixed(2));

    await Order.create({
      user: req.user._id,
      book: bookId,
      amount,
      transactionId,
      status: 'pending'
    });

    const signatureMessage = `total_amount=${amount},transaction_uuid=${transactionId},product_code=${process.env.ESEWA_MERCHANT_ID}`;
    const signature = generateSignature(signatureMessage);

    return res.status(200).json({
      success: true,
      paymentData: {
        amount: String(amount),
        tax_amount: "0",
        total_amount: String(amount),
        transaction_uuid: transactionId,
        product_code: process.env.ESEWA_MERCHANT_ID,
        product_service_charge: "0",
        product_delivery_charge: "0",
        success_url: process.env.ESEWA_SUCCESS_URL,
        failure_url: process.env.ESEWA_FAILURE_URL,
        signed_field_names: "total_amount,transaction_uuid,product_code",
        signature,
      },
      esewaUrl: `${process.env.ESEWA_BASE_URL}/api/epay/main/v2/form`,
    });
  } catch (err) {
    console.error("Payment initiation error:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// GET /api/payment/verify
exports.verifyPayment = async (req, res) => {
  try {
    const data = req.query.data || req.body.data;

    if (!data) {
      return res.redirect(`${process.env.CLIENT_URL}/payment/failure?reason=no_data`);
    }

    let decoded;
    try {
      decoded = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
    } catch (e) {
      return res.redirect(`${process.env.CLIENT_URL}/payment/failure?reason=bad_encoding`);
    }

    const {
      transaction_uuid,
      status,
      total_amount,
      transaction_code,
      signed_field_names,
      signature: receivedSignature
    } = decoded;

    // Verify signature
    const signatureMessage = signed_field_names
      .split(',')
      .map(field => `${field}=${decoded[field]}`)
      .join(',');

    const expectedSignature = generateSignature(signatureMessage);
    if (expectedSignature !== receivedSignature) {
      console.error("Signature mismatch:", { expected: expectedSignature, received: receivedSignature });
      return res.redirect(`${process.env.CLIENT_URL}/payment/failure?reason=signature_mismatch`);
    }

    if (status !== 'COMPLETE') {
      await Order.findOneAndUpdate({ transactionId: transaction_uuid }, { status: 'failed' });
      return res.redirect(`${process.env.CLIENT_URL}/payment/failure?reason=not_complete`);
    }

    // Cross-verify with eSewa status API
    let verifyRes;
    try {
      verifyRes = await axios.get(
        `${process.env.ESEWA_BASE_URL}/api/epay/transaction/status/`,
        {
          params: {
            product_code: process.env.ESEWA_MERCHANT_ID,
            transaction_uuid,
            total_amount,
          }
        }
      );
    } catch (axiosErr) {
      console.error("eSewa status API error:", axiosErr.response?.data || axiosErr.message);
      return res.redirect(`${process.env.CLIENT_URL}/payment/failure?reason=esewa_unreachable`);
    }

    if (verifyRes.data.status !== 'COMPLETE') {
      console.error("eSewa status check failed:", verifyRes.data);
      return res.redirect(`${process.env.CLIENT_URL}/payment/failure?reason=esewa_rejected`);
    }

    // Duplicate callback check
    const existing = await Order.findOne({ transactionId: transaction_uuid, status: 'completed' });
    if (existing) {
      // Use total_amount from eSewa as the reliable source
      const amt = parseFloat(total_amount);
      return res.redirect(
        `${process.env.CLIENT_URL}/payment/success?bookId=${existing.book}&txnId=${transaction_uuid}&esewaRef=${existing.esewaRefId}&amount=${amt}`
      );
    }

    // Update order to completed
    const order = await Order.findOneAndUpdate(
      { transactionId: transaction_uuid, status: 'pending' },
      { status: 'completed', esewaRefId: transaction_code },
      { new: true }
    );

    if (!order) {
      return res.redirect(`${process.env.CLIENT_URL}/payment/failure?reason=order_not_found`);
    }

    await User.findByIdAndUpdate(order.user, {
      $addToSet: { purchasedBooks: order.book, bookshelf: order.book }
    });

    await Book.findByIdAndUpdate(order.book, { $inc: { totalSales: 1 } });

    // Use total_amount from eSewa — this is the verified, correct amount
    // order.amount is a backup but total_amount is what eSewa confirmed
    const amt = parseFloat(total_amount) || order.amount;

    return res.redirect(
      `${process.env.CLIENT_URL}/payment/success?bookId=${order.book}&txnId=${transaction_uuid}&esewaRef=${transaction_code}&amount=${amt}`
    );

  } catch (err) {
    console.error("Payment verification error:", err.response?.data || err.message);
    return res.redirect(`${process.env.CLIENT_URL}/payment/failure?reason=server_error`);
  }
};

// GET /api/payment/orders
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('book', 'title coverImage author price')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error("Get orders error:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};