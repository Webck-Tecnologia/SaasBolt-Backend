import models from '../models/index.js';
import { Op } from 'sequelize';
import { errorHandler } from '../utils/error.js';
import bcrypt from 'bcryptjs';

const { User, Workspace, UserWorkspace, WorkspaceModule } = models;

export const getUsers = async (req, res) => {
    try {
        const workspaceId = req.params.workspaceId;
        const users = await User.findAll({
            include: [{
                model: Workspace,
                where: { id: workspaceId },
                through: { attributes: [] }
            }],
            attributes: { exclude: ['password'] }
        });
        res.json(users);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const getUserForSidebar = async (req, res, next) => {
    try {
        const loggedInUserId = req.user.id;
        const activeWorkspaceId = req.user.activeWorkspaceId;

        const allUserExceptLoggedInUser = await User.findAll({
            include: [{
                model: Workspace,
                where: { id: activeWorkspaceId },
                through: { attributes: [] }
            }],
            where: {
                id: {
                    [Op.not]: loggedInUserId
                }
            },
            attributes: { exclude: ['password'] }
        });
        
        if (allUserExceptLoggedInUser.length === 0) {
            return next(errorHandler(404, "Não há usuários para exibir neste workspace"));
        }
        res.status(200).json(allUserExceptLoggedInUser);
    } catch (error) {
        return next(error);
    }
};

export const createUser = async (req, res) => {
    try {
        const { username, email, password, workspaceId, cpf, gender } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ username, email, password: hashedPassword, cpf, gender });
        const workspace = await Workspace.findByPk(workspaceId);
        await user.addWorkspace(workspace);
        res.status(201).json({ ...user.toJSON(), password: undefined });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const updateUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const { username, email, profilePicture, gender } = req.body;
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }
        await user.update({ username, email, profilePicture, gender });
        res.json({ ...user.toJSON(), password: undefined });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const setActiveWorkspace = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { workspaceId } = req.body;

        // Verificar se o usuário faz parte do workspace
        const userWorkspace = await UserWorkspace.findOne({
            where: { userId, workspaceId }
        });

        if (!userWorkspace) {
            return next(errorHandler(403, "Você não tem permissão para acessar este workspace"));
        }

        // Atualizar o workspace ativo do usuário
        await User.update({ activeWorkspaceId: workspaceId }, {
            where: { id: userId }
        });

        // Buscar o workspace atualizado para retornar na resposta
        const updatedUser = await User.findByPk(userId, {
            include: [{
                model: Workspace,
                as: 'activeWorkspace'
            }]
        });

        res.json({
            message: "Workspace ativo atualizado com sucesso",
            activeWorkspace: updatedUser.activeWorkspace
        });
    } catch (error) {
        next(error);
    }
};

export const getUserWorkspaces = async (req, res) => {
    try {
        const userId = req.user.id;
        const workspaces = await Workspace.findAll({
            include: [{
                model: User,
                where: { id: userId },
                through: { attributes: [] }
            }]
        });
        res.json(workspaces);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const getActiveWorkspace = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findByPk(userId, {
            include: [{
                model: Workspace,
                as: 'activeWorkspace'
            }]
        });
        if (!user.activeWorkspace) {
            return res.status(404).json({ error: "Nenhum workspace ativo encontrado" });
        }
        res.json(user.activeWorkspace);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const getUserDetails = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const user = await User.findOne({
            where: { id: userId },
            include: [
                {
                    model: Workspace,
                    as: 'workspaces',
                    through: { attributes: ['role'] },
                    include: [
                        {
                            model: WorkspaceModule,
                            as: 'modules'
                        }
                    ]
                },
                {
                    model: Workspace,
                    as: 'activeWorkspace'
                }
            ],
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({ message: "Usuário não encontrado" });
        }

        res.json({
            id: user.id,
            email: user.email,
            username: user.username,
            profilePicture: user.profilePicture,
            activeWorkspaceId: user.activeWorkspace ? user.activeWorkspace.id : null,
            workspaces: user.workspaces.map(w => ({
                id: w.id,
                name: w.name,
                role: w.UserWorkspace.role,
                modules: w.modules.map(m => m.name)
            }))
        });
    } catch (error) {
        next(error);
    }
};
