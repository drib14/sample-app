const express = require('express');
const { updateComment, deleteComment, reactToComment } = require('../controllers/commentController');
const auth = require('../middleware/auth');

const router = express.Router();

router.put('/:id', auth, updateComment);
router.delete('/:id', auth, deleteComment);
router.post('/:id/react', auth, reactToComment);

module.exports = router;
