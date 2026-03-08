const express = require('express');
const router = express.Router();
const {
    getDeadlines,
    createDeadline,
    updateDeadline,
    deleteDeadline,
    getUpcomingDeadlines,
    updateNotes,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    shareDeadline,
    removeCollaborator,
    acceptInvite,
    rejectInvite,
    getReminderStatus,
    sendTestReminderForDeadline,
    sendTestEmailEndpoint,
} = require('../controllers/deadlineController');

const { protect } = require('../middleware/authMiddleware');

// Reminder routes (must be BEFORE /:id routes to avoid conflicts)
router.route('/reminder-status').get(protect, getReminderStatus);
router.route('/test-email').post(protect, sendTestEmailEndpoint);
router.route('/upcoming').get(protect, getUpcomingDeadlines);

// CRUD routes
router.route('/').get(protect, getDeadlines).post(protect, createDeadline);
router.route('/:id').put(protect, updateDeadline).delete(protect, deleteDeadline);
router.route('/:id/notes').patch(protect, updateNotes);
router.route('/:id/test-reminder').post(protect, sendTestReminderForDeadline);

// Sub-task routes
router.route('/:id/subtasks').post(protect, addSubtask);
router.route('/:id/subtasks/:subtaskId').patch(protect, toggleSubtask).delete(protect, deleteSubtask);

// Collaboration routes
router.route('/:id/share').post(protect, shareDeadline);
router.route('/:id/share/:userId').delete(protect, removeCollaborator);
router.route('/:id/accept').post(protect, acceptInvite);
router.route('/:id/reject').post(protect, rejectInvite);

module.exports = router;
