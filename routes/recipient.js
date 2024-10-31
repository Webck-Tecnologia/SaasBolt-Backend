import express from 'express';
import { 
    createRecipient, 
    getAllRecipients, 
    getRecipientById, 
    updateRecipient, 
    deleteRecipient 
} from '../controllers/recipient.controller.js';

const router = express.Router();

router.post('/', createRecipient);
router.get('/', getAllRecipients);
router.get('/:id', getRecipientById);
router.put('/:id', updateRecipient);
router.delete('/:id', deleteRecipient);

export default router;
