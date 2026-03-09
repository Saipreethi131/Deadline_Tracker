const express = require('express');
const colors = require('colors');
const dotenv = require('dotenv').config();
const { errorHandler } = require('./middleware/errorMiddleware');
const connectDB = require('./config/db');
const port = process.env.PORT || 5000;
const cors = require('cors');
const isVercel = !!process.env.VERCEL;

// Connect to database
connectDB();

// Start email reminder scheduler
const { startReminderScheduler } = require('./services/reminderScheduler');
if (!isVercel) {
    startReminderScheduler();
}

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL_STAGING,
].filter(Boolean);
const allowVercelPreviewOrigins = process.env.ALLOW_VERCEL_PREVIEW_ORIGINS === 'true';

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl) or any localhost
        if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
            return callback(null, true);
        }
        // Allow known frontend origins from environment.
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        if (allowVercelPreviewOrigins && /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Health Check
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/deadlines', require('./routes/deadlineRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/gamification', require('./routes/gamificationRoutes'));

app.use(errorHandler);


if (!isVercel) {
    app.listen(port, () => console.log(`Server started on port ${port}`));
}

module.exports = app;

