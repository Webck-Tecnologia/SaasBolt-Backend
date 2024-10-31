import { Router } from 'express';
import { WhatsAppController } from '../controllers/whatsapp.controller.js';
import { isAuthenticate } from "../middleware/verifyToken.js"

const router = Router();
const whatsappController = new WhatsAppController();

router.post(
  '/verify-numbers',
  isAuthenticate,
  (req, res) => whatsappController.verifyNumbers(req, res)
);

export default router;