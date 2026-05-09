const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  emoji: { type: String, required: true }
}, { _id: false });

const commentSchema = new mongoose.Schema({
  content: { type: String, default: '' },
  gifUrl: { type: String, default: null },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null }, // for replies
  reactions: [reactionSchema]
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
