import models from '../models/index.js';
const { MessageHistory, Campaign } = models;
import { Op } from 'sequelize';

export const getMessageHistory = async (req, res) => {
    try {
        const { workspaceId, campaignId } = req.params;

        if (!workspaceId) {
            return res.status(400).json({ error: 'workspaceId é obrigatório' });
        }

        // Construir where base
        const where = {};
        
        if (campaignId) {
            // Verifica se a campanha pertence ao workspace
            const campaign = await Campaign.findOne({
                where: {
                    id: campaignId,
                    workspaceId: workspaceId
                }
            });

            if (!campaign) {
                return res.status(404).json({ 
                    error: 'Campanha não encontrada neste workspace',
                    workspaceId,
                    campaignId
                });
            }

            where.campaignId = campaignId;
        } else {
            // Se não tiver campaignId, busca todas as campanhas do workspace
            const campaignIds = await Campaign.findAll({
                where: { workspaceId: workspaceId },
                attributes: ['id']
            }).then(campaigns => campaigns.map(c => c.id));

            if (campaignIds.length === 0) {
                return res.status(404).json({ 
                    error: 'Nenhuma campanha encontrada neste workspace',
                    workspaceId 
                });
            }

            where.campaignId = { [Op.in]: campaignIds };
        }

        // Adiciona outros filtros da query
        const { 
            status,
            startDate,
            endDate,
            contact,
            page = 1,
            limit = 50
        } = req.query;

        if (status) where.status = status;
        if (contact) where.contact = { [Op.iLike]: `%${contact}%` };
        if (startDate || endDate) {
            where.sentAt = {};
            if (startDate) where.sentAt[Op.gte] = new Date(startDate);
            if (endDate) where.sentAt[Op.lte] = new Date(endDate);
        }

        console.log('\x1b[36m%s\x1b[0m', '[MessageHistory] Buscando com filtros:', {
            workspaceId,
            campaignId,
            where,
            page,
            limit
        });

        const history = await MessageHistory.findAndCountAll({
            where,
            order: [['sentAt', 'DESC']],
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit),
            include: [{
                model: Campaign,
                as: 'campaign',
                attributes: ['name', 'workspaceId'],
                where: { workspaceId: workspaceId }
            }]
        });

        console.log('\x1b[32m%s\x1b[0m', '[MessageHistory] Resultados encontrados:', {
            total: history.count,
            pages: Math.ceil(history.count / limit)
        });

        res.json({
            total: history.count,
            pages: Math.ceil(history.count / limit),
            currentPage: parseInt(page),
            filters: {
                workspaceId,
                campaignId,
                status,
                startDate,
                endDate,
                contact
            },
            data: history.rows
        });

    } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', '[MessageHistory] Erro:', error);
        res.status(500).json({ error: error.message });
    }
}; 