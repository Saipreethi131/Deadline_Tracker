const express = require('express');
const router = express.Router();
const { getGamificationStats } = require('../controllers/gamificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/stats', protect, getGamificationStats);

module.exports = router;
