const cron = require('node-cron');
const Deadline = require('../models/Deadline');
const User = require('../models/User');
const { sendReminderEmail, isEmailConfigured } = require('./emailService');

// Days before deadline to send reminders
const REMINDER_DAYS = [7, 3, 1, 0]; // 7 days, 3 days, 1 day, and day-of

/**
 * Check if a reminder for a specific daysAhead value has already been sent today.
 */
const wasReminderAlreadySent = (deadline, daysAhead) => {
    if (!deadline.reminderHistory || deadline.reminderHistory.length === 0) {
        return false;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return deadline.reminderHistory.some(
        (record) =>
            record.daysBeforeDeadline === daysAhead &&
            new Date(record.sentAt) >= todayStart
    );
};

const startReminderScheduler = () => {
    // ── Guard: skip if email is not configured ──
    if (!isEmailConfigured()) {
        console.log(
            '⚠️  Email reminders DISABLED — EMAIL_USER / EMAIL_PASS not configured in backend/.env'
        );
        return;
    }

    // Runs every day at 8:00 AM IST.
    cron.schedule('0 8 * * *', async () => {
        console.log('⏰ Running daily reminder scheduler...');

        const now = new Date();
        let totalSent = 0;

        for (const daysAhead of REMINDER_DAYS) {
            const targetStart = new Date(now);
            targetStart.setDate(now.getDate() + daysAhead);
            targetStart.setHours(0, 0, 0, 0);

            const targetEnd = new Date(targetStart);
            targetEnd.setHours(23, 59, 59, 999);

            try {
                const deadlines = await Deadline.find({
                    deadlineDate: { $gte: targetStart, $lte: targetEnd },
                    status: 'pending',
                    reminderEnabled: true,
                }).populate('user', 'name email');

                for (const deadline of deadlines) {
                    if (!deadline.user?.email) continue;

                    // Skip if already sent this reminder today
                    if (wasReminderAlreadySent(deadline, daysAhead)) {
                        console.log(
                            `⏭️  Skipped "${deadline.title}" — ${daysAhead}d reminder already sent today`
                        );
                        continue;
                    }

                    try {
                        await sendReminderEmail(
                            deadline.user.email,
                            deadline.user.name,
                            deadline,
                            daysAhead
                        );

                        // Record that we sent this reminder
                        deadline.lastReminderSentAt = new Date();
                        deadline.reminderHistory.push({
                            sentAt: new Date(),
                            daysBeforeDeadline: daysAhead,
                        });
                        await deadline.save();

                        totalSent++;
                    } catch (err) {
                        console.error(
                            `❌ Failed to send email for "${deadline.title}":`,
                            err.message
                        );
                    }
                }
            } catch (err) {
                console.error(
                    `❌ Scheduler error for daysAhead=${daysAhead}:`,
                    err.message
                );
            }
        }

        console.log(
            `✅ Reminder scheduler run complete. ${totalSent} email(s) sent.`
        );
    }, {
        timezone: 'Asia/Kolkata', // IST — change to your timezone
    });

    console.log('✅ Reminder scheduler started (runs daily at 8:00 AM IST)');
};

module.exports = { startReminderScheduler };
