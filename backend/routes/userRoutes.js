const express = require('express');
const { searchUsers, getUserProfile, updateUserProfile, toggleSavePost, getSavedPosts, sendRelationshipRequest, handleRelationshipRequest } = require('../controllers/userController');
const auth = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

const router = express.Router();

router.get('/search', auth, searchUsers);
router.get('/saved', auth, getSavedPosts);
router.post('/saved', auth, toggleSavePost);
router.post('/relationship/request', auth, sendRelationshipRequest);
router.post('/relationship/handle', auth, handleRelationshipRequest);
router.put('/profile', auth, upload.single('profilePicture'), updateUserProfile);
router.get('/:username', auth, getUserProfile); // Dynamic route must be last

module.exports = router;
