const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  text: { type: String, default: '' },

  media: [{
    url: String,
    type: { type: String, enum: ['image', 'video', 'raw', 'auto'], default: 'image' },
    filename: String
  }],

  linkPreview: {
    title: String,
    description: String,
    image: String,
    url: String
  },

  // Status flags
  // sent: true when created
  // delivered: true when socket confirms delivery
  // seen: true when user opens the chat
  status: {
    type: String,
    enum: ['sent', 'delivered', 'seen'],
    default: 'sent'
  },

  // Track seen by array for future proofing group chats, but for 1-1 it's fine
  seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
