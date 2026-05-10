const User = require('../models/User');

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

module.exports = { searchUsers, getUserProfile, updateUserProfile };
