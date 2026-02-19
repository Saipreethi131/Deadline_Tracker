const asyncHandler = require('express-async-handler');
const Deadline = require('../models/Deadline');

// @desc    Get all deadlines
// @route   GET /api/deadlines
// @access  Private
const getDeadlines = asyncHandler(async (req, res) => {
    const deadlines = await Deadline.find({ user: req.user.id });
    res.status(200).json(deadlines);
});

// @desc    Get upcoming deadlines (next 7 days)
// @route   GET /api/deadlines/upcoming
// @access  Private
const getUpcomingDeadlines = asyncHandler(async (req, res) => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const deadlines = await Deadline.find({
        user: req.user.id,
        deadlineDate: {
            $gte: today,
            $lte: nextWeek
        },
        status: { $ne: 'completed' } // Optionally exclude completed tasks
    }).sort({ deadlineDate: 1 });

    res.status(200).json(deadlines);
});

// @desc    Create a deadline
// @route   POST /api/deadlines
// @access  Private
const createDeadline = asyncHandler(async (req, res) => {
    if (!req.body.title || !req.body.deadlineDate || !req.body.category) {
        res.status(400);
        throw new Error('Please add all required fields');
    }

    const deadline = await Deadline.create({
        user: req.user.id,
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        customCategoryName: req.body.customCategoryName,
        deadlineDate: req.body.deadlineDate,
        status: req.body.status,
        priority: req.body.priority,
        reminderEnabled: req.body.reminderEnabled
    });

    res.status(200).json(deadline);
});

// @desc    Update a deadline
// @route   PUT /api/deadlines/:id
// @access  Private
const updateDeadline = asyncHandler(async (req, res) => {
    const deadline = await Deadline.findById(req.params.id);

    if (!deadline) {
        res.status(404);
        throw new Error('Deadline not found');
    }

    if (!req.user) {
        res.status(401);
        throw new Error('User not found');
    }

    if (deadline.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const updatedDeadline = await Deadline.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    });

    res.status(200).json(updatedDeadline);
});

// @desc    Delete a deadline
// @route   DELETE /api/deadlines/:id
// @access  Private
const deleteDeadline = asyncHandler(async (req, res) => {
    const deadline = await Deadline.findById(req.params.id);

    if (!deadline) {
        res.status(404);
        throw new Error('Deadline not found');
    }

    if (!req.user) {
        res.status(401);
        throw new Error('User not found');
    }

    if (deadline.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    await deadline.deleteOne();

    res.status(200).json({ id: req.params.id });
});

module.exports = {
    getDeadlines,
    getUpcomingDeadlines,
    createDeadline,
    updateDeadline,
    deleteDeadline
};
