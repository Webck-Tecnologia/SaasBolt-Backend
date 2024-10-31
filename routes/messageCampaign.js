import express from 'express';
import { 
    createMessageCampaign, 
    getAllMessageCampaigns, 
    getMessageCampaignById, 
    updateMessageCampaign, 
    deleteMessageCampaign 
} from '../controllers/messageCampaign.controller.js';

const router = express.Router();

router.post('/', createMessageCampaign);
router.get('/', getAllMessageCampaigns);
router.get('/:id', getMessageCampaignById);
router.put('/:id', updateMessageCampaign);
router.delete('/:id', deleteMessageCampaign);

export default router;
