import models from '../models/index.js';

const { MessageCampaign, Campaign } = models;

export const createMessageCampaign = async (req, res) => {
    try {
        const { content, order, campaignId } = req.body;
        const messageCampaign = await MessageCampaign.create({
            content,
            order,
            campaignId
        });
        res.status(201).json(messageCampaign);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getAllMessageCampaigns = async (req, res) => {
    try {
        const messageCampaigns = await MessageCampaign.findAll({
            include: [Campaign]
        });
        res.status(200).json(messageCampaigns);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getMessageCampaignById = async (req, res) => {
    try {
        const messageCampaign = await MessageCampaign.findByPk(req.params.id, {
            include: [Campaign]
        });
        if (messageCampaign) {
            res.status(200).json(messageCampaign);
        } else {
            res.status(404).json({ message: 'Mensagem de campanha não encontrada' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateMessageCampaign = async (req, res) => {
    try {
        const messageCampaign = await MessageCampaign.findByPk(req.params.id);
        if (messageCampaign) {
            await messageCampaign.update(req.body);
            res.status(200).json(messageCampaign);
        } else {
            res.status(404).json({ message: 'Mensagem de campanha não encontrada' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteMessageCampaign = async (req, res) => {
    try {
        const messageCampaign = await MessageCampaign.findByPk(req.params.id);
        if (messageCampaign) {
            await messageCampaign.destroy();
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Mensagem de campanha não encontrada' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
