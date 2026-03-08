const asyncHandler = require('express-async-handler');
const Deadline = require('../models/Deadline');

// @desc  Get summary stats
// @route GET /api/analytics/summary
const getSummary = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const [total, completed, pending, overdue] = await Promise.all([
        Deadline.countDocuments({ user: userId }),
        Deadline.countDocuments({ user: userId, status: 'completed' }),
        Deadline.countDocuments({ user: userId, status: 'pending' }),
        Deadline.countDocuments({
            user: userId,
            status: { $ne: 'completed' },
            deadlineDate: { $lt: new Date() },
        }),
    ]);

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    res.json({ total, completed, pending, overdue, completionRate });
});

// @desc  Get deadlines grouped by category
// @route GET /api/analytics/by-category
const getByCategory = asyncHandler(async (req, res) => {
    const data = await Deadline.aggregate([
        { $match: { user: req.user._id } },
        {
            $group: {
                _id: '$category',
                total: { $sum: 1 },
                completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            },
        },
        { $sort: { total: -1 } },
    ]);

    // Capitalise category names for display
    const formatted = data.map(d => ({
        category: d._id.charAt(0).toUpperCase() + d._id.slice(1),
        total: d.total,
        completed: d.completed,
        pending: d.pending,
    }));

    res.json(formatted);
});

// @desc  Get deadlines grouped by priority
// @route GET /api/analytics/by-priority
const getByPriority = asyncHandler(async (req, res) => {
    const data = await Deadline.aggregate([
        { $match: { user: req.user._id } },
        {
            $group: {
                _id: '$priority',
                count: { $sum: 1 },
            },
        },
    ]);

    const map = { high: 0, medium: 0, low: 0 };
    data.forEach(d => { if (map[d._id] !== undefined) map[d._id] = d.count; });

    res.json([
        { name: 'High', value: map.high, fill: '#ef4444' },
        { name: 'Medium', value: map.medium, fill: '#f59e0b' },
        { name: 'Low', value: map.low, fill: '#10b981' },
    ]);
});

// @desc  Get deadlines created over the last 6 months (monthly)
// @route GET /api/analytics/timeline
const getTimeline = asyncHandler(async (req, res) => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const data = await Deadline.aggregate([
        {
            $match: {
                user: req.user._id,
                createdAt: { $gte: sixMonthsAgo },
            },
        },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                },
                total: { $sum: 1 },
                completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const formatted = data.map(d => ({
        month: `${MONTHS[d._id.month - 1]} ${d._id.year}`,
        total: d.total,
        completed: d.completed,
    }));

    res.json(formatted);
});

// @desc  Get upcoming deadlines (next 7 days)
// @route GET /api/analytics/upcoming
const getUpcoming = asyncHandler(async (req, res) => {
    const now = new Date();
    const in7 = new Date();
    in7.setDate(in7.getDate() + 7);

    const deadlines = await Deadline.find({
        user: req.user._id,
        status: 'pending',
        deadlineDate: { $gte: now, $lte: in7 },
    })
        .sort({ deadlineDate: 1 })
        .limit(5)
        .select('title deadlineDate priority category');

    res.json(deadlines);
});

module.exports = { getSummary, getByCategory, getByPriority, getTimeline, getUpcoming };
