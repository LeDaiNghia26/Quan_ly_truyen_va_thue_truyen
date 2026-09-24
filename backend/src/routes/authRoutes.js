const express = require('express');
const router = express.Router();

const { register, login, getMe, updateMe, changePassword, sendOtp, verifyOtp, forgotPassword, loginGoogle } = require('../controllers/authController');
const { requireAuth } = require('../middlewares/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/login-google', loginGoogle);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/forgot-password', forgotPassword);
router.get('/me', requireAuth, getMe);
router.put('/me', requireAuth, updateMe);
router.put('/change-password', requireAuth, changePassword);

module.exports = router;