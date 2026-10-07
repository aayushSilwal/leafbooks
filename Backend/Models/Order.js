const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  book: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
  amount: { type: Number, required: true },
  transactionId: { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  paymentMethod: { type: String, default: 'esewa' },
  esewaRefId: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);