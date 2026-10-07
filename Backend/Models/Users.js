const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  isVerified: { type: Boolean, default: false },

  password: { type: String, required: false, default: null },
  picture: { type: String, default: null },
  picturePublicId: { type: String, default: null },
  picPublicId: { type: String, default: null },

  authType: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },

  role: {
    type: String,
    enum: ['user', 'publisher', 'admin'],
    default: 'user'
  },

  publisherProfile: {
    type: Schema.Types.ObjectId,
    ref: 'Publisher',
    default: null
  },

  // Purchased books — owned forever
  purchasedBooks: [{
    type: Schema.Types.ObjectId,
    ref: 'Book',
    default: []
  }],

  // Reading history
  readingHistory: [{
    book: { type: Schema.Types.ObjectId, ref: 'Book' },
    lastRead: { type: Date, default: Date.now },
    timesRead: { type: Number, default: 1 }
  }],

  // Bookshelf — purchased/added books for easy access
  bookshelf: [{
    type: Schema.Types.ObjectId,
    ref: 'Book',
    default: []
  }]

}, { timestamps: true });

const UserModel = mongoose.model('User', UserSchema);
module.exports = UserModel;