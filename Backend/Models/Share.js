const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ShareSchema = new Schema({
  book: {
    type: Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  sharedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sharedWith: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// One active share per sharedBy-sharedWith-book combo
ShareSchema.index({ book: 1, sharedBy: 1, sharedWith: 1 }, { unique: true });

module.exports = mongoose.model('Share', ShareSchema);