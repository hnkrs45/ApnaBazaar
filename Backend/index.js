import "dotenv/config";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { urlencoded } from "express";
import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import { connect } from "./connection/connection.js";
import admin from "./routes/admin.js";
import message from "./routes/message.js";
import order from "./routes/order.js";
import product from "./routes/product.js";
import user from "./routes/user.js";
import vendor from "./routes/vendor.js";

export const app = express();
const PORT = process.env.PORT || 3000;
const url = process.env.MONGO_URL || "mongodb://localhost:27017/E-Commerce";

// Allowed Origins for CORS
const allowedOrigins = [
  "https://apna-bazaar-o811.vercel.app",
  "https://apna-bazaar-xi.vercel.app",
  "https://apnabzaar.netlify.app",
  "https://apnabazaaradmin.netlify.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174"
];

// Dynamic CORS origin checker
const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (process.env.client_url && origin === process.env.client_url) return true;
  if (/\.vercel\.app$/.test(origin)) return true;
  if (/\.netlify\.app$/.test(origin)) return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return false;
};

// 1. CORS Middleware applied before all routes
app.use(cors({
  origin: (origin, callback) => {
    // Reflect origin if allowed or allow default
    if (isAllowedOrigin(origin)) {
      callback(null, origin || true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
}));

// Parsers
app.use(urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// Database connection middleware for Serverless & Long-running instances
app.use(async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connect(url);
    }
    next();
  } catch (err) {
    console.error("Database connection error:", err.message);
    res.status(500).json({
      success: false,
      message: "Database connection failed. Ensure MONGO_URL is properly configured in environment variables."
    });
  }
});

// Root Health Check Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ApnaBazaar API is running",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

// API Routes
app.use('/api/user', user);
app.use('/api/product', product);
app.use('/api/order', order);
app.use('/api/admin', admin);
app.use('/api/vendor', vendor);
app.use('/api/message', message);

// Global Error Handler returning JSON with CORS headers preserved
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal server error"
  });
});

// Socket.io & Local Server Setup
export const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
    methods: ["GET", "POST"],
    credentials: true
  }
});

const userSocketMap = {};
export const getReceiverSocketId = (receiverId) => userSocketMap[receiverId];

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;
  }
  io.emit("getOnlineUsers", Object.keys(userSocketMap));
  socket.on("disconnect", () => {
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// Start listening only in non-serverless environments (local development)
if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    connect(url);
    console.log(`Server run on port ${PORT}`);
  });
}

// CRITICAL FOR VERCEL SERVERLESS: Export default app
export default app;
