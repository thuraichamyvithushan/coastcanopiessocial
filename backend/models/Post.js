const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required']
    },
    eventDate: {
    type: Date,
    required: true
},
    // Legacy single-media fields (kept for backward compat)
    mediaUrl: { type: String, default: '' },
    mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
    // New: array of media files
    media: [{
        url: { type: String, required: true },
        type: { type: String, enum: ['image', 'video'], required: true },
        fileId: { type: String, default: '' },
        filename: { type: String, default: '' },
        contentType: { type: String, default: '' },
        size: { type: Number, default: 0 }
    }],
    assignedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    archivedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: []
    }],
    isDeleted: {
        type: Boolean,
        default: false
    },
    viewedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: []
    }],
    platforms: [{
        type: String,
        enum: ['Facebook', 'Instagram']
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: []
    }]
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
