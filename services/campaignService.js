import models from '../models/index.js';
import { io } from '../socket/socket.js';    
const { Campaign, MessageHistory } = models;
import { getCsvContent } from '../utils/getCsvContent.js';
import { sendWhatsAppMessage } from './sendWhatsAppMessage.js';
import { checkImmediateCampaigns } from './checkImmediateCampaigns.js';
import { processCsvContent } from '../controllers/processCsvContent.js';
import { Op } from 'sequelize';

// Função auxiliar para esperar
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Função para iniciar a campanha
const startCampaign = async (campaignId) => {
    try {
        // Busca a campanha
        const campaign = await Campaign.findByPk(campaignId);
        if (!campaign) throw new Error('Campanha não encontrada');

        // Processa as mensagens primeiro
        const messages = Array.isArray(campaign.messages) 
            ? campaign.messages 
            : JSON.parse(campaign.messages);

        // Busca e processa o CSV
        const csvContent = await getCsvContent(campaign.csvFileUrl);
        const contacts = await processCsvContent(csvContent);
        
        // Calcula o total de mensagens ANTES de emitir o evento
        const totalMessages = contacts.length * messages.length;

        console.log('\x1b[34m%s\x1b[0m', `[SOCKET EMIT] campaignStarted:`, {
            campaignId: campaign.id,
            name: campaign.name,
            workspaceId: campaign.workspaceId,
            totalMessages,
            totalContacts: contacts.length,
            messageCount: messages.length,
            messageInterval: campaign.messageInterval
        });
        
        // Emite o evento com o intervalo incluído
        io.to(`workspace_${campaign.workspaceId}`).emit('campaignStarted', {
            campaignId: campaign.id,
            name: campaign.name,
            workspaceId: campaign.workspaceId,
            startTime: new Date(),
            totalMessages,
            totalContacts: contacts.length,
            messageCount: messages.length,
            messageInterval: campaign.messageInterval
        });

        // Atualiza status para PROCESSING
        await campaign.update({ status: 'PROCESSING' });
        
        let successCount = 0;
        let failureCount = 0;
        let startTime = Date.now();

        // Durante o processamento
        for (const contact of contacts) {
            for (const messageObj of messages) {
                let processedMessage = messageObj.content; // Inicializa com o conteúdo original
                
                try {
                    // Processa a mensagem substituindo variáveis
                    processedMessage = processMessageVariables(messageObj.content, contact);
                    
                    await sendWhatsAppMessage(
                        campaign.workspaceId,
                        campaign.instanceIds[0],
                        contact,
                        [messageObj]
                    );

                    // Registrar envio bem-sucedido
                    await MessageHistory.create({
                        campaignId: campaign.id,
                        contact: contact.phone,
                        message: processedMessage,
                        status: 'SENT',
                        sentAt: new Date(),
                        metadata: {
                            contactName: contact.name,
                            messageType: 'text',
                            variables: contact
                        }
                    });

                    successCount++;
                    
                    console.log('\x1b[32m%s\x1b[0m', `[SOCKET EMIT] messageSent:`, {
                        campaignId: campaign.id,
                        contact: contact.phone,
                        status: 'SENT'
                    });
                    
                    io.to(`workspace_${campaign.workspaceId}`).emit('messageSent', {
                        campaignId: campaign.id,
                        contact: contact.phone,
                        message: processedMessage,
                        sentAt: new Date(),
                        status: 'SENT'
                    });

                    // Aguarda o intervalo configurado antes da próxima mensagem
                    if (contacts.indexOf(contact) < contacts.length - 1 || messages.indexOf(messageObj) < messages.length - 1) {
                        console.log(`\x1b[36m[Campanha ${campaign.id}]\x1b[0m Aguardando ${campaign.messageInterval} segundos antes da próxima mensagem...`);
                        
                        // Contagem regressiva
                        for (let second = campaign.messageInterval; second > 0; second--) {
                            process.stdout.write(`\r\x1b[33m[Campanha ${campaign.id}]\x1b[0m Tempo restante: ${second} segundos...`);
                            await wait(1000);
                        }
                    }
                } catch (error) {
                    // Registrar falha no envio
                    await MessageHistory.create({
                        campaignId: campaign.id,
                        contact: contact.phone,
                        message: processedMessage, // Usa a mensagem processada ou original
                        status: 'ERROR',
                        error: error.message,
                        sentAt: new Date(),
                        metadata: {
                            contactName: contact.name,
                            messageType: 'text',
                            variables: contact,
                            errorDetails: error.stack
                        }
                    });

                    failureCount++;
                    
                    console.log('\x1b[31m%s\x1b[0m', `[SOCKET EMIT] messageError:`, {
                        campaignId: campaign.id,
                        contact: contact.phone,
                        error: error.message
                    });
                    
                    io.to(`workspace_${campaign.workspaceId}`).emit('messageError', {
                        campaignId: campaign.id,
                        contact: contact.phone,
                        message: processedMessage,
                        error: error.message,
                        sentAt: new Date()
                    });
                }

                // Log e emissão do progresso
                emitProgress(campaign, successCount, failureCount, totalMessages);
            }
        }

        // Log e emissão da conclusão
        console.log('\x1b[34m%s\x1b[0m', `[SOCKET EMIT] campaignCompleted:`, {
            campaignId: campaign.id,
            status: 'COMPLETED',
            stats: { totalMessages, successCount, failureCount }
        });
        io.to(`workspace_${campaign.workspaceId}`).emit('campaignCompleted', {
            campaignId: campaign.id,
            status: 'COMPLETED',
            stats: {
                totalMessages,
                successCount,
                failureCount,
                completedAt: new Date()
            }
        });

        // Ao finalizar com sucesso
        await campaign.update({ 
            status: 'COMPLETED',
            successCount,
            failureCount,
            lastProcessedAt: new Date()
        });
        console.log('\x1b[35m%s\x1b[0m', `[SOCKET EMIT] campaignStatusChanged:`, {
            campaignId: campaign.id,
            previousStatus: 'PROCESSING',
            newStatus: 'COMPLETED'
        });
        io.to(`workspace_${campaign.workspaceId}`).emit('campaignStatusChanged', {
            campaignId: campaign.id,
            previousStatus: 'PROCESSING',
            newStatus: 'COMPLETED',
            timestamp: new Date(),
            stats: {
                successCount,
                failureCount,
                totalMessages
            }
        });

    } catch (error) {
        console.error('Erro ao iniciar campanha:', error);
        throw error;
    }
};

// Função auxiliar para emitir progresso
const emitProgress = (campaign, successCount, failureCount, totalMessages) => {
    const totalProcessed = successCount + failureCount;
    const percentage = (totalProcessed / totalMessages) * 100;
    
    // Log do progresso
    console.log('\x1b[36m%s\x1b[0m', `[SOCKET EMIT] campaignProgress:`, {
        campaignId: campaign.id,
        progress: `${percentage.toFixed(2)}%`,
        stats: { sent: successCount, failed: failureCount }
    });
    
    io.to(`workspace_${campaign.workspaceId}`).emit('campaignProgress', {
        campaignId: campaign.id,
        status: campaign.status,
        progress: {
            percentage: Math.min(percentage, 100),
            currentCount: totalProcessed,
            totalMessages
        },
        stats: {
            sent: successCount,
            failed: failureCount
        }
    });
};

// Verificação periódica com debounce simples
let timeoutId = null;
const debouncedCheck = () => {
    if (timeoutId) {
        clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(checkImmediateCampaigns, 5000);
};

// Função para verificar campanhas agendadas
const checkScheduledCampaigns = async () => {
    try {
        const now = new Date();
        
        // Busca campanhas agendadas que já passaram do horário e ainda não foram iniciadas
        const scheduledCampaigns = await Campaign.findAll({
            where: {
                status: 'PENDING',
                startImmediately: false,
                scheduledTo: {
                    [Op.lte]: now // Menor ou igual ao horário atual
                },
                isActive: true
            }
        });

        console.log(`\x1b[34m[Campanhas Agendadas]\x1b[0m Verificando... Encontradas: ${scheduledCampaigns.length}`);

        for (const campaign of scheduledCampaigns) {
            console.log(`\x1b[34m[Campanha ${campaign.id}]\x1b[0m Iniciando campanha agendada para ${campaign.scheduledTo}`);
            startCampaign(campaign.id).catch(error => {
                console.error(`\x1b[31m[Campanha ${campaign.id}]\x1b[0m Erro ao iniciar campanha agendada:`, error);
            });
        }
    } catch (error) {
        console.error('\x1b[31m[Campanhas Agendadas]\x1b[0m Erro ao verificar campanhas:', error);
    }
};

// Verificação periódica de campanhas agendadas (a cada 1 minuto)
setInterval(checkScheduledCampaigns, 60 * 1000);

// Executa uma verificação inicial ao iniciar o servidor
checkScheduledCampaigns();

// Verificação de campanhas imediatas (já existente)
setInterval(async () => {
    try {
        const hasPending = await Campaign.count({
            where: {
                status: 'PENDING',
                startImmediately: true,
                isActive: true
            }
        });

        if (hasPending > 0) {
            debouncedCheck();
        }
    } catch (error) {
        console.error('Erro ao verificar campanhas pendentes:', error);
    }
}, 5000);


/**
 * Updates campaign status
 * @param {string} campaignId - Campaign ID
 * @param {string} status - New status
 * @param {Error} error - Error object (optional)
 */

const updateCampaignStatus = async (campaignId, status, error = null) => {
    try {
        const campaign = await Campaign.findByPk(campaignId);
        if (campaign) {
            await campaign.update({ 
                status,
                error: error?.message || null 
            });
            
            io.to(`workspace_${campaign.workspaceId}`).emit('campaignStatusUpdated', {
                campaignId,
                status,
                error: error?.message || null
            });
        }
    } catch (error) {
        console.error('Error updating campaign status:', error);
    }
};

const emitCampaignStatusChange = (campaign, newStatus) => {
    io.to(`workspace_${campaign.workspaceId}`).emit('campaignStatusChanged', {
        campaignId: campaign.id,
        previousStatus: campaign.status,
        newStatus: newStatus,
        timestamp: new Date(),
        stats: {
            successCount: campaign.successCount,
            failureCount: campaign.failureCount
        }
    });
};

// Função auxiliar para processar variáveis na mensagem
const processMessageVariables = (message, contact) => {
    let processedMessage = message;
    
    // Substitui variáveis básicas
    processedMessage = processedMessage
        .replace(/\{nome\}/g, contact.name || '')
        .replace(/\{telefone\}/g, contact.phone || '');
    
    // Se houver outras variáveis no metadata do contato
    if (contact.variables) {
        Object.entries(contact.variables).forEach(([key, value]) => {
            processedMessage = processedMessage.replace(
                new RegExp(`\\{${key}\\}`, 'g'), 
                value || ''
            );
        });
    }
    
    return processedMessage;
};

export {
    startCampaign,
    checkImmediateCampaigns,
    debouncedCheck,
    updateCampaignStatus,
    emitCampaignStatusChange
};