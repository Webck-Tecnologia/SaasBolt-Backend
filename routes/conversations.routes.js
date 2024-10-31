import express from 'express';
import { 
    getConversations, 
    createConversation, 
    getConversationDetails,
    updateConversation,
    deleteConversation,
    getWorkspaceConversations
} from '../controllers/conversations.controller.js';
import { isAuthenticate } from '../middleware/verifyToken.js';

const router = express.Router();

router.get('/workspace/:workspaceId', isAuthenticate, getWorkspaceConversations);
router.get('/', isAuthenticate, getConversations);
router.post('/', isAuthenticate, createConversation);
router.get('/:id', isAuthenticate, getConversationDetails);
router.put('/:id', isAuthenticate, updateConversation);
router.delete('/:id', isAuthenticate, deleteConversation);

export default router;
