// const express = require('express');
// const { addComment, getComments, getAdminNotifications, getUserNotifications } = require('../controllers/commentController');
// const { protect, admin } = require('../middleware/authMiddleware');
// const router = express.Router();

// router.use(protect);

// router.post('/', addComment);
// router.get('/admin/notifications', admin, getAdminNotifications);
// router.get('/user/notifications', getUserNotifications);
// router.get('/:postId', getComments);

// module.exports = router;


const express = require('express');
const { 
    addComment, 
    getComments, 
    getAdminNotifications, 
    getUserNotifications 
} = require('../controllers/commentController');

const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// ====================== PUBLIC ROUTES (Demo Mode) ======================
router.get('/user/notifications', getUserNotifications);     // Notifications for users
router.get('/:postId', getComments);                         // ← Anyone can read comments
router.post('/', addComment);                                // ← Anyone can add comments

// ====================== PROTECTED ROUTES ======================
router.use(protect);

router.get('/admin/notifications', admin, getAdminNotifications);

module.exports = router;