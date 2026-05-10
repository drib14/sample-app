const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');
const { messageUpload } = require('../config/cloudinary');

router.use(auth);

// Conversations
router.get('/conversations', messageController.getConversations);
router.post('/conversations', messageController.createOrGetConversation);
router.put('/conversations/:id/accept', messageController.acceptRequest);
router.delete('/conversations/:id', messageController.deleteConversation);

// Messages
router.get('/:conversationId', messageController.getMessages);
router.post('/:conversationId', messageUpload.array('media', 5), messageController.sendMessage);
router.put('/:conversationId/seen', messageController.markAsSeen);

module.exports = router;
