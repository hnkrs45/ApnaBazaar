import mongoose from "mongoose";

let isConnecting = null;

export const connect = async (url) => {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }
    if (isConnecting) {
        return isConnecting;
    }
    try {
        isConnecting = mongoose.connect(url, {
            serverSelectionTimeoutMS: 8000,
        });
        await isConnecting;
        isConnecting = null;
        console.log("MongoDB connected successfully");
        return mongoose.connection;
    } catch (error) {
        isConnecting = null;
        console.error("Mongoose connect Error:", error.message);
        throw error;
    }
};
