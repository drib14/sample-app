const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  latestMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  // If the conversation was started between unconnected users, it's a request
  isRequest: { type: Boolean, default: false },
  // Optional flag to indicate if a user declined/deleted the request
  // (We can physically delete it, or mark it, let's keep it simple and just delete when declined)
}, { timestamps: true });

// Ensure uniqueness of conversation between two users
// Wait, we can't easily unique constraint an array of references without ensuring order.
// We'll handle this in the controller.

module.exports = mongoose.model('Conversation', conversationSchema);
