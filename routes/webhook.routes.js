import express from 'express';
import { handleWebhook } from '../controllers/webhook.controller.js';

const router = express.Router();

router.post('/instance-events', handleWebhook);

export default router;
