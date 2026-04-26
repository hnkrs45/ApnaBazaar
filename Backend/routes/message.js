import express from "express";
import { getMessages, sendMessage } from "../controller/message.js";
import { auth } from "../services/auth.js";

const router = express.Router();

router.get("/:id", auth, getMessages);
router.post("/send/:id", auth, sendMessage);

export default router;
