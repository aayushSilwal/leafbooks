const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PublisherSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  publisherName: {
    type: String,
    required: true
  },

  bio: {
    type: String,
    default: ''
  },

  approved: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

module.exports = mongoose.model('Publisher', PublisherSchema);
