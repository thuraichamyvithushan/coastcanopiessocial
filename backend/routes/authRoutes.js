const express = require('express');
const { registerUser, loginUser, forgotPassword, resetPassword, firebaseAuth } = require('../controllers/authController');
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/firebase', firebaseAuth);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

module.exports = router;
