// const express = require('express');
// const { getAdminNotifications, getUserNotifications, markAsRead } = require('../controllers/notificationController');
// const { protect, admin } = require('../middleware/authMiddleware');
// const router = express.Router();

// router.use(protect);

// router.get('/admin', admin, getAdminNotifications);
// router.get('/user', getUserNotifications);
// router.put('/read', markAsRead);

// module.exports = router;


const express = require('express');
const { 
    getAdminNotifications, 
    getUserNotifications, 
    markAsRead 
} = require('../controllers/notificationController');

const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// ==================== PUBLIC ROUTE ====================
// Allow access without authentication for demo/dashboard
router.get('/user', getUserNotifications);

// ==================== PROTECTED ROUTES ====================
router.use(protect);

router.get('/admin', admin, getAdminNotifications);
router.put('/read', markAsRead);

module.exports = router;