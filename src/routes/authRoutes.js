const express = require('express');
const authController = require('../controllers/authController');
const rateLimitMiddleware = require('../middlewares/rateLimitMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { USER_ROLE } = require('../constants/auth');

const router = express.Router();

router.post('/register', rateLimitMiddleware('register'), authController.register);
router.post('/verify', rateLimitMiddleware('verify'), authController.verifyOtp);
router.post('/resend-otp', rateLimitMiddleware('resend-otp'), authController.resendOtp);
router.post('/login', rateLimitMiddleware('login'), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

router.get('/me', authMiddleware, (req, res) => {
  res.status(200).json({ user: req.user });
});

router.get('/admin/ping', authMiddleware, roleMiddleware(USER_ROLE.ADMIN), (_req, res) => {
  res.status(200).json({ message: 'admin ok' });
});

module.exports = router;
