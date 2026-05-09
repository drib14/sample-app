const express = require('express');
const { reactToComment } = require('../controllers/commentController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/:id/react', auth, reactToComment);

module.exports = router;
