const express = require('express');
const { searchUsers, getUserProfile, updateUserProfile } = require('../controllers/userController');
const auth = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

const router = express.Router();

router.get('/search', auth, searchUsers);
router.get('/:username', auth, getUserProfile);
router.put('/profile', auth, upload.single('profilePicture'), updateUserProfile);

module.exports = router;
