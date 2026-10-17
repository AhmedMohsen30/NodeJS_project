const router = require('express').Router();
const { register, login, verifyEmail, resendOtp } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendOtp);

module.exports = router;
