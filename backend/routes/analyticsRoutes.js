const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getSummary,
    getByCategory,
    getByPriority,
    getTimeline,
    getUpcoming,
} = require('../controllers/analyticsController');

router.use(protect); // All analytics routes are protected

router.get('/summary', getSummary);
router.get('/by-category', getByCategory);
router.get('/by-priority', getByPriority);
router.get('/timeline', getTimeline);
router.get('/upcoming', getUpcoming);

module.exports = router;
