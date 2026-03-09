const express = require('express');
const router = express.Router();
const {
	registerUser,
	loginUser,
	googleAuth,
	requestPasswordReset,
	resetPassword,
} = require('../controllers/authController');
const { getProfile, updateProfile, verifyEmailChange, changePassword, deleteAccount } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuth);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);

// Settings / Profile routes (protected)
router.route('/profile').get(protect, getProfile).put(protect, updateProfile);
router.post('/profile/verify-email', protect, verifyEmailChange);
router.put('/change-password', protect, changePassword);
router.delete('/account', protect, deleteAccount);

module.exports = router;
