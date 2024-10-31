import multer from 'multer';
import models from "../models/index.js";
import { v4 as uuidv4 } from "uuid";
import minioClient from "../config/minio.js";
import { startCampaign } from "../services/campaignService.js";
import { io } from "../socket/socket.js";
import { getMediaBase64 } from '../utils/getMediaBase64.js';
import axios from "axios";

const { Campaign, MessageHistory } = models;
const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || "campaigns";

// Configuração do Multer
const upload = multer({
    storage: multer.memoryStorage()
}).fields([
    { name: 'csv', maxCount: 1 },
    { name: 'media', maxCount: 1 }
]);

// Wrapper para usar multer com async/await
const handleUpload = (req, res) => {
    return new Promise((resolve, reject) => {
        upload(req, res, (err) => {
            if (err) {
                console.error('Erro no upload:', err);
                reject(err);
            }
            resolve();
        });
    });
};

export const createCampaign = async (req, res) => {
    try {
        const workspaceId = req.params.workspaceId;
        
        // Debug logs
        console.log('Files recebidos:', req.files);
        console.log('Body recebido:', req.body);
        
        // Processa o upload primeiro
        await handleUpload(req, res);
        
        if (!req.files || !req.files.csv) {
            throw new Error("Arquivo CSV é obrigatório");
        }

        const { csv, media } = req.files;

        // Processa o CSV
        const csvFileName = `${workspaceId}/csv/${uuidv4()}-${csv[0].originalname}`;
        await minioClient.putObject(
            BUCKET_NAME,
            csvFileName,
            csv[0].buffer,
            csv[0].size,
            csv[0].mimetype
        );

        // Processa a mídia se existir
        let mediaBase64 = null;
        let mediaType = null;
        let mediaFileName = null;
        let mediaMediaType = null;

        // Verifica se existe mídia e se tem pelo menos um arquivo
        if (media && media[0]) {
            const mediaFile = media[0];
            
            // Verifica se o arquivo tem nome
            if (!mediaFile.originalname) {
                console.error('Arquivo de mídia sem nome:', mediaFile);
                throw new Error('Arquivo de mídia inválido');
            }

            mediaFileName = `${workspaceId}/media/${uuidv4()}-${mediaFile.originalname}`;

            // Determina o tipo de mídia baseado na extensão
            const extension = mediaFile.originalname.toLowerCase().split('.').pop();
            console.log('Extensão do arquivo:', extension);
            
            const isDocument = ['pdf', 'doc', 'docx'].includes(extension);
            mediaMediaType = isDocument ? "document" : "image";

            await minioClient.putObject(
                BUCKET_NAME,
                mediaFileName,
                mediaFile.buffer,
                mediaFile.size,
                mediaFile.mimetype
            );

            // Converte para base64
            const base64 = await getMediaBase64(BUCKET_NAME, mediaFileName);
            mediaBase64 = base64;
            mediaType = mediaFile.mimetype;
            mediaFileName = mediaFile.originalname;

            console.log(`\x1b[34m[Debug]\x1b[0m ${mediaMediaType.toUpperCase()} convertido para base64`);
        }

        // Processa as mensagens
        let messages = JSON.parse(req.body.messages);
        if (mediaBase64) {
            messages = messages.map(msg => ({
                ...msg,
                mediaUrl: mediaBase64,
                mimetype: mediaType,
                fileName: mediaFileName,
                mediatype: mediaMediaType
            }));
        }

        const campaignData = {
            ...req.body,
            workspaceId: parseInt(workspaceId),
            startImmediately: req.body.startImmediately === "true",
            messageInterval: parseInt(req.body.messageInterval),
            instanceIds: JSON.parse(req.body.instanceIds),
            messages,
            csvFileUrl: `${BUCKET_NAME}/${csvFileName}`,
            status: 'PENDING',
            isActive: true
        };

        const campaign = await Campaign.create(campaignData);
        
        console.log(`\x1b[34m[Debug]\x1b[0m Campanha criada com sucesso ${mediaMediaType ? `(com ${mediaMediaType})` : ''}`);
        
        io.to(`workspace_${workspaceId}`).emit("campaignCreated", campaign);
        
        res.status(201).json(campaign);

    } catch (error) {
        console.error('Erro ao criar campanha:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getCampaigns = async (req, res) => {
    try {
        const workspaceId = req.params.workspaceId;

        const campaigns = await Campaign.findAll({
            where: {
                workspaceId: workspaceId,
                isActive: true
            },
            order: [["createdAt", "DESC"]],
        });

        return res.status(200).json(campaigns || []);
    } catch (error) {
        console.error("Erro ao buscar campanhas:", error);
        return res.status(500).json({
            message: "Erro ao buscar campanhas",
            error: error.message,
        });
    }
};

export const getCampaignById = async (req, res) => {
    try {
        const campaign = await Campaign.findOne({
            where: {
                id: req.params.id,
                isActive: true
            }
        });

        if (campaign) {
            res.status(200).json(campaign);
        } else {
            res.status(404).json({ message: "Campanha não encontrada" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const campaign = await Campaign.findOne({
            where: {
                id: id,
                isActive: true
            }
        });

        if (!campaign) {
            return res.status(404).json({ message: "Campanha não encontrada" });
        }

        await campaign.update(req.body);

        io.to(`workspace_${campaign.workspaceId}`).emit(
            "campaignUpdated",
            campaign
        );

        res.json(campaign);
    } catch (error) {
        console.error("Erro ao atualizar campanha:", error);
        res.status(500).json({ error: error.message });
    }
};

export const deleteCampaign = async (req, res) => {
    try {
        const { workspaceId, campaignId } = req.params;

        const campaign = await Campaign.findOne({
            where: {
                id: campaignId,
                workspaceId: workspaceId,
                isActive: true
            },
        });

        if (!campaign) {
            return res.status(404).json({ message: "Campanha não encontrada" });
        }

        await campaign.update({ isActive: false });

        io.to(`workspace_${workspaceId}`).emit('campaignDeleted', {
            campaignId,
            workspaceId
        });

        res.status(200).json({ message: "Campanha deletada com sucesso" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getCampaignStats = async (req, res) => {
    try {
        const workspaceId = req.params.workspaceId;

        // Busca todas as campanhas do workspace com o alias correto
        const campaigns = await Campaign.findAll({
            where: {
                workspaceId: workspaceId,
                isActive: true
            },
            attributes: [
                'id',
                'messages'
            ],
            include: [{
                model: MessageHistory,
                as: 'MessageHistories', // Usando o alias definido no modelo
                attributes: ['status']
            }]
        });

        // Inicializa as estatísticas
        const stats = {
            totalCampaigns: campaigns.length,
            totalMessages: 0,
            deliveredMessages: 0,
            failedMessages: 0,
            successRate: 0
        };

        // Calcula as estatísticas usando MessageHistory
        campaigns.forEach(campaign => {
            // Conta mensagens enviadas e com erro
            campaign.MessageHistories?.forEach(history => {
                stats.totalMessages++;
                if (history.status === 'SENT') {
                    stats.deliveredMessages++;
                } else if (history.status === 'ERROR') {
                    stats.failedMessages++;
                }
            });
        });

        // Calcula a taxa de sucesso
        stats.successRate = stats.totalMessages > 0
            ? ((stats.deliveredMessages / stats.totalMessages) * 100).toFixed(2)
            : 0;

        res.status(200).json({
            workspaceId,
            stats: {
                totalCampaigns: stats.totalCampaigns,
                messageStats: {
                    total: stats.totalMessages,
                    delivered: stats.deliveredMessages,
                    failed: stats.failedMessages,
                    successRate: `${stats.successRate}%`
                }
            }
        });

    } catch (error) {
        console.error('Erro ao buscar estatísticas das campanhas:', error);
        res.status(500).json({ 
            error: 'Erro ao buscar estatísticas das campanhas',
            details: error.message 
        });
    }
};
