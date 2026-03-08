const asyncHandler = require('express-async-handler');
const Deadline = require('../models/Deadline');

// Achievement definitions
const ACHIEVEMENTS = [
    { id: 'first_done', name: 'First Step', description: 'Complete your first deadline', icon: '🎯', condition: (stats) => stats.totalCompleted >= 1, xp: 10 },
    { id: 'five_done', name: 'Getting Started', description: 'Complete 5 deadlines', icon: '🌟', condition: (stats) => stats.totalCompleted >= 5, xp: 25 },
    { id: 'ten_done', name: 'Deadline Crusher', description: 'Complete 10 deadlines', icon: '💪', condition: (stats) => stats.totalCompleted >= 10, xp: 50 },
    { id: 'twenty_five_done', name: 'Unstoppable', description: 'Complete 25 deadlines', icon: '🚀', condition: (stats) => stats.totalCompleted >= 25, xp: 100 },
    { id: 'fifty_done', name: 'Legend', description: 'Complete 50 deadlines', icon: '👑', condition: (stats) => stats.totalCompleted >= 50, xp: 200 },
    { id: 'early_bird', name: 'Early Bird', description: 'Complete a deadline 3+ days early', icon: '🐦', condition: (stats) => stats.earlyCompletions >= 1, xp: 15 },
    { id: 'early_master', name: 'Time Master', description: 'Complete 5 deadlines 3+ days early', icon: '⏰', condition: (stats) => stats.earlyCompletions >= 5, xp: 40 },
    { id: 'perfect_week', name: 'Perfect Week', description: 'Complete all deadlines due in a week', icon: '📅', condition: (stats) => stats.perfectWeeks >= 1, xp: 30 },
    { id: 'all_categories', name: 'Well-Rounded', description: 'Complete deadlines in 3+ categories', icon: '🎨', condition: (stats) => stats.categoriesCompleted >= 3, xp: 35 },
    { id: 'high_priority', name: 'Pressure Handler', description: 'Complete 5 high-priority deadlines', icon: '🔥', condition: (stats) => stats.highPriorityCompleted >= 5, xp: 40 },
    { id: 'streak_3', name: 'On Fire!', description: 'Maintain a 3-day completion streak', icon: '🔥', condition: (stats) => stats.longestStreak >= 3, xp: 20 },
    { id: 'streak_7', name: 'Week Warrior', description: 'Maintain a 7-day completion streak', icon: '⚡', condition: (stats) => stats.longestStreak >= 7, xp: 50 },
    { id: 'streak_14', name: 'Fortnight Force', description: 'Maintain a 14-day completion streak', icon: '💫', condition: (stats) => stats.longestStreak >= 14, xp: 100 },
];

// Calculate XP level from total XP
const getLevel = (xp) => {
    // Each level requires progressively more XP
    // Level 1: 0, Level 2: 50, Level 3: 120, Level 4: 200 ...
    let level = 1;
    let threshold = 50;
    let remaining = xp;
    while (remaining >= threshold) {
        remaining -= threshold;
        level++;
        threshold = Math.floor(threshold * 1.3);
    }
    return { level, currentXP: remaining, nextLevelXP: threshold };
};

// @desc    Get gamification stats (streaks, achievements, XP)
// @route   GET /api/gamification/stats
// @access  Private
const getGamificationStats = asyncHandler(async (req, res) => {
    const deadlines = await Deadline.find({ user: req.user.id });

    const completed = deadlines.filter(d => d.status === 'completed');

    // Total completed
    const totalCompleted = completed.length;

    // Early completions (completed 3+ days before deadline)
    const earlyCompletions = completed.filter(d => {
        const completedAt = d.updatedAt || d.createdAt;
        const deadlineDate = new Date(d.deadlineDate);
        const diffDays = Math.ceil((deadlineDate - completedAt) / (1000 * 60 * 60 * 24));
        return diffDays >= 3;
    }).length;

    // Categories completed
    const categoriesCompleted = new Set(completed.map(d => d.category)).size;

    // High priority completed
    const highPriorityCompleted = completed.filter(d => d.priority === 'high').length;

    // Streak calculation — consecutive days with at least one completion
    const completionDates = [...new Set(
        completed.map(d => {
            const date = new Date(d.updatedAt || d.createdAt);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        })
    )].sort();

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    if (completionDates.length > 0) {
        tempStreak = 1;
        for (let i = 1; i < completionDates.length; i++) {
            const prev = new Date(completionDates[i - 1]);
            const curr = new Date(completionDates[i]);
            const diff = Math.ceil((curr - prev) / (1000 * 60 * 60 * 24));
            if (diff === 1) {
                tempStreak++;
            } else {
                longestStreak = Math.max(longestStreak, tempStreak);
                tempStreak = 1;
            }
        }
        longestStreak = Math.max(longestStreak, tempStreak);

        // Current streak (from today going backwards)
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        // Start streak from today or yesterday
        const lastDate = completionDates[completionDates.length - 1];
        if (lastDate === todayStr || lastDate === yesterdayStr) {
            currentStreak = 1;
            for (let i = completionDates.length - 2; i >= 0; i--) {
                const curr = new Date(completionDates[i + 1]);
                const prev = new Date(completionDates[i]);
                const diff = Math.ceil((curr - prev) / (1000 * 60 * 60 * 24));
                if (diff === 1) {
                    currentStreak++;
                } else {
                    break;
                }
            }
        }
    }

    // Perfect weeks check (simplified)
    // Check if all deadlines due in any given week were completed
    let perfectWeeks = 0;
    const weeklyGroups = {};
    deadlines.forEach(d => {
        const date = new Date(d.deadlineDate);
        const weekStart = new Date(date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const key = weekStart.toISOString().split('T')[0];
        if (!weeklyGroups[key]) weeklyGroups[key] = { total: 0, completed: 0 };
        weeklyGroups[key].total++;
        if (d.status === 'completed') weeklyGroups[key].completed++;
    });
    Object.values(weeklyGroups).forEach(w => {
        if (w.total > 0 && w.total === w.completed) perfectWeeks++;
    });

    const stats = {
        totalCompleted,
        earlyCompletions,
        categoriesCompleted,
        highPriorityCompleted,
        longestStreak,
        currentStreak,
        perfectWeeks,
    };

    // Calculate achievements
    const unlockedAchievements = ACHIEVEMENTS.filter(a => a.condition(stats)).map(a => ({
        id: a.id,
        name: a.name,
        description: a.description,
        icon: a.icon,
        xp: a.xp,
        unlocked: true,
    }));

    const lockedAchievements = ACHIEVEMENTS.filter(a => !a.condition(stats)).map(a => ({
        id: a.id,
        name: a.name,
        description: a.description,
        icon: a.icon,
        xp: a.xp,
        unlocked: false,
    }));

    // Calculate total XP
    const totalXP = unlockedAchievements.reduce((sum, a) => sum + a.xp, 0);
    const levelInfo = getLevel(totalXP);

    res.json({
        stats,
        achievements: [...unlockedAchievements, ...lockedAchievements],
        xp: {
            total: totalXP,
            ...levelInfo,
        },
        streaks: {
            current: currentStreak,
            longest: longestStreak,
        },
    });
});

module.exports = { getGamificationStats };
