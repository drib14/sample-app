const express = require('express');
const { generateCode, verifyCode } = require('../controllers/connectionController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/generate', auth, generateCode);
router.post('/verify', auth, verifyCode);

module.exports = router;
