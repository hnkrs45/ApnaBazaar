import "dotenv/config";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { urlencoded } from "express";
import helmet from "helmet";
import http from "http";
import mongoose from "mongoose";
import { rateLimit } from "express-rate-limit";
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

// ──────────────────────────────────────────────────────────
// Allowed Origins — EXACT list only (no wildcards in prod)
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
  if (!origin) return true; // same-origin / server-to-server requests
  if (allowedOrigins.includes(origin)) return true;
  if (process.env.client_url && origin === process.env.client_url) return true;
  // In development allow any localhost port
  if (
    process.env.NODE_ENV !== "production" &&
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
  ) return true;
  return false;
};

// ──────────────────────────────────────────────────────────
// Security Headers (Helmet)
// ──────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // allow image CDN
    contentSecurityPolicy: false, // CSP handled separately if needed
  })
);

// ──────────────────────────────────────────────────────────
// CORS
// ──────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, origin || true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  })
);

// ──────────────────────────────────────────────────────────
// Rate Limiters
// ──────────────────────────────────────────────────────────
/** Strict limiter for auth endpoints (brute-force protection) */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts. Please try again in 15 minutes." },
});

/** Moderate limiter for AI search (cost + abuse protection) */
export const aiSearchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many search requests. Please slow down." },
});

/** General API limiter */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});

// Apply general limiter to all routes
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
      await connect(url);
    }
    next();
  } catch (err) {
    console.error("Database connection error:", err.message);
    res.status(503).json({
      success: false,
      message: "Service temporarily unavailable. Please try again.",
    });
  }
});

// ──────────────────────────────────────────────────────────
// Health Check
// ──────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ApnaBazaar API is running",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
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
  // Never leak internal error details to client in production
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "Internal server error";
  res.status(status).json({ success: false, message });
});

// ──────────────────────────────────────────────────────────
// Socket.io (works in local dev; stateless on Vercel — chat
// requires a persistent host like Railway for production)
// ──────────────────────────────────────────────────────────
export const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: (origin, callback) =>
      isAllowedOrigin(origin) ? callback(null, true) : callback(new Error("Not allowed")),
    methods: ["GET", "POST"],
    credentials: true,
  },
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

// Start listening only outside Vercel (local development)
if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    connect(url);
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
