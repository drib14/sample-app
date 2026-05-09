const express = require('express');
const { createPost, getFeed, updatePost, deletePost, reactToPost, votePoll } = require('../controllers/postController');
const { createComment, getCommentsByPost } = require('../controllers/commentController');
const auth = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

const router = express.Router();

router.post('/', auth, upload.array('media', 100), createPost);
router.get('/', auth, getFeed);
router.put('/:id', auth, updatePost);
router.delete('/:id', auth, deletePost);
router.post('/:id/react', auth, reactToPost);
router.post('/:id/poll/vote', auth, votePoll);

router.post('/:postId/comments', auth, createComment);
router.get('/:postId/comments', auth, getCommentsByPost);

module.exports = router;
