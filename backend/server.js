const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');

// Models
require('./models/User');
require('./models/Post');
require('./models/Comment');
require('./models/Notification');

// Route files
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

dotenv.config();

// Connect to database (with error handling for serverless)
connectDB().catch(err => {
    console.error('Initial MongoDB connection failed:', err.message);
});

const app = express();

// Body parser
app.use(express.json());

// Enable CORS with specific origins
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://huntsmansocial.vercel.app',
    process.env.CLIENT_URL // For production Vercel URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow defined origins OR any vercel.app subdomain
        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
            return callback(null, true);
        } else {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
    },
    credentials: true
}));

// Set security headers
app.use(helmet({
    crossOriginResourcePolicy: false,
}));

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Set static folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check / Root Route
app.get('/', (req, res) => {
    res.json({
        status: 'HO SOCIAL Server is Live.',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);

// Centralized Error Handler
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
}

module.exports = app;
