import models from '../models/index.js';
import { getReceiverSocketId, io } from "../socket/socket.js";
import { messageQueue } from '../utils/MessageQueue.js';

const { Message, Conversation, User, UserWorkspace } = models;

export const getMessages = async (req, res) => {
    try {
        const { workspaceId, conversationId } = req.params;
        const userId = req.user.id;

        // Verificar se o usuário pertence ao workspace
        const userWorkspace = await UserWorkspace.findOne({ 
            where: { userId, workspaceId, isActive: true } 
        });
        if (!userWorkspace) {
            return res.status(403).json({ message: "Você não tem acesso a este workspace" });
        }

        // Verificar se o usuário pertence à conversa
        const conversation = await Conversation.findOne({
            where: { id: conversationId, workspaceId },
            include: [{ 
                model: User, 
                as: 'participants', 
                where: { id: userId },
                through: { attributes: [] }
            }]
        });
        if (!conversation) {
            return res.status(403).json({ message: "Você não tem acesso a esta conversa" });
        }

        // Buscar as mensagens
        const messages = await Message.findAll({
            where: { conversationId },
            include: [{ 
                model: User, 
                as: 'sender', 
                attributes: ['id', 'username', 'profilePicture'] 
            }],
            order: [['createdAt', 'ASC']]
        });

        // Atualizar lastAccessed no UserWorkspace
        await userWorkspace.update({ lastAccessed: new Date() });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar mensagens" });
    }
};

export const sendMessage = async (req, res, next) => {
    try {
        const { content, recipientId, workspaceId } = req.body;
        const senderId = req.user.id;

        // Validações...
        if (!content || !recipientId || !workspaceId) {
            return next(errorHandler(400, "Dados incompletos para envio da mensagem"));
        }

        // Função que realmente envia a mensagem
        const sendMessageFunction = async (messageData) => {
            const message = await Message.create({
                content: messageData.content,
                senderId: messageData.senderId,
                recipientId: messageData.recipientId,
                workspaceId: messageData.workspaceId
            });

            // Emitir evento via socket
            const io = req.app.get('io');
            const receiverSocketId = getReceiverSocketId(recipientId);
            
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("newMessage", message);
            }

            return message;
        };

        // Adicionar à fila de mensagens
        await messageQueue.add(
            { content, senderId, recipientId, workspaceId },
            sendMessageFunction
        );

        res.status(202).json({ 
            message: "Mensagem adicionada à fila de envio",
            status: "queued"
        });

    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        next(error);
    }
};

export const updateMessage = async (req, res) => {
    try {
        const { content } = req.body;
        const messageId = req.params.id;
        const userId = req.user.id;

        const message = await Message.findByPk(messageId);

        if (!message) {
            return res.status(404).json({ message: "Mensagem não encontrada" });
        }

        if (message.senderId !== userId) {
            return res.status(403).json({ message: "Você não tem permissão para editar esta mensagem" });
        }

        await message.update({ content });

        const updatedMessage = await Message.findOne({
            where: { id: messageId },
            include: [{ model: User, as: 'sender', attributes: ['id', 'username', 'profilePicture'] }]
        });

        // Emitir evento de mensagem atualizada via Socket.IO
        const conversation = await Conversation.findByPk(message.conversationId, {
            include: [{ model: User, as: 'participants' }]
        });

        conversation.participants.forEach(participant => {
            if (participant.id !== userId) {
                const receiverSocketId = getReceiverSocketId(participant.id);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("messageUpdated", updatedMessage);
                }
            }
        });

        res.json(updatedMessage);
    } catch (error) {
        res.status(500).json({ message: "Erro ao atualizar mensagem" });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const messageId = req.params.id;
        const userId = req.user.id;

        const message = await Message.findByPk(messageId);

        if (!message) {
            return res.status(404).json({ message: "Mensagem não encontrada" });
        }

        if (message.senderId !== userId) {
            return res.status(403).json({ message: "Você não tem permissão para excluir esta mensagem" });
        }

        const conversationId = message.conversationId;

        await message.destroy();

        // Emitir evento de mensagem excluída via Socket.IO
        const conversation = await Conversation.findByPk(conversationId, {
            include: [{ model: User, as: 'participants' }]
        });

        conversation.participants.forEach(participant => {
            if (participant.id !== userId) {
                const receiverSocketId = getReceiverSocketId(participant.id);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("messageDeleted", { messageId, conversationId });
                }
            }
        });

        res.status(200).json({ message: "Mensagem excluída com sucesso" });
    } catch (error) {
        res.status(500).json({ message: "Erro ao excluir mensagem" });
    }
};

// ... outras funções, se houver
