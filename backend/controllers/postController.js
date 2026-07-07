const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const sendEmail = require('../utils/sendEmail');
const { uploadBufferToGridFS } = require('../utils/gridfs');
const { isCloudinaryConfigured, uploadBufferToCloudinary } = require('../utils/cloudinary');
const ics = require('ics');
const { ADMIN_ROLES, isAdminRole } = require('../utils/roles');

// @desc    Create new post (supports multiple media files)
// @route   POST /api/posts
// @access  Private/Admin
exports.createPost = async (req, res) => {
    const { title, description, platforms, eventDate  } = req.body;

    try {
        const useCloudinary = isCloudinaryConfigured();
        const media = await Promise.all((req.files || []).map(async (file) => {
            if (useCloudinary) {
                const uploadedFile = await uploadBufferToCloudinary({
                    buffer: file.buffer,
                    filename: file.originalname,
                    contentType: file.mimetype
                });

                return {
                    url: uploadedFile.url,
                    type: file.mimetype.startsWith('video') ? 'video' : 'image',
                    provider: uploadedFile.provider,
                    publicId: uploadedFile.publicId,
                    fileId: '',
                    filename: file.originalname,
                    contentType: file.mimetype,
                    size: file.size
                };
            }

            const uploadedFile = await uploadBufferToGridFS({
                buffer: file.buffer,
                filename: file.originalname,
                contentType: file.mimetype
            });

            return {
                url: `/api/media/${uploadedFile.fileId}`,
                type: file.mimetype.startsWith('video') ? 'video' : 'image',
                provider: 'gridfs',
                publicId: '',
                fileId: uploadedFile.fileId,
                filename: file.originalname,
                contentType: file.mimetype,
                size: file.size
            };
        }));

        // Legacy compat: set first file as mediaUrl/mediaType
        const firstMedia = media[0] || {};

        const post = await Post.create({
            title,
            description,
            eventDate,
            media,
            mediaUrl: firstMedia.url || '',
            mediaType: firstMedia.type || 'image',
            platforms: platforms ? JSON.parse(platforms) : [],
            regions: [],
            createdBy: req.user._id
        });

        // Email all approved users
        const users = await User.find({ status: 'approved', role: 'user' });
        for (const user of users) {
            try {
                const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
                const loginUrl = `${frontendUrl}/login`;
                await sendEmail({
                    email: user.email,
                    subject: 'New Design Briefing - Coast Canopies Social',
                    message: `Hello ${user.name},\n\nA new design briefing "${post.title}" has been published. Login here: ${loginUrl}`,
                    html: `
                            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px; background: #fffdf7; border: 2px solid #000;">
                                <h1 style="font-size: 40px; font-weight: 900; letter-spacing: -2px; text-transform: uppercase; font-style: italic; margin: 0 0 20px;">
                                    COAST CANOPIES <span style="color: #f9bf1e;">SOCIAL.</span>
                                </h1>
                                <p style="text-transform: uppercase; font-size: 10px; font-weight: bold; letter-spacing: 2px; color: #000; margin-bottom: 40px;">Content Management Platform</p>
                                
                                <h2 style="font-size: 24px; font-weight: 900; text-transform: uppercase; margin-bottom: 10px; color: #000;">New Design Briefing Ready.</h2>
                                <p style="font-size: 16px; color: #000; line-height: 1.6; margin-bottom: 30px;">
                                    Hello <strong>${user.name}</strong>,<br><br>
                                    A new design briefing is ready for review: <br>
                                    <span style="font-style: italic; background: #fff0bf; padding: 5px 10px; border-left: 4px solid #f9bf1e; display: inline-block; margin-top: 10px; color: #000;">"${post.title}"</span>
                                </p>
                                
                                <a href="${loginUrl}" style="display: inline-block; background: #f9bf1e; color: #000; text-decoration: none; padding: 20px 40px; font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; border: 2px solid #000; box-shadow: 6px 6px 0px #000;">
                                    View Post
                                </a>
                                
                                <p style="margin-top: 50px; font-size: 10px; color: #000; text-transform: uppercase; letter-spacing: 1px;">
                                    This is an automated system notification. Please do not reply directly to this email.
                                </p>
                            </div>
                        `
                });
            } catch (err) {
                console.error(`Email failed for ${user.email}:`, err.message);
            }
        }

        res.status(201).json(post);
    } catch (error) {
        console.error('Create post upload error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user's assigned posts (excludes archived-by-user and deleted)
// @route   GET /api/posts/user
// @access  Private

// exports.getUserPosts = async (req, res) => {
//     try {
//         const Comment = require('../models/Comment');
//         const posts = await Post.find({
//             isDeleted: { $ne: true }
//         })
//             .populate('createdBy', 'name')
//             .sort('-createdAt');

//         // Attach comment count and unread status to each post
//         const postsWithStatus = await Promise.all(posts.map(async (post) => {
//             const commentCount = await Comment.countDocuments({ postId: post._id });
//             const isNew = !post.viewedBy.some(id => id.toString() === req.user._id.toString());
//             return { ...post.toObject(), commentCount, isNew };
//         }));

//         res.json(postsWithStatus);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

exports.getUserPosts = async (req, res) => {
    try {
        const Comment = require('../models/Comment');

        // If no user (demo mode), return all active posts
        const posts = await Post.find({
            isDeleted: { $ne: true }
        })
            .populate('createdBy', 'name')
            .populate('likes', 'name')
            .sort('-createdAt');

        // Attach comment count and unread status safely
        const postsWithStatus = await Promise.all(posts.map(async (post) => {
            const commentCount = await Comment.countDocuments({ postId: post._id });

            let isNew = false;

            // Only check "isNew" if user is logged in
            if (req.user && req.user._id) {
                isNew = !post.viewedBy.some(id => 
                    id.toString() === req.user._id.toString()
                );
            }

            return { 
                ...post.toObject(), 
                commentCount, 
                isNew 
            };
        }));

        res.json(postsWithStatus);
    } catch (error) {
        console.error('Error in getUserPosts:', error);
        res.status(500).json({ 
            message: 'Failed to fetch posts',
            error: error.message 
        });
    }
};



// @desc    Get user's archived posts
// @route   GET /api/posts/archived
// @access  Private
exports.getUserArchivedPosts = async (req, res) => {
    try {
        const posts = await Post.find({
            isDeleted: { $ne: true },
            archivedBy: req.user._id
        })
            .populate('createdBy', 'name')
            .sort('-createdAt');
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all active posts (not archived/deleted) for admin
// @route   GET /api/posts/admin
// @access  Private/Admin

// exports.getAdminPosts = async (req, res) => {
//     try {
//         const posts = await Post.find({
//             isDeleted: { $ne: true },
//             archivedBy: { $ne: req.user._id }
//         })
//             .populate('assignedUsers', 'name email')
//             .populate('createdBy', 'name')
//             .sort('-createdAt');

//         const postsWithCount = await Promise.all(posts.map(async (post) => {
//             const unreadCount = await Comment.countDocuments({ postId: post._id, readByAdmin: false });
//             const totalCount = await Comment.countDocuments({ postId: post._id });
//             return { ...post.toObject(), unreadReplies: unreadCount, totalReplies: totalCount };
//         }));

//         res.json(postsWithCount);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// @desc    Get all active posts for admin
// @route   GET /api/posts/admin
// @access  Private/Admin
exports.getAdminPosts = async (req, res) => {
    try {
        // Safety check - if no user or not admin, return empty or limited data
        if (!req.user || !isAdminRole(req.user.role)) {
            return res.status(403).json({ 
                message: 'Admin access required' 
            });
        }

        const posts = await Post.find({
            isDeleted: { $ne: true }
        })
            .populate('assignedUsers', 'name email')
            .populate('createdBy', 'name')
            .populate('likes', 'name')
            .sort('-createdAt');

        // Attach comment counts safely
        const postsWithCount = await Promise.all(posts.map(async (post) => {
            const unreadCount = await Comment.countDocuments({ 
                postId: post._id, 
                readByAdmin: false 
            });
            const totalCount = await Comment.countDocuments({ postId: post._id });

            return { 
                ...post.toObject(), 
                unreadReplies: unreadCount, 
                totalReplies: totalCount 
            };
        }));

        res.json(postsWithCount);
    } catch (error) {
        console.error('Error in getAdminPosts:', error);
        res.status(500).json({ 
            message: 'Failed to fetch admin posts',
            error: error.message 
        });
    }
};



// @desc    Get admin-archived posts
// @route   GET /api/posts/admin/archived
// @access  Private/Admin
exports.getAdminArchivedPosts = async (req, res) => {
    try {
        const posts = await Post.find({
            isDeleted: { $ne: true },
            archivedBy: req.user._id
        })
            .populate('assignedUsers', 'name email')
            .populate('createdBy', 'name')
            .populate('likes', 'name')
            .sort('-createdAt');

        const postsWithCount = await Promise.all(posts.map(async (post) => {
            const unreadCount = await Comment.countDocuments({ postId: post._id, readByAdmin: false });
            const totalCount = await Comment.countDocuments({ postId: post._id });
            return { ...post.toObject(), unreadReplies: unreadCount, totalReplies: totalCount };
        }));

        res.json(postsWithCount);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get post by ID
// @route   GET /api/posts/:id
// @access  Private

// exports.getPostById = async (req, res) => {
//     try {
//         const post = await Post.findById(req.params.id)
//             .populate('assignedUsers', 'name email')
//             .populate('createdBy', 'name');

//         if (!post) return res.status(404).json({ message: 'Post not found' });
//         if (post.isDeleted) return res.status(404).json({ message: 'Post not found' });

//         const isAdmin = req.user.role === 'admin';
//         // Any approved user can view any post
//         if (!isAdmin && req.user.status !== 'approved') {
//             return res.status(403).json({ message: 'Not authorized to view this post' });
//         }

//         // If admin is viewing, mark all replies as read
//         if (isAdmin) {
//             await Comment.updateMany({ postId: post._id, readByAdmin: false }, { readByAdmin: true });
//         } else {
//             // If user is viewing, mark post as viewed and all admin comments as read for this user
//             const hasViewed = post.viewedBy.some(id => id.toString() === req.user._id.toString());
//             if (!hasViewed) {
//                 post.viewedBy.push(req.user._id);
//                 await post.save();
//             }
//             // Mark all comments for this post as read by this user
//             await Comment.updateMany(
//                 { postId: post._id, readByUsers: { $ne: req.user._id } },
//                 { $addToSet: { readByUsers: req.user._id } }
//             );
//         }

//         res.json(post);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// @desc    Get post by ID
// @route   GET /api/posts/:id
// @access  Public (for demo)
exports.getPostById = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('assignedUsers', 'name email')
            .populate('likes', 'name');

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.isDeleted) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // If user is logged in, do extra actions (mark as viewed, etc.)
        if (req.user) {
            const isAdmin = isAdminRole(req.user.role);

            if (isAdmin) {
                // Mark all comments as read for admin
                await Comment.updateMany(
                    { postId: post._id, readByAdmin: false },
                    { readByAdmin: true }
                );
            } else {
                // Mark post as viewed by user
                const hasViewed = post.viewedBy?.some(id => id.toString() === req.user._id.toString());
                if (!hasViewed) {
                    post.viewedBy = post.viewedBy || [];
                    post.viewedBy.push(req.user._id);
                    await post.save();
                }

                // Mark comments as read by this user
                await Comment.updateMany(
                    { postId: post._id, readByUsers: { $ne: req.user._id } },
                    { $addToSet: { readByUsers: req.user._id } }
                );
            }
        }

        // Return post (even if no user)
        res.json(post);
    } catch (error) {
        console.error('Error in getPostById:', error);
        res.status(500).json({ 
            message: 'Failed to fetch post details',
            error: error.message 
        });
    }
};

// @desc    Archive a post (per-user or admin)
// @route   PATCH /api/posts/:id/archive
// @access  Private
exports.archivePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post || post.isDeleted) return res.status(404).json({ message: 'Post not found' });

        const userId = req.user._id.toString();
        const isAdmin = isAdminRole(req.user.role);
        const isApproved = req.user.status === 'approved';

        if (!isAdmin && !isApproved) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Add to archivedBy if not already present
        if (!post.archivedBy.map(id => id.toString()).includes(userId)) {
            post.archivedBy.push(req.user._id);
            await post.save();
        }

        res.json({ message: 'Post archived' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Unarchive a post (per-user or admin)
// @route   PATCH /api/posts/:id/unarchive
// @access  Private
exports.unarchivePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post || post.isDeleted) return res.status(404).json({ message: 'Post not found' });

        const userId = req.user._id.toString();
        const isAdmin = isAdminRole(req.user.role);
        const isApproved = req.user.status === 'approved';

        if (!isAdmin && !isApproved) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        post.archivedBy = post.archivedBy.filter(id => id.toString() !== userId);
        await post.save();

        res.json({ message: 'Post unarchived' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a post (admin only)
// @route   PUT /api/posts/:id
// @access  Private/Admin

// exports.updatePost = async (req, res) => {
//     try {
//         const { title, description, platforms, regions } = req.body;
//         const post = await Post.findById(req.params.id);

//         if (!post) return res.status(404).json({ message: 'Post not found' });

//         post.title = title || post.title;
//         post.description = description || post.description;
//         if (platforms) post.platforms = JSON.parse(platforms);
//         if (regions) post.regions = JSON.parse(regions);

//         await post.save();

//         // Optional: Notify everyone on update? User didn't specify for updates, but usually it's helpful.
//         // For now, let's just save.
//         // If the user wants update emails too, I would repeat the createPost logic here.

//         res.json(post);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

exports.updatePost = async (req, res) => {
    try {
        const { title, description, platforms, eventDate } = req.body;

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Basic fields
        if (title !== undefined) post.title = title;
        if (description !== undefined) post.description = description;
        if (eventDate !== undefined) post.eventDate = eventDate;

        // SAFE PARSING (FIX 🔥)
        if (platforms !== undefined) {
            post.platforms =
                typeof platforms === 'string'
                    ? JSON.parse(platforms)
                    : platforms;
        }

        post.regions = [];

        await post.save();

        res.json(post);
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({
            message: 'Failed to update post',
            error: error.message
        });
    }
};




// @desc    Delete (soft) a post — admin only
// @route   DELETE /api/posts/:id
// @access  Private/Admin
exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        post.isDeleted = true;
        await post.save();

        res.json({ message: 'Post deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get 3 posts with the most recent replies
// @route   GET /api/posts/admin/recent-activity
// @access  Private/Admin
exports.getRecentActivity = async (req, res) => {
    try {
        const recentComments = await Comment.find()
            .sort('-createdAt')
            .limit(20);

        // Get unique post IDs from recent comments
        const uniquePostIds = [...new Set(recentComments.map(c => c.postId.toString()))].slice(0, 3);

        const posts = await Post.find({ _id: { $in: uniquePostIds }, isDeleted: { $ne: true } })
            .populate('assignedUsers', 'name email')
            .populate('createdBy', 'name');

        const postsWithCount = await Promise.all(posts.map(async (post) => {
            const unreadCount = await Comment.countDocuments({ postId: post._id, readByAdmin: false });
            const totalCount = await Comment.countDocuments({ postId: post._id });
            // Get the last comment to show its date and user
            const lastComment = await Comment.findOne({ postId: post._id })
                .sort('-createdAt')
                .populate('userId', 'name role');

            let lastRepliedBy = 'System';
            if (lastComment) {
                if (lastComment.userId && lastComment.userId.name) {
                    lastRepliedBy = lastComment.userId.name;
                } else {
                    lastRepliedBy = 'A Member'; // Fallback for deleted or demo users
                }
            }

            return {
                ...post.toObject(),
                unreadReplies: unreadCount,
                totalReplies: totalCount,
                lastActivity: lastComment ? lastComment.createdAt : post.updatedAt,
                lastRepliedBy: lastRepliedBy
            };
        }));

        // Sort by lastActivity again to ensure correct order
        postsWithCount.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

        res.json(postsWithCount);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle like on a post
// @route   PATCH /api/posts/:id/like
// @access  Private

// exports.toggleLike = async (req, res) => {
//     try {
//         const post = await Post.findById(req.params.id);
//         if (!post) return res.status(404).json({ message: 'Post not found' });

//         // Ensure likes array exists
//         if (!post.likes) post.likes = [];

//         const userId = req.user._id.toString();
//         const isLiked = post.likes.some(id => (id._id || id).toString() === userId);

//         if (isLiked) {
//             // Remove like
//             post.likes = post.likes.filter(id => (id._id || id).toString() !== userId);
//         } else {
//             // Add like
//             post.likes.push(req.user._id);
//         }

//         await post.save();
//         res.json({ likes: post.likes });
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

exports.toggleLike = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        // Safety check - if no user, return error
        if (!req.user) {
            return res.status(401).json({ message: 'Please login to like posts' });
        }

        if (!post.likes) post.likes = [];

        const userId = req.user._id.toString();
        const isLiked = post.likes.some(id => (id._id || id).toString() === userId);

        if (isLiked) {
            post.likes = post.likes.filter(id => (id._id || id).toString() !== userId);
        } else {
            post.likes.push(req.user._id);
        }

        await post.save();

        // --- NOTIFICATIONS ---
        if (!isLiked) {
            // 1. Notify the creator of the post
            if (post.createdBy.toString() !== userId) {
                await Notification.create({
                    type: 'like',
                    message: `${req.user.name} liked your design: ${post.title}`,
                    userId: post.createdBy,
                    postId: post._id
                });
            }

            // 2. Notify other admins (if the liker is a user)
            if (req.user.role === 'user') {
                const admins = await User.find({ role: { $in: ADMIN_ROLES }, _id: { $ne: post.createdBy } });
                for (const admin of admins) {
                    await Notification.create({
                        type: 'like',
                        message: `${req.user.name} liked ${post.title}`,
                        userId: admin._id,
                        postId: post._id
                    });
                }
            }
        }
        // ---------------------
        const updatedPost = await Post.findById(post._id).populate('likes', 'name');
        res.json({ likes: updatedPost.likes });
    } catch (error) {
        console.error('Error in toggleLike:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Send calendar invites to specific users
// @route   POST /api/posts/:id/invite
// @access  Private/Admin
exports.sendCalendarInvites = async (req, res) => {
    try {
        const { userIds } = req.body;
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (!post.eventDate) {
            return res.status(400).json({ message: 'This post does not have an event date.' });
        }

        if (!userIds || userIds.length === 0) {
            return res.status(400).json({ message: 'No users selected for the invite.' });
        }

        const users = await User.find({ _id: { $in: userIds } });

        if (users.length === 0) {
            return res.status(404).json({ message: 'Selected users not found' });
        }

        // Parse the event date. Assuming post.eventDate is a string (e.g., 'YYYY-MM-DD' or ISO string)
        const dateObj = new Date(post.eventDate);
        
        // ics expects [year, month, date, hours, minutes] for a specific time, 
        // or [year, month, date] for an all-day event.
        // We will make it an all-day event based on the dateObj.
        const event = {
            start: [dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate()],
            title: post.title,
            description: post.description,
            status: 'CONFIRMED',
            busyStatus: 'BUSY',
            organizer: { name: req.user.name, email: req.user.email }
        };

        ics.createEvent(event, async (error, value) => {
            if (error) {
                console.error('ICS Generation Error:', error);
                return res.status(500).json({ message: 'Failed to generate calendar invite.' });
            }

            // Create a buffer from the ics string
            const icsBuffer = Buffer.from(value, 'utf-8');

            const emailPromises = users.map(async (user) => {
                const message = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #fffdf7; border: 2px solid #000;">
                        <h1 style="font-size: 40px; font-weight: 900; letter-spacing: -2px; text-transform: uppercase; font-style: italic; margin: 0 0 20px;">
                            COAST CANOPIES <span style="color: #f9bf1e;">SOCIAL.</span>
                        </h1>
                        <p style="text-transform: uppercase; font-size: 10px; font-weight: bold; letter-spacing: 2px; color: #000; margin-bottom: 40px;">Content Management Platform</p>
                        <h2 style="font-size: 24px; font-weight: 900; text-transform: uppercase; margin-bottom: 20px; color: #000;">Calendar Invite: ${post.title}</h2>
                        <p style="font-size: 16px; color: #000; line-height: 1.6;">Hello ${user.name},</p>
                        <p style="font-size: 16px; color: #000; line-height: 1.6;">You have been invited to an event related to the following post:</p>
                        <div style="background: #fff0bf; border-left: 4px solid #f9bf1e; padding: 15px; margin: 15px 0; color: #000;">
                            <strong>${post.title}</strong><br/>
                            <p>${post.description}</p>
                            <p><strong>Date:</strong> ${dateObj.toLocaleDateString()}</p>
                        </div>
                        <p style="font-size: 16px; color: #000; line-height: 1.6;">Please find the attached calendar invite (.ics file) to add this event to your personal calendar.</p>
                        <p style="margin-top: 50px; font-size: 10px; color: #000; text-transform: uppercase; letter-spacing: 1px;">Best regards,<br/>Coast Canopies Social Team</p>
                    </div>
                `;

                return sendEmail({
                    email: user.email,
                    subject: `Calendar Invite: ${post.title}`,
                    html: message,
                    attachments: [
                        {
                            filename: 'invite.ics',
                            content: icsBuffer,
                            contentType: 'text/calendar'
                        }
                    ]
                });
            });

            await Promise.all(emailPromises);

            res.status(200).json({ message: 'Calendar invites sent successfully.' });
        });
    } catch (error) {
        console.error('Error in sendCalendarInvites:', error);
        res.status(500).json({ message: error.message });
    }
};
