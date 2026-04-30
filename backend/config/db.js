const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

let cachedDb = null;

const connectDB = async () => {
    if (cachedDb) {
        return cachedDb;
    }

    if (!process.env.MONGO_URI) {
        console.error('MONGO_URI is missing from environment variables');
        return;
    }

    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        cachedDb = conn;
        return conn;
    } catch (error) {
        console.error(`Database Connection Error: ${error.message}`);
    }
};

module.exports = connectDB;
