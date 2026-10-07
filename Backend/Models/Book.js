const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BookSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },

  author: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    required: true
  },

  genre: {
    type: String,
    required: true
  },

  tags: [{
    type: String,
    trim: true
  }],

  price: {
    type: Number,
    default: 0,
    min: 0
  },

  isFree: {
    type: Boolean,
    default: false
  },

  coverImage: {
    url: { type: String, required: true },
    publicId: { type: String, required: true }
  },

  bookFile: {
    url: { type: String, required: true },
    publicId: { type: String, required: true }
  },

  publisher: {
    type: Schema.Types.ObjectId,
    ref: 'Publisher',
    required: true
  },

  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },

  totalSales: { type: Number, default: 0 },
  totalBorrows: { type: Number, default: 0 },

}, { timestamps: true });

module.exports = mongoose.model('Book', BookSchema);