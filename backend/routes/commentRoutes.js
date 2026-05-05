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
    getUserNotifications,
    updateComment,
    deleteComment,
    deleteAllComments
} = require('../controllers/commentController');

const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all routes
router.use(protect);

router.get('/user/notifications', getUserNotifications);
router.get('/admin/notifications', admin, getAdminNotifications);
router.get('/:postId', getComments);
router.post('/', addComment);
router.put('/:id', updateComment);
router.delete('/:id', deleteComment);
router.delete('/post/:postId', admin, deleteAllComments);

module.exports = router;