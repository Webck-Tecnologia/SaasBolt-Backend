import express from 'express';
import { getMessageHistory } from '../controllers/messageHistory.controller.js';
import { isAuthenticate } from "../middleware/verifyToken.js"

const router = express.Router();

// Rota com parâmetros obrigatórios
router.get('/:workspaceId/:campaignId', isAuthenticate, getMessageHistory);

// Rota opcional para todas as campanhas de um workspace
router.get('/:workspaceId', isAuthenticate, getMessageHistory);

export default router; 