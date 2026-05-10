const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  gender: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  dob: { type: Date, required: true },
  address: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  profilePicture: { type: String, default: null }, // Optional, null falls back to initials

  // New profile fields
  bio: { type: String, default: '' },
  work: { type: String, default: '' },
  relationshipStatus: { type: String, default: '' },
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  relationshipDate: { type: Date, default: null },
  education: {
    elementary: { type: String, default: '' },
    highSchool: { type: String, default: '' },
    college: { type: String, default: '' }
  },

  // Active status
  isOnline: { type: Boolean, default: false },

  // Saved Posts
  savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
