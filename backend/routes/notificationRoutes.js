const express = require('express');
const { getNotifications, markAsRead, deleteAllNotifications } = require('../controllers/notificationController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, getNotifications);
router.put('/read', auth, markAsRead);
router.delete('/', auth, deleteAllNotifications);

module.exports = router;
