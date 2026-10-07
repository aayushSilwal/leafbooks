const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LendSchema = new Schema({
  book: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
  lender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  borrower: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true },
  status: {
    type: String,
    enum: ['active', 'returned', 'expired'],
    default: 'active'
  }
}, { timestamps: true });

module.exports = mongoose.model('Lend', LendSchema);