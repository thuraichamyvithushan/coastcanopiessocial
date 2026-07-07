const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const connectDB = require('../config/db');
const { normalizeRole, normalizeUserRole } = require('../utils/roles');

const normalizeEmail = (email) => email?.trim().toLowerCase();

const buildAuthResponse = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: normalizeRole(user.role),
    status: user.status,
    token: generateToken(user._id)
});

const createNotificationSafely = async (payload, context) => {
    try {
        await Notification.create(payload);
    } catch (error) {
        console.error(`${context} notification failed:`, error.message);
    }
};

const ensureDatabaseConnection = async () => {
    try {
        const connection = await connectDB();

        if (connection?.connection?.readyState !== 1) {
            throw new Error('Database connection is unavailable');
        }
    } catch (error) {
        if (error?.message === 'MONGO_URI is missing from environment variables') {
            throw error;
        }

        if (error?.message?.includes('ENOTFOUND') || error?.message?.includes('Server selection timed out')) {
            throw new Error('Database connection is unavailable');
        }

        throw error;
    }
};

const getStatusCodeForError = (error) => {
    if (error.message === 'Database connection is unavailable') {
        return 503;
    }

    return 500;
};

const generateToken = (id) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is missing from environment variables');
    }
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
    const { name, password } = req.body;
    const email = normalizeEmail(req.body.email);

    try {
        await ensureDatabaseConnection();

        if (!name?.trim()) {
            return res.status(400).json({ message: 'Name is required' });
        }

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = new User({
            name,
            email,
            password,
            role: 'user',
            status: 'pending'
        });

        await user.save();

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: normalizeRole(user.role),
                status: user.status
            });

            // Create notification for admin
            await createNotificationSafely({
                type: 'registration',
                message: `New portal access request from ${name} (${email}).`,
                userId: user._id
            }, 'Registration');

            // Send email to admin if configured
            if (process.env.ADMIN_NOTIFICATION_EMAIL) {
                try {
                    const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
                    const htmlMessage = `
                    <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #000; padding: 40px; background-color: #fffdf7; text-align: left;">
                        <h2 style="font-size: 24px; font-weight: 900; text-transform: uppercase; margin-bottom: 20px; color: #000;">New Member Request.</h2>
                        <p style="font-size: 16px; color: #000; line-height: 1.6; margin-bottom: 30px;">
                            A new user has registered and is pending approval:
                        </p>
                        <div style="background: #fff0bf; border: 1px solid #f9bf1e; padding: 20px; margin-bottom: 30px;">
                            <p style="margin: 0 0 10px 0; font-size: 14px;"><strong>Name:</strong> ${name}</p>
                            <p style="margin: 0; font-size: 14px;"><strong>Email:</strong> ${email}</p>
                        </div>
                        <p style="font-size: 16px; color: #000; line-height: 1.6; margin-bottom: 30px;">
                            Please log in to the admin dashboard to review their request.
                        </p>
                        <a href="${frontendUrl}/admin-dashboard" style="display: inline-block; background: #f9bf1e; color: #000; text-decoration: none; padding: 20px 40px; font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; border: 2px solid #000; box-shadow: 6px 6px 0px #000;">
                            Admin Dashboard
                        </a>
                        <p style="margin-top: 50px; font-size: 10px; color: #000; text-transform: uppercase; letter-spacing: 1px;">
                            COAST CANOPIES SOCIAL SYSTEM ALERT
                        </p>
                    </div>
                    `;

                    await sendEmail({
                        email: process.env.ADMIN_NOTIFICATION_EMAIL,
                        subject: 'ALERT: New User Registration',
                        html: htmlMessage
                    });
                } catch (err) {
                    console.error('Admin notification email failed:', err.message);
                }
            }
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(getStatusCodeForError(error)).json({ message: error.message });
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
    const { password } = req.body;
    const email = normalizeEmail(req.body.email);

    try {
        await ensureDatabaseConnection();

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        if (!password) {
            return res.status(400).json({ message: 'Password is required' });
        }

        const user = await User.findOne({ email }).select('+password');

        if (user && (await user.comparePassword(password, user.password))) {
            await normalizeUserRole(user);

            if (user.status !== 'approved') {
                // Notifiy admin of login attempt from pending user
                await createNotificationSafely({
                    type: 'login_attempt',
                    message: `Pending user ${user.name} (${user.email}) attempted to log in.`,
                    userId: user._id
                }, 'Pending login');

                if (process.env.ADMIN_NOTIFICATION_EMAIL) {
                    try {
                        await sendEmail({
                            email: process.env.ADMIN_NOTIFICATION_EMAIL,
                            subject: 'ALERT: Pending User Login Attempt',
                            message: `User ${user.name} (${user.email}) is trying to access the portal but their status is: ${user.status}.\n\nPlease review their account status.`
                        });
                    } catch (err) {
                        console.error('Admin notification email failed:', err.message);
                    }
                }

                return res.status(401).json({ message: 'Account pending admin approval' });
            }

            res.json(buildAuthResponse(user));
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login Error:', error);
        res.status(getStatusCodeForError(error)).json({ message: error.message });
    }
};
// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res) => {
    const email = normalizeEmail(req.body.email);

    try {
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        await ensureDatabaseConnection();

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const resetToken = user.getResetPasswordToken();
        await user.save({ validateBeforeSave: false });

        const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
        const clientResetUrl = `${frontendUrl}/reset-password/${resetToken}`;

        const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${clientResetUrl}`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password reset token',
                message,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px; background: #fffdf7; border: 2px solid #000;">
                        <h1 style="font-size: 40px; font-weight: 900; letter-spacing: -2px; text-transform: uppercase; font-style: italic; margin: 0 0 20px;">
                            COAST CANOPIES <span style="color: #f9bf1e;">SOCIAL.</span>
                        </h1>
                        <p style="text-transform: uppercase; font-size: 10px; font-weight: bold; letter-spacing: 2px; color: #000; margin-bottom: 40px;">Content Management Platform</p>
                        <h2 style="font-size: 24px; font-weight: 900; text-transform: uppercase; margin-bottom: 20px; color: #000;">Password Reset.</h2>
                        <p style="font-size: 16px; color: #000; line-height: 1.6; margin-bottom: 30px;">
                            You requested a password reset. Click the button below to set a new password. This link is valid for 10 minutes.
                        </p>
                        <a href="${clientResetUrl}" style="display: inline-block; background: #f9bf1e; color: #000; text-decoration: none; padding: 20px 40px; font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; border: 2px solid #000; box-shadow: 6px 6px 0px #000;">
                            Reset Password
                        </a>
                        <p style="margin-top: 50px; font-size: 10px; color: #000; text-transform: uppercase; letter-spacing: 1px;">
                            If you did not request this, please ignore this email.
                        </p>
                    </div>
                `
            });

            res.status(200).json({ message: 'Email sent' });
        } catch (err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
            res.status(500).json({ message: 'Email could not be sent' });
        }
    } catch (error) {
        console.error('Forgot Password Error:', error);
        res.status(getStatusCodeForError(error)).json({ message: error.message });
    }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        await ensureDatabaseConnection();

        if (!req.body.password || req.body.password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resettoken)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid token' });
        }

        // Set new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json(buildAuthResponse(user));
    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(getStatusCodeForError(error)).json({ message: error.message });
    }
};

