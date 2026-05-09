const express = require('express');
const { registerInit, registerVerify, loginInit, loginVerify } = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/register-init', authLimiter, registerInit);
router.post('/register-verify', authLimiter, registerVerify);
router.post('/login-init', authLimiter, loginInit);
router.post('/login-verify', authLimiter, loginVerify);

module.exports = router;
