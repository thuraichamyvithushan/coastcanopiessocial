const mongoose = require('mongoose');
const { isAdminRole } = require('../utils/roles');

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
            postId: n.postId,
            type: n.type,
            postTitle: n.type === 'registration' ? 'New Registration' : 
                       n.type === 'login_attempt' ? 'Login Attempt' : 
                       n.type === 'like' ? 'New Like' : 'New Activity',
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
            if (isAdminRole(req.user.role)) {
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
            // It's a system notification (registration, like, etc.)
            await Notification.findByIdAndUpdate(id, { read: true });
        }

        res.json({ message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark ALL notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        const Comment = mongoose.model('Comment');
        const Notification = mongoose.model('Notification');
        const Post = mongoose.model('Post');

        if (isAdminRole(req.user.role)) {
            // 1. Mark all unread comments as read by admin
            await Comment.updateMany({ readByAdmin: false }, { readByAdmin: true });
            
            // 2. Mark all system notifications as read
            await Notification.updateMany({ read: false }, { read: true });
        } else {
            // 1. Mark all comments as read by this user
            await Comment.updateMany(
                { readByUsers: { $ne: userId }, userId: { $ne: userId } },
                { $addToSet: { readByUsers: userId } }
            );

            // 2. Mark all user-specific system notifications as read
            await Notification.updateMany({ userId: userId, read: false }, { read: true });
            
            // 3. Mark all unread posts as viewed by this user
            await Post.updateMany(
                { viewedBy: { $ne: userId } },
                { $addToSet: { viewedBy: userId } }
            );
        }

        res.json({ message: 'All notifications marked as read' });
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
        // Get unread notifications for this user
        const notes = await Notification.find({ 
            userId: req.user._id,
            read: false
        })
        .populate('postId', 'title')
        .sort('-createdAt');

        const formatted = notes.map(n => ({
            _id: n._id,
            postId: n.postId?._id,
            type: n.type,
            postTitle: n.postId?.title || 'System',
            userName: 'Coast Canopies Social',
            comment: n.message,
            createdAt: n.createdAt,
            count: 1
        }));

        res.json({
            unreadCount: formatted.length,
            latestComments: formatted
        });
    } catch (error) {
        console.error('Error fetching user notifications:', error);
        res.status(500).json({ message: 'Failed to fetch notifications' });
    }
};
