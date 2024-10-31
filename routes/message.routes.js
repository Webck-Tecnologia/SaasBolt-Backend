import express from "express"
import { isAuthenticate } from "../middleware/verifyToken.js"
import { getMessages, sendMessage, updateMessage, deleteMessage } from "../controllers/message.controller.js"

const router = express.Router()

router.get("/:id", isAuthenticate, getMessages);
router.post("/send/:id", isAuthenticate, sendMessage);
router.put("/:id", isAuthenticate, updateMessage);
router.delete("/:id", isAuthenticate, deleteMessage);
router.post('/workspace/:workspaceId/conversation/:conversationId', isAuthenticate, sendMessage);
router.get('/workspace/:workspaceId/conversation/:conversationId', isAuthenticate, getMessages);

export default router
