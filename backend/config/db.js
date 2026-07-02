const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();
mongoose.set('bufferCommands', false);

let cachedDb = null;
let connectionPromise = null;

const connectDB = async () => {
    if (cachedDb && mongoose.connection.readyState === 1) {
        return cachedDb;
    }

    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is missing from environment variables');
    }

    if (connectionPromise) {
        return connectionPromise;
    }

    connectionPromise = mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000
    })
        .then((conn) => {
            console.log(`MongoDB Connected: ${conn.connection.host}`);
            cachedDb = conn;
            return conn;
        })
        .catch((error) => {
            console.error(`Database Connection Error: ${error.message}`);
            throw error;
        })
        .finally(() => {
            connectionPromise = null;
        });

    return connectionPromise;
};

module.exports = connectDB;
