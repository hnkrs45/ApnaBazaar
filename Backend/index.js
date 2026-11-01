import "dotenv/config";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { urlencoded } from "express";
import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import { connect } from "./connection/connection.js";
import { generalLimiter } from "./middleware/rateLimiter.js";
import admin from "./routes/admin.js";
import message from "./routes/message.js";
import order from "./routes/order.js";
import product from "./routes/product.js";
import user from "./routes/user.js";
import vendor from "./routes/vendor.js";

export const app = express();
const PORT = process.env.PORT || 3000;
const url = process.env.MONGO_URL || "mongodb://localhost:27017/E-Commerce";

// ──────────────────────────────────────────────────────────
// Allowed Origins — EXACT list only (no wildcard origins in prod)
// ──────────────────────────────────────────────────────────
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

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const cleanOrigin = origin.replace(/\/$/, "");
  if (allowedOrigins.includes(cleanOrigin)) return true;
  if (process.env.client_url && cleanOrigin === process.env.client_url.replace(/\/$/, "")) return true;
  if (/^https:\/\/apna-bazaar.*\.vercel\.app$/.test(cleanOrigin)) return true;
  if (/^https:\/\/.*apna-bazaar.*\.vercel\.app$/.test(cleanOrigin)) return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin)) return true;
  return false;
};

// ──────────────────────────────────────────────────────────
// Security Headers Middleware (Zero-dependency replacement for Helmet)
// ──────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "0");
  res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.removeHeader("X-Powered-By");
  next();
});

// ──────────────────────────────────────────────────────────
// CORS
// ──────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, origin || true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    exposedHeaders: ["Set-Cookie"]
  })
);


// Apply general API rate limiter
app.use(generalLimiter);

// ──────────────────────────────────────────────────────────
// Body Parsers
// ──────────────────────────────────────────────────────────
app.use(urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: "5mb" }));
app.use(cookieParser());

// ──────────────────────────────────────────────────────────
// Per-request DB connection (serverless-safe)
// ──────────────────────────────────────────────────────────
app.use(async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      if (!process.env.MONGO_URL) {
        return res.status(500).json({
          success: false,
          message: "Database configuration error: MONGO_URL is not set in Vercel environment variables."
        });
      }
      await connect(url);
    }
    next();
  } catch (err) {
    console.error("Database connection error:", err.message);
    res.status(503).json({
      success: false,
      message: "Database connection failed. Please ensure MongoDB Atlas allows access from all IPs (0.0.0.0/0)."
    });
  }
});

// ──────────────────────────────────────────────────────────
// Root Health Check Route
// ──────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ApnaBazaar API is running",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

// ──────────────────────────────────────────────────────────
// API Routes
// ──────────────────────────────────────────────────────────
app.use("/api/user", user);
app.use("/api/product", product);
app.use("/api/order", order);
app.use("/api/admin", admin);
app.use("/api/vendor", vendor);
app.use("/api/message", message);

// ──────────────────────────────────────────────────────────
// Global Error Handler
// ──────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  const status = err.status || err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "Internal server error";
  res.status(status).json({ success: false, message });
});

// ──────────────────────────────────────────────────────────
// Socket.io & Local Server Setup
// ──────────────────────────────────────────────────────────
export const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: (origin, callback) =>
      isAllowedOrigin(origin) ? callback(null, true) : callback(new Error("Not allowed")),
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
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
