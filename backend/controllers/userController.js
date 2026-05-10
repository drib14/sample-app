const User = require('../models/User');
const Notification = require('../models/Notification');

const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(200).json([]);

    const regex = new RegExp(query, 'i'); // Case insensitive
    const users = await User.find({
      $or: [
        { username: regex },
        { firstName: regex },
        { lastName: regex }
      ]
    }).select('_id username firstName lastName profilePicture').limit(10);

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select('-__v');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, address, bio, work, relationshipStatus, elementary, highSchool, college } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (address !== undefined) user.address = address;
    if (bio !== undefined) user.bio = bio;
    if (work !== undefined) user.work = work;
    if (relationshipStatus !== undefined) user.relationshipStatus = relationshipStatus;

    if (!user.education) user.education = {};
    if (elementary !== undefined) user.education.elementary = elementary;
    if (highSchool !== undefined) user.education.highSchool = highSchool;
    if (college !== undefined) user.education.college = college;

    if (req.file) {
      user.profilePicture = req.file.path;
    }

    await user.save();

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleSavePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const postIndex = user.savedPosts.indexOf(postId);
    if (postIndex > -1) {
      user.savedPosts.splice(postIndex, 1);
    } else {
      user.savedPosts.push(postId);
    }

    await user.save();
    res.status(200).json(user.savedPosts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSavedPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate({
      path: 'savedPosts',
      populate: [
        { path: 'author', select: 'firstName lastName username profilePicture isOnline' },
        { path: 'tags', select: 'firstName lastName username profilePicture' }
      ]
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json(user.savedPosts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendRelationshipRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { partnerId, relationshipStatus } = req.body;

    const partner = await User.findById(partnerId);
    if (!partner) return res.status(404).json({ message: 'Partner not found' });

    const notification = new Notification({
      recipient: partnerId,
      sender: userId,
      type: 'relationship_request',
    });
    // Can attach status as post for a hack, or a new field, let's just use the current profile update for status.
    // We will save relationshipStatus on sender, and partner won't see it until accepted
    // For now we will rely on frontend passing it via updateUserProfile separately or together

    await notification.save();

    const populatedNotif = await Notification.findById(notification._id)
      .populate('sender', 'firstName lastName username profilePicture');

    try {
      require('../socket').getIO().to(partnerId.toString()).emit('new_notification', populatedNotif);
    } catch (e) {
      console.log('Socket error', e);
    }

    res.status(200).json({ message: 'Relationship request sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const handleRelationshipRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { senderId, action, relationshipStatus } = req.body;

    const user = await User.findById(userId);
    const sender = await User.findById(senderId);

    if (!user || !sender) return res.status(404).json({ message: 'User not found' });

    if (action === 'accept') {
      user.partner = senderId;
      user.relationshipStatus = relationshipStatus || 'In a relationship';
      user.relationshipDate = new Date();

      sender.partner = userId;
      sender.relationshipStatus = relationshipStatus || 'In a relationship';
      sender.relationshipDate = new Date();

      await user.save();
      await sender.save();
    }

    // Delete the notification
    await Notification.deleteMany({
      recipient: userId,
      sender: senderId,
      type: 'relationship_request'
    });

    // Rejections happen silently as requested
    res.status(200).json({ message: `Relationship request ${action}ed` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { searchUsers, getUserProfile, updateUserProfile, toggleSavePost, getSavedPosts, sendRelationshipRequest, handleRelationshipRequest };
