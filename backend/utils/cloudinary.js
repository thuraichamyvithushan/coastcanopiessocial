const { v2: cloudinary } = require('cloudinary');

const getCloudinaryConfig = () => ({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const isCloudinaryConfigured = () => {
    const config = getCloudinaryConfig();
    return Boolean(config.cloud_name && config.api_key && config.api_secret);
};

const configureCloudinary = () => {
    if (!isCloudinaryConfigured()) {
        throw new Error('Cloudinary is not configured');
    }

    cloudinary.config({
        secure: true,
        ...getCloudinaryConfig()
    });
};

const uploadBufferToCloudinary = ({ buffer, filename, contentType }) => new Promise((resolve, reject) => {
    configureCloudinary();

    const resourceType = contentType?.startsWith('video') ? 'video' : 'image';
    const folder = process.env.CLOUDINARY_FOLDER || 'coast-canopies-social';

    const uploadStream = cloudinary.uploader.upload_stream(
        {
            folder,
            resource_type: resourceType,
            use_filename: true,
            unique_filename: true,
            overwrite: false,
            filename_override: filename
        },
        (error, result) => {
            if (error) {
                reject(error);
                return;
            }

            resolve({
                url: result.secure_url,
                provider: 'cloudinary',
                publicId: result.public_id,
                resourceType
            });
        }
    );

    uploadStream.end(buffer);
});

module.exports = {
    isCloudinaryConfigured,
    uploadBufferToCloudinary
};
