import models from '../models/index.js';
const { Conversation, User, Workspace, Message } = models;

export const getConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        const workspaceId = req.user.activeWorkspaceId;

        if (!workspaceId) {
            return res.status(400).json({ message: "Usuário não tem um workspace ativo" });
        }

        const conversations = await Conversation.findAll({
            where: { workspaceId },
            include: [
                {
                    model: User,
                    as: 'participants',
                    through: { attributes: [] },
                    where: { id: userId },
                    required: true
                },
                {
                    model: Message,
                    as: 'messages',
                    limit: 1,
                    order: [['createdAt', 'DESC']],
                    include: [{ model: User, as: 'sender', attributes: ['id', 'username'] }]
                }
            ],
            order: [[{ model: Message, as: 'messages' }, 'createdAt', 'DESC']]
        });

        res.json(conversations);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar conversas" });
    }
};

export const createConversation = async (req, res) => {
    try {
        const { participantIds, workspaceId, name, groupProfilePhoto } = req.body;
        const userId = req.user.id;

        if (!participantIds.includes(userId)) {
            participantIds.push(userId);
        }

        const isGroup = participantIds.length > 2;
        const conversation = await Conversation.create({ 
            workspaceId, 
            name, 
            isGroup,
            groupProfilePhoto: isGroup ? groupProfilePhoto : null
        });
        await conversation.addUsers(participantIds);

        const createdConversation = await Conversation.findByPk(conversation.id, {
            include: [
                {
                    model: User,
                    as: 'participants',
                    attributes: ['id', 'username', 'profilePicture'],
                    through: { attributes: [] }
                }
            ]
        });

        res.status(201).json(createdConversation);
    } catch (error) {
        res.status(400).json({ message: "Erro ao criar conversa", error: error.message });
    }
};

export const getConversationDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const conversation = await Conversation.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'participants',
                    attributes: ['id', 'username', 'profilePicture'],
                    through: { attributes: [] }
                },
                {
                    model: Message,
                    as: 'messages',
                    include: [{ model: User, as: 'sender', attributes: ['id', 'username', 'profilePicture'] }],
                    order: [['createdAt', 'ASC']]
                }
            ]
        });

        if (!conversation) {
            return res.status(404).json({ message: "Conversa não encontrada" });
        }

        if (!conversation.participants.some(participant => participant.id === userId)) {
            return res.status(403).json({ message: "Você não tem permissão para acessar esta conversa" });
        }

        res.json(conversation);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar detalhes da conversa" });
    }
};

export const updateConversation = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, participantIds, groupProfilePhoto } = req.body;
        const userId = req.user.id;

        const conversation = await Conversation.findByPk(id);

        if (!conversation) {
            return res.status(404).json({ message: "Conversa não encontrada" });
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (groupProfilePhoto && conversation.isGroup) updateData.groupProfilePhoto = groupProfilePhoto;

        await conversation.update(updateData);

        if (participantIds) {
            const currentParticipants = await conversation.getUsers();
            const currentParticipantIds = currentParticipants.map(user => user.id);

            const toAdd = participantIds.filter(id => !currentParticipantIds.includes(id));
            const toRemove = currentParticipantIds.filter(id => !participantIds.includes(id) && id !== userId);

            await conversation.addUsers(toAdd);
            await conversation.removeUsers(toRemove);
        }

        const updatedConversation = await Conversation.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'participants',
                    attributes: ['id', 'username', 'profilePicture'],
                    through: { attributes: [] }
                }
            ]
        });

        res.json(updatedConversation);
    } catch (error) {
        res.status(500).json({ message: "Erro ao atualizar conversa" });
    }
};

export const deleteConversation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const conversation = await Conversation.findByPk(id);

        if (!conversation) {
            return res.status(404).json({ message: "Conversa não encontrada" });
        }

        const participants = await conversation.getUsers();
        if (!participants.some(participant => participant.id === userId)) {
            return res.status(403).json({ message: "Você não tem permissão para excluir esta conversa" });
        }

        await conversation.destroy();

        res.json({ message: "Conversa excluída com sucesso" });
    } catch (error) {
        res.status(500).json({ message: "Erro ao excluir conversa" });
    }
};

export const getWorkspaceConversations = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const userId = req.user.id;

        // Verificar se o usuário pertence ao workspace
        const userWorkspace = await models.UserWorkspace.findOne({
            where: { userId, workspaceId }
        });

        if (!userWorkspace) {
            return res.status(403).json({ message: "Você não tem acesso a este workspace" });
        }

        const conversations = await Conversation.findAll({
            where: { workspaceId },
            include: [
                {
                    model: User,
                    as: 'participants',
                    through: { 
                        model: models.ConversationParticipants,
                        attributes: []
                    },
                    attributes: ['id', 'username', 'profilePicture']
                },
                {
                    model: Message,
                    as: 'messages',
                    limit: 1,
                    separate: true,
                    order: [['createdAt', 'DESC']],
                    include: [{ 
                        model: User, 
                        as: 'sender', 
                        attributes: ['id', 'username', 'profilePicture'] 
                    }]
                }
            ],
            order: [['updatedAt', 'DESC']]
        });

        const userConversations = conversations.filter(conv => 
            conv.participants.some(participant => participant.id === userId)
        );

        const formattedConversations = userConversations.map(conversation => {
            const { id, name, workspaceId, participants, messages, createdAt, updatedAt, isGroup, groupProfilePhoto } = conversation;
            return {
                id,
                name,
                workspaceId,
                participants,
                lastMessage: messages && messages.length > 0 ? messages[0] : null,
                createdAt,
                updatedAt,
                isGroup,
                groupProfilePhoto
            };
        });

        res.json(formattedConversations);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar conversas do workspace" });
    }
};

