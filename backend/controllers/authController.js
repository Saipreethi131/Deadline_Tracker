const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');
const { sendWelcomeEmail } = require('../services/emailService');
const axios = require('axios');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    if (!password) {
        res.status(400);
        throw new Error('Please add a password for manual registration');
    }

    const user = await User.create({
        name,
        email,
        password,
    });

    if (user) {
        // Send welcome email (non-blocking)
        sendWelcomeEmail(user.email, user.name);

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        res.status(401);
        throw new Error('Invalid email or password');
    }

    // Check if the user has a password (might be a Google-only account)
    if (!user.password) {
        res.status(401);
        throw new Error('This account was created with Google. Please sign in with Google.');
    }

    if (await user.matchPassword(password)) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Auth user with Google token
// @route   POST /api/auth/google
// @access  Public
const googleAuth = asyncHandler(async (req, res) => {
    const { token, tokenType } = req.body;

    if (!token) {
        res.status(400);
        throw new Error('No Google token provided');
    }

    let payload;

    if (tokenType === 'access_token') {
        // Handle custom button flow (Access Token)
        try {
            const response = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`);
            payload = response.data;
        } catch (err) {
            console.error('Google Access Token verification failed:', err.response?.data || err.message);
            res.status(401);
            throw new Error('Invalid Google Access Token (V4-NEW-CODE)');
        }
    } else {
        // Handle standard component flow (ID Token)
        try {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            payload = ticket.getPayload();
        } catch (err) {
            res.status(401);
            throw new Error('Invalid Google ID Token (V4-NEW-CODE)');
        }
    }

    const { email, name, sub: googleId } = payload;

    // 1. Try to find user by googleId
    let user = await User.findOne({ googleId });

    // 2. If not found, try to find by email
    if (!user) {
        user = await User.findOne({ email });

        if (user) {
            // Found by email but no googleId - link them
            user.googleId = googleId;
            await user.save();
        } else {
            // 3. Create new user if they don't exist at all
            user = await User.create({
                name,
                email,
                googleId,
            });

            // Send welcome email for new Google sign-ups (non-blocking)
            sendWelcomeEmail(user.email, user.name);
        }
    }

    res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        token: generateToken(user._id),
    });
});

module.exports = {
    registerUser,
    loginUser,
    googleAuth,
};
