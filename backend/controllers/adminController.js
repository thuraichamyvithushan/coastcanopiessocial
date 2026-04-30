const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find({}).sort('-createdAt');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user status (approve/reject)
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const user = await User.findById(req.params.id);

        if (user) {
            user.status = status;
            await user.save();

            if (status === 'approved') {
                try {
                    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
                    const htmlMessage = `
                    <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #000; padding: 40px; background-color: #fff; text-align: left;">
                        <h2 style="font-size: 24px; font-weight: 900; text-transform: uppercase; margin-bottom: 20px; color: #000;">Account Approved.</h2>
                        <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 30px;">
                            Hello ${user.name},<br><br>
                            Your account has been approved by the administrator. You can now log in to the platform.
                        </p>
                        <a href="${frontendUrl}/login" style="display: inline-block; background: #000; color: #fff; text-decoration: none; padding: 20px 40px; font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; border: 2px solid #000; box-shadow: 6px 6px 0px #ff3e3e;">
                            Login Now
                        </a>
                        <p style="margin-top: 50px; font-size: 10px; color: #aaa; text-transform: uppercase; letter-spacing: 1px;">
                            Best regards,<br>HO SOCIAL Team
                        </p>
                    </div>
                    `;

                    await sendEmail({
                        email: user.email,
                        subject: 'Account Approved - HO SOCIAL',
                        html: htmlMessage
                    });
                } catch (err) {
                    console.error('Email failed to send:', err.message);
                }
            }

            res.json({ message: `User status updated to ${status}` });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user role (promote)
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findById(req.params.id);

        if (user) {
            user.role = role || 'admin';
            await user.save();
            res.json({ message: `User role updated to ${user.role}` });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            await user.deleteOne();
            res.json({ message: 'User removed from system' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
