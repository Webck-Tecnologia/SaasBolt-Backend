import models from '../models/index.js';
const { User, UserWorkspace, Workspace } = models;
import { Op } from 'sequelize';

export const getWorkspaceContacts = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const userId = req.user.id;

        // Verificar se o usuário pertence ao workspace
        const userWorkspace = await UserWorkspace.findOne({ 
            where: { userId, workspaceId, isActive: true } 
        });
        if (!userWorkspace) {
            return res.status(403).json({ message: "Você não tem acesso a este workspace" });
        }

        // Buscar todos os UserWorkspaces ativos para o workspace, exceto o do usuário autenticado
        const workspaceUsers = await UserWorkspace.findAll({
            where: { 
                workspaceId,
                isActive: true,
                userId: { [Op.ne]: userId }
            },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'email', 'profilePicture']
            }]
        });

        // Formatar a resposta
        const contacts = workspaceUsers.map(wu => ({
            id: wu.user.id,
            username: wu.user.username,
            email: wu.user.email,
            profilePicture: wu.user.profilePicture,
            role: wu.role
        }));

        res.json(contacts);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar contatos do workspace" });
    }
};
