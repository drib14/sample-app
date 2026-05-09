const Post = require('../models/Post');
const Comment = require('../models/Comment');

const createPost = async (req, res) => {
  try {
    const { content, feeling, location, pollQuestion } = req.body;
    let { tags, pollOptions } = req.body;
    let media = [];

    // Parse JSON arrays sent from FormData
    if (tags) {
      try { tags = JSON.parse(tags); } catch(e) { tags = []; }
    }
    if (pollOptions) {
      try { pollOptions = JSON.parse(pollOptions); } catch(e) { pollOptions = []; }
    }

    if (req.files && req.files.length > 0) {
      media = req.files.map(file => ({
        url: file.path,
        type: file.mimetype.startsWith('video') ? 'video' : 'image'
      }));
    }

    if (!content && media.length === 0 && !pollQuestion) {
      return res.status(400).json({ message: 'Post must contain text, media, or a poll' });
    }

    let poll = null;
    if (pollQuestion && pollOptions && pollOptions.length >= 2) {
      poll = {
        question: pollQuestion,
        options: pollOptions.map(opt => ({ text: opt, votes: [] }))
      };
    }

    const newPost = new Post({
      content,
      media,
      author: req.user.id,
      feeling: feeling || '',
      location: location || '',
      tags: tags || [],
      poll
    });

    await newPost.save();

    const populatedPost = await Post.findById(newPost._id)
      .populate('author', 'firstName lastName username profilePicture')
      .populate('reactions.user', 'firstName lastName profilePicture username')
      .populate('tags', 'firstName lastName username profilePicture');

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
      .populate('tags', 'firstName lastName username profilePicture')
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
      .populate('reactions.user', 'firstName lastName profilePicture username')
      .populate('tags', 'firstName lastName username profilePicture');

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

const votePoll = async (req, res) => {
  try {
    const { id } = req.params;
    const { optionId } = req.body;
    const userId = req.user.id;

    const post = await Post.findById(id);
    if (!post || !post.poll) return res.status(404).json({ message: 'Poll not found' });

    // Remove user's previous vote if any
    post.poll.options.forEach(opt => {
      opt.votes = opt.votes.filter(v => v.toString() !== userId);
    });

    // Add new vote
    const selectedOption = post.poll.options.id(optionId);
    if (selectedOption) {
      selectedOption.votes.push(userId);
    }

    await post.save();
    res.status(200).json(post.poll);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createPost, getFeed, updatePost, deletePost, reactToPost, votePoll };
