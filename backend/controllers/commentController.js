const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const Post = require('../models/Post');
const User = require('../models/User');
const { ADMIN_ROLES, isAdminRole } = require('../utils/roles');

// @desc    Add comment to post
// @route   POST /api/comments
// @access  Private

// exports.addComment = async (req, res) => {
//     const { postId, comment, parentId } = req.body;

//     try {
//         const newComment = await Comment.create({
//             postId,
//             userId: req.user._id,
//             comment,
//             parentId: parentId || null,
//             readByAdmin: req.user.role === 'admin'
//         });

//         const populatedComment = await Comment.findById(newComment._id).populate('userId', 'name');
//         res.status(201).json(populatedComment);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// @desc    Add comment to post
// @route   POST /api/comments
// @access  Public (demo) / Private
exports.addComment = async (req, res) => {
    const { postId, comment, parentId } = req.body;

    try {
        const userId = req.user._id;
        const userRole = req.user.role;

        const newComment = await Comment.create({
            postId,
            userId: userId,
            comment,
            parentId: parentId || null,
            readByAdmin: isAdminRole(userRole)
        });

        // --- NOTIFICATIONS ---
        const post = await Post.findById(postId);
        if (post) {
            // 1. Notify the creator of the post
            if (post.createdBy.toString() !== userId.toString()) {
                await Notification.create({
                    type: 'comment',
                    message: `${req.user ? req.user.name : 'A member'} commented on ${post.title}`,
                    userId: post.createdBy,
                    postId: post._id
                });
            }

            // 2. Notify all admins (if commenter is a user)
            if (userRole === 'user') {
                const admins = await User.find({ role: { $in: ADMIN_ROLES }, _id: { $ne: post.createdBy } });
                for (const admin of admins) {
                    await Notification.create({
                        type: 'comment',
                        message: `${req.user ? req.user.name : 'A member'} commented on ${post.title}`,
                        userId: admin._id,
                        postId: post._id
                    });
                }
            }
        }
        // ---------------------

        const populatedComment = await Comment.findById(newComment._id)
            .populate('userId', 'name');

        res.status(201).json(populatedComment);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ message: error.message });
    }
};



// @desc    Get comments for a post
// @route   GET /api/comments/:postId
// @access  Private

// exports.getComments = async (req, res) => {
//     try {
//         const comments = await Comment.find({ postId: req.params.postId })
//             .populate('userId', 'name')
//             .sort('-createdAt');
//         res.json(comments);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// @desc    Get comments for a post
// @route   GET /api/comments/:postId
// @access  Public (for demo)
exports.getComments = async (req, res) => {
    try {
        const comments = await Comment.find({ postId: req.params.postId })
            .populate('userId', 'name')
            .sort('-createdAt');

        res.json(comments || []);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Failed to fetch comments' });
    }
};

const mongoose = require('mongoose');

// @desc    Get admin notifications (grouped by post)
// @route   GET /api/comments/admin/notifications
// @access  Private/Admin
exports.getAdminNotifications = async (req, res) => {
    try {
        const adminId = req.user._id;

        // Use aggregation to group unread comments by post
        const notifications = await Comment.aggregate([
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
            { $limit: 10 } // Get latest 10 posts with unread activity
        ]);

        // Total count will be the number of unique posts with unread comments
        const totalUniquePosts = await Comment.distinct('postId', {
            readByAdmin: false,
            userId: { $ne: adminId }
        });

        const Post = mongoose.model('Post');
        const User = mongoose.model('User');

        // Hydrate with Post and User info
        const result = await Promise.all(notifications.map(async (n) => {
            const [post, user] = await Promise.all([
                Post.findById(n._id).select('title'),
                User.findById(n.lastUserId).select('name')
            ]);

            return {
                _id: n._id,
                postId: n._id,
                postTitle: post?.title || 'Unknown Post',
                userName: user?.name || 'Team Member',
                comment: n.lastComment,
                createdAt: n.lastDate,
                count: n.unreadCount
            };
        }));

        res.json({
            unreadCount: totalUniquePosts.length,
            latestComments: result
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Get user notifications (new briefings + admin replies)
// @route   GET /api/comments/user/notifications
// @access  Private

// exports.getUserNotifications = async (req, res) => {
//     try {
//         const userId = new mongoose.Types.ObjectId(req.user._id);
//         const Post = mongoose.model('Post');

//         // 1. Find new posts (not viewed by user yet)
//         const newPosts = await Post.find({
//             viewedBy: { $nin: [userId, req.user._id] },
//             isDeleted: { $ne: true }
//         }).select('title createdBy createdAt').populate('createdBy', 'name');

//         // 2. Find unread admin replies (comments for posts assigned to user)
//         // Only count replies from OTHER users (usually admin/other coworkers)
//         const unreadComments = await Comment.aggregate([
//             {
//                 $match: {
//                     readByUsers: { $nin: [userId, req.user._id] },
//                     userId: { $ne: userId }
//                 }
//             },
//             { $sort: { createdAt: -1 } },
//             {
//                 $group: {
//                     _id: "$postId",
//                     lastComment: { $first: "$comment" },
//                     lastUserId: { $first: "$userId" },
//                     lastDate: { $first: "$createdAt" },
//                     count: { $sum: 1 }
//                 }
//             }
//         ]);

//         // No longer filtering by assignedUsers as all posts are global
//         const filteredComments = unreadComments;

//         // Hydrate comments with Post and User info
//         const commentNotes = await Promise.all(filteredComments.map(async (n) => {
//             const [post, lastUser] = await Promise.all([
//                 Post.findById(n._id).select('title'),
//                 mongoose.model('User').findById(n.lastUserId).select('name')
//             ]);
//             return {
//                 _id: n._id,
//                 postId: n._id,
//                 type: 'reply',
//                 postTitle: post?.title || 'Unknown Post',
//                 userName: lastUser?.name || 'Admin',
//                 comment: n.lastComment,
//                 createdAt: n.lastDate,
//                 count: n.count
//             };
//         }));

//         // Convert new posts to same format
//         const postNotes = newPosts.map(a => ({
//             _id: a._id,
//             postId: a._id,
//             type: 'new_assignment', // Keep type internal for now, but change message
//             postTitle: a.title,
//             userName: a.createdBy?.name || 'Admin',
//             comment: 'New post published',
//             createdAt: a.createdAt,
//             count: 1
//         }));

//         // Combine and sort
//         const allNotifications = [...postNotes, ...commentNotes]
//             .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
//             .slice(0, 10);

//         // Unique post count for the badge
//         const uniqueNotePostIds = [...new Set([...postNotes, ...commentNotes].map(n => n._id.toString()))];

//         res.json({
//             unreadCount: uniqueNotePostIds.length,
//             latestComments: allNotifications
//         });
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };


// @desc    Get user notifications (new briefings + admin replies)
// @route   GET /api/comments/user/notifications
// @access  Public (demo) / Private
exports.getUserNotifications = async (req, res) => {
    try {
        // If no authenticated user (demo mode), return empty notifications
        if (!req.user) {
            return res.json({
                unreadCount: 0,
                latestComments: []
            });
        }

        const userId = new mongoose.Types.ObjectId(req.user._id);
        const Post = mongoose.model('Post');

        // 1. Find new posts (not viewed by user yet AND created after user registration)
        const newPosts = await Post.find({
            viewedBy: { $nin: [userId] },
            isDeleted: { $ne: true },
            createdAt: { $gte: req.user.createdAt }
        }).select('title createdBy createdAt').populate('createdBy', 'name');

        // 2. Find unread admin replies
        const unreadComments = await Comment.aggregate([
            {
                $match: {
                    readByUsers: { $nin: [userId] },
                    userId: { $ne: userId }
                }
            },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: "$postId",
                    lastComment: { $first: "$comment" },
                    lastUserId: { $first: "$userId" },
                    lastDate: { $first: "$createdAt" },
                    count: { $sum: 1 }
                }
            }
        ]);

        const commentNotes = await Promise.all(unreadComments.map(async (n) => {
            const [post, lastUser] = await Promise.all([
                Post.findById(n._id).select('title'),
                mongoose.model('User').findById(n.lastUserId).select('name')
            ]);
            return {
                _id: n._id,
                postId: n._id,
                type: 'reply',
                postTitle: post?.title || 'Unknown Post',
                userName: lastUser?.name || 'Admin',
                comment: n.lastComment,
                createdAt: n.lastDate,
                count: n.count
            };
        }));

        const postNotes = newPosts.map(a => ({
            _id: a._id,
            postId: a._id,
            type: 'new_assignment',
            postTitle: a.title,
            userName: a.createdBy?.name || 'Admin',
            comment: 'New post published',
            createdAt: a.createdAt,
            count: 1
        }));

        const allNotifications = [...postNotes, ...commentNotes]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);

        const uniqueNotePostIds = [...new Set([...postNotes, ...commentNotes].map(n => n._id.toString()))];

        res.json({
            unreadCount: uniqueNotePostIds.length,
            latestComments: allNotifications
        });
    } catch (error) {
        console.error('Error in getUserNotifications:', error);
        res.status(500).json({ message: 'Failed to fetch notifications' });
    }
};

// @desc    Update a comment
// @route   PUT /api/comments/:id
// @access  Private
exports.updateComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check ownership
        if (comment.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        comment.comment = req.body.comment || comment.comment;
        await comment.save();

        const populatedComment = await Comment.findById(comment._id).populate('userId', 'name');
        res.json(populatedComment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
exports.deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check ownership (admins can delete any comment)
        if (comment.userId.toString() !== req.user._id.toString() && !isAdminRole(req.user.role)) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // If it's a root comment, should we delete replies? 
        // For simplicity, we'll just delete this one.
        await Comment.deleteOne({ _id: req.params.id });

        res.json({ message: 'Comment removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete all comments for a post
// @route   DELETE /api/comments/post/:postId
// @access  Private/Admin
exports.deleteAllComments = async (req, res) => {
    try {
        if (!isAdminRole(req.user.role)) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await Comment.deleteMany({ postId: req.params.postId });
        res.json({ message: 'All comments removed for this post' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
