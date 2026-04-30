const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const mongoose = require('mongoose');
const admin = require('../config/firebase');

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
    const { name, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = new User({
            name,
            email,
            password
        });

        await user.save();

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            });

            // Create notification for admin
            const Notification = mongoose.model('Notification');
            await Notification.create({
                type: 'registration',
                message: `New portal access request from ${name} (${email}).`,
                userId: user._id
            });

            // Send email to admin if configured
            if (process.env.ADMIN_NOTIFICATION_EMAIL) {
                try {
                    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
                    const htmlMessage = `
                    <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #000; padding: 40px; background-color: #fff; text-align: left;">
                        <h2 style="font-size: 24px; font-weight: 900; text-transform: uppercase; margin-bottom: 20px; color: #000;">New Member Request.</h2>
                        <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 30px;">
                            A new user has registered and is pending approval:
                        </p>
                        <div style="background: #f9f9f9; border: 1px solid #eee; padding: 20px; margin-bottom: 30px;">
                            <p style="margin: 0 0 10px 0; font-size: 14px;"><strong>Name:</strong> ${name}</p>
                            <p style="margin: 0; font-size: 14px;"><strong>Email:</strong> ${email}</p>
                        </div>
                        <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 30px;">
                            Please log in to the admin dashboard to review their request.
                        </p>
                        <a href="${frontendUrl}/admin-dashboard" style="display: inline-block; background: #000; color: #fff; text-decoration: none; padding: 20px 40px; font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; border: 2px solid #000; box-shadow: 6px 6px 0px #ff3e3e;">
                            Admin Dashboard
                        </a>
                        <p style="margin-top: 50px; font-size: 10px; color: #aaa; text-transform: uppercase; letter-spacing: 1px;">
                            HO SOCIAL SYSTEM ALERT
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
        res.status(500).json({ message: error.message });
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).select('+password');

        if (user && (await user.comparePassword(password, user.password))) {
            if (user.status !== 'approved') {
                // Notifiy admin of login attempt from pending user
                const Notification = mongoose.model('Notification');
                await Notification.create({
                    type: 'login_attempt',
                    message: `Pending user ${user.name} (${user.email}) attempted to log in.`,
                    userId: user._id
                });

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

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // In a real prod environment, this should be the frontend URL
    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/resetpassword/${resetToken}`;
    // For local dev with separate frontend
    const clientResetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${clientResetUrl}`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Password reset token',
            message,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px; background: #fff; border: 1px solid #eee;">
                    <h1 style="font-size: 40px; font-weight: 900; letter-spacing: -2px; text-transform: uppercase; font-style: italic; margin: 0 0 20px;">
                        HO <span style="color: #ff3e3e;">SOCIAL.</span>
                    </h1>
                    <h2 style="font-size: 24px; font-weight: 900; text-transform: uppercase; margin-bottom: 20px;">Password Reset.</h2>
                    <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 30px;">
                        You requested a password reset. Click the button below to set a new password. This link is valid for 10 minutes.
                    </p>
                    <a href="${clientResetUrl}" style="display: inline-block; background: #000; color: #fff; text-decoration: none; padding: 20px 40px; font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; border: 2px solid #000; box-shadow: 6px 6px 0px #ff3e3e;">
                        Reset Password
                    </a>
                    <p style="margin-top: 50px; font-size: 10px; color: #aaa; text-transform: uppercase; letter-spacing: 1px;">
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
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res) => {
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

    res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        token: generateToken(user._id)
    });
};

// @desc    Firebase Auth (Login/Register sync)
// @route   POST /api/auth/firebase
// @access  Public
exports.firebaseAuth = async (req, res) => {
    const { idToken } = req.body;

    try {
        // 1. Verify Firebase Token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { uid, email, name, picture } = decodedToken;

        // 2. Find user in MongoDB
        let user = await User.findOne({ email });

        if (user) {
            // Update firebaseUid if not set
            if (!user.firebaseUid) {
                user.firebaseUid = uid;
                await user.save();
            }
        } else {
            // 3. Create new user if doesn't exist
            user = await User.create({
                name: name || email.split('@')[0],
                email: email,
                firebaseUid: uid,
                status: 'approved' // Automatically approve Firebase users
            });

            // Log the new registration (optional)
            const Notification = mongoose.model('Notification');
            await Notification.create({
                type: 'registration',
                message: `New automatic approval for ${user.name} (${email}).`,
                userId: user._id
            });
        }

        // 4. Ensure existing user is also approved if they are logging in via Firebase
        if (user.status === 'pending') {
            user.status = 'approved';
            await user.save();
        }

        // 5. Generate our own JWT for the existing middleware compatibility
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            token: generateToken(user._id)
        });

    } catch (error) {
        console.error('Firebase Auth Error:', error);
        res.status(401).json({ message: 'Invalid or expired Firebase token' });
    }
};
