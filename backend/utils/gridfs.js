const mongoose = require('mongoose');
const { GridFSBucket, ObjectId } = require('mongodb');

const getMediaBucket = () => {
    if (!mongoose.connection?.db) {
        throw new Error('Database connection is unavailable');
    }

    return new GridFSBucket(mongoose.connection.db, { bucketName: 'media' });
};

const uploadBufferToGridFS = ({ buffer, filename, contentType }) => new Promise((resolve, reject) => {
    const bucket = getMediaBucket();
    const uploadStream = bucket.openUploadStream(filename, {
        contentType
    });

    uploadStream.on('error', reject);
    uploadStream.on('finish', () => {
        resolve({
            fileId: uploadStream.id.toString(),
            filename: uploadStream.filename
        });
    });

    uploadStream.end(buffer);
});

const getGridFSFileInfo = async (fileId) => {
    const bucket = getMediaBucket();
    const objectId = new ObjectId(fileId);
    const files = await bucket.find({ _id: objectId }).toArray();
    return files[0] || null;
};

const openGridFSDownloadStream = (fileId, options = {}) => {
    const bucket = getMediaBucket();
    return bucket.openDownloadStream(new ObjectId(fileId), options);
};

module.exports = {
    getGridFSFileInfo,
    openGridFSDownloadStream,
    uploadBufferToGridFS
};
