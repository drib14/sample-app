const SyncCode = require('../models/SyncCode');
const Connection = require('../models/Connection');
const Notification = require('../models/Notification');
const socket = require('../socket');

const generateCode = async (req, res) => {
  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await SyncCode.findOneAndDelete({ user: req.user.id });
    const syncCode = await SyncCode.create({ user: req.user.id, code, expiresAt });

    res.status(200).json({ code: syncCode.code, expiresAt: syncCode.expiresAt });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyCode = async (req, res) => {
  try {
    const { code } = req.body;
    const currentUserId = req.user.id;

    const syncCode = await SyncCode.findOne({ code });

    if (!syncCode) {
      return res.status(400).json({ message: 'Invalid or expired code.' });
    }

    if (syncCode.user.toString() === currentUserId) {
      return res.status(400).json({ message: 'You cannot connect with yourself.' });
    }

    // Check if connection already exists
    const existingConnection = await Connection.findOne({
      users: { $all: [currentUserId, syncCode.user] }
    });

    if (existingConnection) {
      return res.status(400).json({ message: 'You are already connected with this user.' });
    }

    // Create Connection
    await Connection.create({ users: [currentUserId, syncCode.user] });

    // Send Notification to the code generator
    const notification = new Notification({
      recipient: syncCode.user,
      sender: currentUserId,
      type: 'connection_accepted'
    });
    await notification.save();

    const popNotif = await Notification.findById(notification._id)
      .populate('sender', 'firstName lastName username profilePicture');

    try {
      socket.getIO().to(syncCode.user.toString()).emit('new_notification', popNotif);
    } catch (e) {
      console.log('Socket error', e);
    }

    // Clean up used code
    await SyncCode.findByIdAndDelete(syncCode._id);

    res.status(200).json({ message: 'Connection established successfully!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { generateCode, verifyCode };
