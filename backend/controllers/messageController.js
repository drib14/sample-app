const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Connection = require('../models/Connection');
const User = require('../models/User');
const urlMetadata = require('url-metadata');
const socketIO = require('../socket'); // We'll emit some stuff if needed, mostly via socket file directly, but let's keep it here

const urlRegex = /(https?:\/\/[^\s]+)/g;

exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    })
      .populate('participants', 'firstName lastName profilePicture isOnline')
      .populate({
        path: 'latestMessage',
        populate: { path: 'sender', select: 'firstName lastName' }
      })
      .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createOrGetConversation = async (req, res) => {
  try {
    const { targetUserId } = req.body;

    if (targetUserId === req.user.id) {
      return res.status(400).json({ message: 'Cannot chat with yourself' });
    }

    // Check if conversation exists
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, targetUserId] }
    }).populate('participants', 'firstName lastName profilePicture isOnline');

    if (conversation) {
      return res.status(200).json(conversation);
    }

    // Check if they are connected
    const connection = await Connection.findOne({
      users: { $all: [req.user.id, targetUserId] }
    });

    const isRequest = !connection;

    conversation = new Conversation({
      participants: [req.user.id, targetUserId],
      isRequest
    });

    await conversation.save();

    conversation = await Conversation.findById(conversation._id).populate('participants', 'firstName lastName profilePicture isOnline');

    res.status(201).json(conversation);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.acceptRequest = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user.id
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    conversation.isRequest = false;
    await conversation.save();

    res.status(200).json(conversation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user.id
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Delete messages associated
    await Message.deleteMany({ conversationId: conversation._id });
    await Conversation.findByIdAndDelete(conversation._id);

    res.status(200).json({ message: 'Conversation deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    // First, verify the user is a participant
    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      participants: req.user.id
    });

    if (!conversation) {
      return res.status(403).json({ message: 'Not authorized to view these messages' });
    }

    const messages = await Message.find({ conversationId: req.params.conversationId })
      .populate('sender', 'firstName lastName profilePicture')
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const conversationId = req.params.conversationId;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user.id
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    let mediaFiles = [];
    if (req.files && req.files.length > 0) {
      mediaFiles = req.files.map(file => ({
        url: file.path,
        type: file.mimetype.startsWith('image') ? 'image' :
              file.mimetype.startsWith('video') ? 'video' : 'raw',
        filename: file.filename
      }));
    }

    let linkPreview = null;
    if (text) {
      const urls = text.match(urlRegex);
      if (urls && urls.length > 0) {
        try {
          const metadata = await urlMetadata(urls[0], { timeout: 3000 });
          if (metadata && (metadata.title || metadata['og:title'])) {
             linkPreview = {
               title: metadata.title || metadata['og:title'] || '',
               description: metadata.description || metadata['og:description'] || '',
               image: metadata.image || metadata['og:image'] || null,
               url: urls[0]
             };
          }
        } catch (e) {
          console.error("Link preview error:", e.message);
        }
      }
    }

    // recipient
    const recipientId = conversation.participants.find(p => p.toString() !== req.user.id.toString());
    const recipient = await User.findById(recipientId);

    // Initial status
    let status = 'sent';
    // If we have access to socketio from here, we could check if user is connected
    // But typically we emit "receive_message" and the client ACKs, or we check isOnline.
    if (recipient && recipient.isOnline) {
       // Ideally we wait for socket ACK, but let's assume delivered if online for simplicity, or just keep 'sent' and let socket do 'delivered'
       // Let's set 'sent' and socket will upgrade it.
    }

    const { gifUrl } = req.body;

    const message = new Message({
      conversationId,
      sender: req.user.id,
      text,
      media: mediaFiles,
      linkPreview,
      gifUrl,
      status
    });

    await message.save();

    conversation.latestMessage = message._id;
    await conversation.save();

    await message.populate('sender', 'firstName lastName profilePicture');

    // Emit via socket if needed. Usually better done from frontend emitting, or here.
    // If done here:
    const io = socketIO.getIO();
    if (io) {
      // room is the recipient's user id
      io.to(recipientId.toString()).emit('receive_message', message);

      // Update the conversation list view for recipient
      io.to(recipientId.toString()).emit('update_conversation', {
        conversationId,
        message,
        isRequest: conversation.isRequest
      });

      // Update sender's conversation view
      io.to(req.user.id.toString()).emit('update_conversation', {
        conversationId,
        message,
        isRequest: conversation.isRequest
      });
    }

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.editMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const messageId = req.params.messageId;

    const message = await Message.findOne({ _id: messageId, sender: req.user.id }).populate('sender', 'firstName lastName profilePicture');
    if (!message) return res.status(404).json({ message: 'Message not found or unauthorized' });

    if (message.isDeleted) return res.status(400).json({ message: 'Cannot edit a deleted message' });

    message.text = text;
    message.isEdited = true;

    // Update link preview if needed
    let linkPreview = null;
    if (text) {
      const urls = text.match(urlRegex);
      if (urls && urls.length > 0) {
        try {
          const metadata = await urlMetadata(urls[0], { timeout: 3000 });
          if (metadata && (metadata.title || metadata['og:title'])) {
             linkPreview = {
               title: metadata.title || metadata['og:title'] || '',
               description: metadata.description || metadata['og:description'] || '',
               image: metadata.image || metadata['og:image'] || null,
               url: urls[0]
             };
          }
        } catch (e) {
          console.error("Link preview error:", e.message);
        }
      }
    }
    message.linkPreview = linkPreview;

    await message.save();

    const conversation = await Conversation.findById(message.conversationId);

    // Emit socket
    const io = socketIO.getIO();
    if (io && conversation) {
      conversation.participants.forEach(p => {
        io.to(p.toString()).emit('message_edited', message);
      });
    }

    res.status(200).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const messageId = req.params.messageId;

    const message = await Message.findOne({ _id: messageId, sender: req.user.id });
    if (!message) return res.status(404).json({ message: 'Message not found or unauthorized' });

    // Soft delete
    message.isDeleted = true;
    message.text = '';
    message.media = [];
    message.gifUrl = null;
    message.linkPreview = null;
    await message.save();

    const conversation = await Conversation.findById(message.conversationId);

    // Emit socket
    const io = socketIO.getIO();
    if (io && conversation) {
      conversation.participants.forEach(p => {
        io.to(p.toString()).emit('message_deleted', { messageId, conversationId: conversation._id });
      });
    }

    res.status(200).json({ messageId, conversationId: conversation._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.markAsSeen = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user.id
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Find all messages in this conversation not sent by me and not seen
    await Message.updateMany(
      {
        conversationId,
        sender: { $ne: req.user.id },
        status: { $ne: 'seen' }
      },
      {
        status: 'seen',
        $addToSet: { seenBy: req.user.id }
      }
    );

    // Get the other participant to notify them
    const otherParticipantId = conversation.participants.find(p => p.toString() !== req.user.id.toString());

    const io = socketIO.getIO();
    if (io) {
      io.to(otherParticipantId.toString()).emit('messages_seen', {
        conversationId,
        seenBy: req.user.id
      });
    }

    res.status(200).json({ message: 'Messages marked as seen' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
