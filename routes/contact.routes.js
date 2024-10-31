import express from 'express';
import { isAuthenticate } from '../middleware/verifyToken.js';
import { getWorkspaceContacts } from '../controllers/contact.controller.js';

const router = express.Router();

router.get('/workspace/:workspaceId', isAuthenticate, getWorkspaceContacts);

export default router;

