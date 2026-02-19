const express = require('express');
const router = express.Router();
const {
    getDeadlines,
    createDeadline,
    updateDeadline,
    deleteDeadline,
    getUpcomingDeadlines
} = require('../controllers/deadlineController');

const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getDeadlines).post(protect, createDeadline);
router.route('/upcoming').get(protect, getUpcomingDeadlines);
router.route('/:id').put(protect, updateDeadline).delete(protect, deleteDeadline);

module.exports = router;
