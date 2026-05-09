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

    const populatedPost = await Post.findById(newPost._id).populate('author', 'firstName lastName username profilePicture');
    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFeed = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'firstName lastName username profilePicture')
      .sort({ createdAt: -1 });
    res.status(200).json(posts);
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

    // Check if user already reacted with THIS emoji
    const existingReactionIndex = post.reactions.findIndex(r => r.user.toString() === userId && r.emoji === emoji);

    if (existingReactionIndex > -1) {
      // Remove reaction (toggle)
      post.reactions.splice(existingReactionIndex, 1);
    } else {
      // Find if user reacted with a different emoji and replace it, OR just add new (let's replace existing reaction from same user for simplicity, or allow multiple? Let's replace.)
      const anyReactionIndex = post.reactions.findIndex(r => r.user.toString() === userId);
      if (anyReactionIndex > -1) {
        post.reactions[anyReactionIndex].emoji = emoji;
      } else {
        post.reactions.push({ user: userId, emoji });
      }
    }

    await post.save();
    res.status(200).json(post.reactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createPost, getFeed, reactToPost };
