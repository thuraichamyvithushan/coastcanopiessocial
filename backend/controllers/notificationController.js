const mongoose = require('mongoose');

// @desc    Get admin's unified notifications (Comments + System Alerts)
// @route   GET /api/notifications/admin
// @access  Private/Admin
exports.getAdminNotifications = async (req, res) => {
    try {
        const adminId = req.user._id;
        const Notification = mongoose.model('Notification');
        const Comment = mongoose.model('Comment');
        const Post = mongoose.model('Post');
        const User = mongoose.model('User');

        // 1. Get Unread Comments (grouped by post) - Existing logic
        const unreadCommentsGrouped = await Comment.aggregate([
            {
                $match: {
                    readByAdmin: false,
                    userId: { $ne: adminId }
                }
            },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: "$postId",
                    lastComment: { $first: "$comment" },
                    lastUserId: { $first: "$userId" },
                    lastDate: { $first: "$createdAt" },
                    unreadCount: { $sum: 1 }
                }
            },
            { $sort: { lastDate: -1 } },
            { $limit: 10 }
        ]);

        const commentResults = await Promise.all(unreadCommentsGrouped.map(async (n) => {
            const [post, user] = await Promise.all([
                Post.findById(n._id).select('title'),
                User.findById(n.lastUserId).select('name')
            ]);
            return {
                _id: n._id,
                postId: n._id,
                type: 'reply',
                postTitle: post?.title || 'Unknown Post',
                userName: user?.name || 'Team Member',
                comment: n.lastComment,
                createdAt: n.lastDate,
                count: n.unreadCount
            };
        }));

        // 2. Get Unread System Notifications (Registrations, Login Attempts)
        const systemNotifications = await Notification.find({ read: false })
            .populate('userId', 'name email')
            .sort('-createdAt')
            .limit(10);

        const systemResults = systemNotifications.map(n => ({
            _id: n._id,
            type: n.type,
            postTitle: n.type === 'registration' ? 'New Registration' : 'Login Attempt',
            userName: n.userId?.name || 'Guest User',
            comment: n.message,
            createdAt: n.createdAt,
            count: 1
        }));

        // 3. Combine and Sort
        const allNotifications = [...commentResults, ...systemResults]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);

        // 4. Calculate total unread count
        const unreadPostsWithComments = await Comment.distinct('postId', {
            readByAdmin: false,
            userId: { $ne: adminId }
        });
        const unreadSystemCount = await Notification.countDocuments({ read: false });

        res.json({
            unreadCount: unreadPostsWithComments.length + unreadSystemCount,
            latestComments: allNotifications
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark notification(s) as read
// @route   PUT /api/notifications/read
// @access  Private/Admin
exports.markAsRead = async (req, res) => {
    try {
        const { id, type } = req.body;
        const Comment = mongoose.model('Comment');
        const Notification = mongoose.model('Notification');
        const Post = mongoose.model('Post');
        const userId = req.user._id;

        if (type === 'reply') {
            if (req.user.role === 'admin') {
                await Comment.updateMany({ postId: id, readByAdmin: false }, { readByAdmin: true });
            } else {
                await Comment.updateMany(
                    { postId: id, readByUsers: { $ne: userId } },
                    { $addToSet: { readByUsers: userId } }
                );
            }
        } else if (type === 'new_post' || type === 'new_assignment') {
            // Mark the post itself as viewed by this user
            await Post.findByIdAndUpdate(id, { $addToSet: { viewedBy: userId } });
        } else {
            // It's a system notification (registration, etc.)
            await Notification.findByIdAndUpdate(id, { read: true });
        }

        res.json({ message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user's unified notifications
// @route   GET /api/notifications/user
// @access  Private

// exports.getUserNotifications = async (req, res) => {
//     // For now, users only have comments and posts.
//     // We can proxy this to the existing commentController logic or unify here.
//     // I'll keep it simple for now as the user specifically asked for Admin.
//     try {
//         // Proxying or similar logic could go here if needed.
//         res.status(501).json({ message: 'Not implemented for regular users' });
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

exports.getUserNotifications = async (req, res) => {
    try {
        // If no user (demo mode), return empty array or dummy notifications
        if (!req.user) {
            return res.json([]);   // or some mock notifications
        }

        // Original logic for logged-in users
        const notifications = await Notification.find({ 
            user: req.user._id 
        }).sort('-createdAt');

        res.json(notifications);
    } catch (error) {
        console.error('Error fetching user notifications:', error);
        res.status(500).json({ message: 'Failed to fetch notifications' });
    }
};