const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GiftSchema = new Schema({
  book: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  },
  message: { type: String, default: '', maxlength: 300 }
}, { timestamps: true });

module.exports = mongoose.model('Gift', GiftSchema);