const Comment = require('../models/Comment');
const Post = require('../models/Post');

const createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, gifUrl, parentCommentId } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const newComment = new Comment({
      content,
      gifUrl,
      author: req.user.id,
      post: postId,
      parentComment: parentCommentId || null
    });

    await newComment.save();

    // Add to post comments array if it's a top-level comment (optional, or just query by post ID later)
    // To keep it simple, we won't push to post.comments if we fetch comments separately.
    // Let's fetch comments separately to keep Post documents small.

    const populatedComment = await Comment.findById(newComment._id).populate('author', 'firstName lastName username profilePicture');
    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ post: postId })
      .populate('author', 'firstName lastName username profilePicture')
      .sort({ createdAt: 1 });
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const reactToComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const existingReactionIndex = comment.reactions.findIndex(r => r.user.toString() === userId && r.emoji === emoji);

    if (existingReactionIndex > -1) {
      comment.reactions.splice(existingReactionIndex, 1);
    } else {
      const anyReactionIndex = comment.reactions.findIndex(r => r.user.toString() === userId);
      if (anyReactionIndex > -1) {
        comment.reactions[anyReactionIndex].emoji = emoji;
      } else {
        comment.reactions.push({ user: userId, emoji });
      }
    }

    await comment.save();
    res.status(200).json(comment.reactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createComment, getCommentsByPost, reactToComment };
