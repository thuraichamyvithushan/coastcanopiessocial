// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const {
//     createPost,
//     getUserPosts,
//     getUserArchivedPosts,
//     getAdminPosts,
//     getAdminArchivedPosts,
//     getPostById,
//     updatePost,
//     archivePost,
//     unarchivePost,
//     deletePost,
//     getRecentActivity,
//     toggleLike
// } = require('../controllers/postController');
// const { protect, admin } = require('../middleware/authMiddleware');
// const router = express.Router();

// const upload = multer({ 
//     storage: multer.memoryStorage(),
//     limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
// });

// router.use(protect);

// router.post('/', admin, upload.array('media', 10), createPost);
// router.get('/user', getUserPosts);
// router.get('/user/archived', getUserArchivedPosts);
// router.get('/admin', admin, getAdminPosts);
// router.get('/admin/archived', admin, getAdminArchivedPosts);
// router.get('/admin/recent-activity', admin, getRecentActivity);
// router.get('/:id', getPostById);
// router.put('/:id', admin, updatePost);
// router.patch('/:id/archive', archivePost);
// router.patch('/:id/unarchive', unarchivePost);
// router.patch('/:id/like', toggleLike);
// router.delete('/:id', admin, deletePost);

// module.exports = router;



const express = require('express');
const multer = require('multer');

const {
    createPost,
    getUserPosts,
    getUserArchivedPosts,
    getAdminPosts,
    getAdminArchivedPosts,
    getPostById,
    updatePost,
    archivePost,
    unarchivePost,
    deletePost,
    getRecentActivity,
    toggleLike
} = require('../controllers/postController');

const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }
});


// ====================== PUBLIC ROUTES ======================
router.get('/user', getUserPosts);


// ====================== ADMIN ROUTES (PROTECTED) ======================
router.get('/admin', protect, admin, getAdminPosts);
router.get('/admin/archived', protect, admin, getAdminArchivedPosts);
router.get('/admin/recent-activity', protect, admin, getRecentActivity);


// ====================== OTHER PROTECTED ROUTES ======================
router.post('/', protect, admin, upload.array('media', 10), createPost);
router.get('/user/archived', protect, getUserArchivedPosts);
router.put('/:id', protect, admin, updatePost);
router.patch('/:id/archive', protect, archivePost);
router.patch('/:id/unarchive', protect, unarchivePost);
router.patch('/:id/like', protect, toggleLike);
router.delete('/:id', protect, admin, deletePost);


// ====================== DYNAMIC ROUTE (KEEP LAST) ======================
router.get('/:id', getPostById);


module.exports = router;