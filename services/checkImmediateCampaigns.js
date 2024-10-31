import models from '../models/index.js';
const { Campaign } = models;
import { startCampaign } from './campaignService.js';

export const checkImmediateCampaigns = async () => {
    try {
        const campaigns = await Campaign.findAll({
            where: {
                status: 'PENDING',
                startImmediately: true
            }
        });

        for (const campaign of campaigns) {
            try {
                await startCampaign(campaign.id);
            } catch (error) {
                console.error(`Erro ao processar campanha ${campaign.id}:`, error);
            }
        }
    } catch (error) {
        console.error('Erro ao verificar campanhas imediatas:', error);
    }
};