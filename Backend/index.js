import bodyParser from "body-parser"
import cookieParser from "cookie-parser"
import cors from "cors"
import dotenv from "dotenv"
import express, { urlencoded } from "express"
import { connect } from "./connection/connection.js"
import admin from "./routes/admin.js"
import order from "./routes/order.js"
import product from "./routes/product.js"
import user from "./routes/user.js"
import vendor from "./routes/vendor.js"

// Socket setup
import http from "http"
import { Server } from "socket.io"

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 3000;

export const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: ["https://apnabzaar.netlify.app", "https://apnabazaaradmin.netlify.app", "http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"]
  }
});

const userSocketMap = {}; 
export const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

io.on("connection", (socket) => {
  console.log("User connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;
  }

  // Socket setup specific code
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

app.use(urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser())

app.use(cors({
    origin: ["https://apnabzaar.netlify.app", "https://apnabazaaradmin.netlify.app", "http://localhost:5173", "http://localhost:5174"],
    credentials: true
}));

const url = process.env.MONGO_URL || "mongodb://localhost:27017/E-Commerce"

import message from "./routes/message.js"

app.use('/api/user',user);
app.use('/api/product', product);
app.use('/api/order', order);
app.use('/api/admin', admin);
app.use('/api/vendor', vendor);
app.use('/api/message', message);

server.listen(PORT, () => {
    connect(url)
    console.log(`Server run on port ${PORT}`);
})
