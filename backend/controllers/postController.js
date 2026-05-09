const Post = require('../models/Post');
const Comment = require('../models/Comment');

const createPost = async (req, res) => {
  try {
    const { content } = req.body;
    let media = [];

    if (req.files && req.files.length > 0) {
      media = req.files.map(file => ({
        url: file.path,
        type: file.mimetype.startsWith('video') ? 'video' : 'image'
      }));
    }

    if (!content && media.length === 0) {
      return res.status(400).json({ message: 'Post must contain text or media' });
    }

    const newPost = new Post({
      content,
      media,
      author: req.user.id
    });

    await newPost.save();

    const populatedPost = await Post.findById(newPost._id)
      .populate('author', 'firstName lastName username profilePicture')
      .populate('reactions.user', 'firstName lastName profilePicture username');

    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFeed = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'firstName lastName username profilePicture')
      .populate('reactions.user', 'firstName lastName profilePicture username')
      .sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to edit this post' });
    }

    post.content = content;
    await post.save();

    const populatedPost = await Post.findById(id)
      .populate('author', 'firstName lastName username profilePicture')
      .populate('reactions.user', 'firstName lastName profilePicture username');

    res.status(200).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(id);
    // Delete associated comments
    await Comment.deleteMany({ post: id });

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const reactToPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const existingReactionIndex = post.reactions.findIndex(r => r.user.toString() === userId && r.emoji === emoji);

    if (existingReactionIndex > -1) {
      post.reactions.splice(existingReactionIndex, 1);
    } else {
      const anyReactionIndex = post.reactions.findIndex(r => r.user.toString() === userId);
      if (anyReactionIndex > -1) {
        post.reactions[anyReactionIndex].emoji = emoji;
      } else {
        post.reactions.push({ user: userId, emoji });
      }
    }

    await post.save();

    const populatedPost = await Post.findById(id).populate('reactions.user', 'firstName lastName profilePicture username');

    res.status(200).json(populatedPost.reactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createPost, getFeed, updatePost, deletePost, reactToPost };
