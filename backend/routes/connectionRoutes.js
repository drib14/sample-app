const express = require('express');
const { generateCode, verifyCode, getUserConnections } = require('../controllers/connectionController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/generate', auth, generateCode);
router.post('/verify', auth, verifyCode);
router.get('/:username', auth, getUserConnections);

module.exports = router;
