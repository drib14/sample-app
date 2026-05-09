const express = require('express');
const { createPost, getFeed, reactToPost } = require('../controllers/postController');
const { createComment, getCommentsByPost, reactToComment } = require('../controllers/commentController');
const auth = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

const router = express.Router();

// Post Routes
router.post('/', auth, upload.array('media', 10), createPost);
router.get('/', auth, getFeed);
router.post('/:id/react', auth, reactToPost);

// Comment Routes nested in posts
router.post('/:postId/comments', auth, createComment);
router.get('/:postId/comments', auth, getCommentsByPost);

module.exports = router;
