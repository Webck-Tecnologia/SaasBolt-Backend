import models from '../models/index.js';
import { errorHandler } from '../utils/error.js';
import { UniqueConstraintError } from 'sequelize';
import { Op } from 'sequelize';
import { validateCNPJ } from '../utils/cnpjValidator.js';
const { User, Workspace, UserWorkspace, WorkspaceModule } = models;

// Função auxiliar para formatar o CNPJ
const formatCNPJ = (cnpj) => {
    return cnpj.replace(/[^\d]/g, '');
};

// Função para gerar um código de convite único
const generateUniqueInviteCode = async () => {
    let inviteCode;
    let isUnique = false;
    
    while (!isUnique) {
        // Gera um código aleatório de 5 dígitos
        inviteCode = Math.floor(10000 + Math.random() * 90000).toString();
        
        // Verifica se o código já existe
        const existingWorkspace = await Workspace.findOne({ where: { inviteCode } });
        if (!existingWorkspace) {
            isUnique = true;
        }
    }
    
    return inviteCode;
};

export const getUserWorkspaces = async (req, res, next) => {
    try {
        const userId = req.user.id;
        if (!userId) {
            return next(errorHandler(400, "ID do usuário não fornecido"));
        }

        const userWorkspaces = await UserWorkspace.findAll({
            where: { userId: userId },
            include: [{
                model: Workspace,
                as: 'workspace'
            }]
        });

        if (!userWorkspaces || userWorkspaces.length === 0) {
            return next(errorHandler(404, "O usuário não tem Workspace cadastrado"));
        }

        res.status(200).json(userWorkspaces);
    } catch (error) {
        console.error('Erro ao buscar workspaces do usuário:', error);
        next(error);
    }
};

export const getUserActiveWorkspaces = async (req, res, next) => {
    try {
        const userId = req.user.id;
        if (!userId) {
            return next(errorHandler(400, "ID do usuário não fornecido"));
        }

        const userActiveWorkspaces = await UserWorkspace.findAll({
            where: { userId: userId, isActive: true },
            include: [{
                model: Workspace,
                as: 'workspace'
            }]
        });

        if (!userActiveWorkspaces || userActiveWorkspaces.length === 0) {
            return next(errorHandler(404, "O usuário não tem Workspace ativo"));
        }

        res.status(200).json(userActiveWorkspaces);
    } catch (error) {
        next(error);
    }
};

export const createWorkspace = async (req, res, next) => {
    try {
        const { name, cnpj: rawCnpj } = req.body;
        const userId = req.user.id;

        // Formatar o CNPJ removendo caracteres não numéricos
        const cnpj = formatCNPJ(rawCnpj);

        // Verificar se o CNPJ é válido
        if (!validateCNPJ(cnpj)) {
            return next(errorHandler(400, "CNPJ inválido."));
        }

        // Verificar se já existe um workspace com este CNPJ
        const existingWorkspace = await Workspace.findOne({ where: { cnpj } });
        if (existingWorkspace) {
            return next(errorHandler(400, "Já existe um workspace com este CNPJ cadastrado"));
        }

        // Gerar um código de convite único
        const inviteCode = await generateUniqueInviteCode();

        // Criar o workspace com o código de convite
        const workspace = await Workspace.create({ name, cnpj, inviteCode });
        await UserWorkspace.create({ userId, workspaceId: workspace.id, role: 'owner' });

        res.status(201).json(workspace);
    } catch (error) {
        console.error('Erro ao criar workspace:', error);
        if (error instanceof UniqueConstraintError) {
            return next(errorHandler(400, "Já existe um workspace com este CNPJ cadastrado"));
        }
        next(error);
    }
};

export const updateWorkspace = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, cnpj: rawCnpj } = req.body;
        const userId = req.user.id;

        // Formatar o CNPJ removendo caracteres não numéricos
        const cnpj = formatCNPJ(rawCnpj);

        // Verificar se o CNPJ é válido
        if (!validateCNPJ(cnpj)) {
            return next(errorHandler(400, "CNPJ inválido."));
        }

        const userWorkspace = await UserWorkspace.findOne({
            where: { userId, workspaceId: id, role: 'owner' }
        });

        if (!userWorkspace) {
            return next(errorHandler(403, "Você não tem permissão para atualizar este workspace"));
        }

        const workspace = await Workspace.findByPk(id);
        if (!workspace) {
            return next(errorHandler(404, "Workspace não encontrado"));
        }

        // Verificar se o novo CNPJ já existe (excluindo o workspace atual)
        const existingWorkspace = await Workspace.findOne({
            where: { 
                cnpj,
                id: { [Op.ne]: id } // não igual ao id atual
            }
        });
        if (existingWorkspace) {
            return next(errorHandler(400, "Já existe outro workspace com este CNPJ cadastrado"));
        }

        await workspace.update({ name, cnpj });
        res.status(200).json(workspace);
    } catch (error) {
        console.error('Erro ao atualizar workspace:', error);
        next(error);
    }
};

export const deleteWorkspace = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const userWorkspace = await UserWorkspace.findOne({
            where: { userId, workspaceId: id, role: 'owner' }
        });

        if (!userWorkspace) {
            return next(errorHandler(403, "Você não tem permissão para excluir este workspace"));
        }

        const workspace = await Workspace.findByPk(id);
        if (!workspace) {
            return next(errorHandler(404, "Workspace não encontrado"));
        }

        await workspace.destroy();
        res.status(200).json({ message: "Workspace excluído com sucesso" });
    } catch (error) {
        console.error('Erro ao excluir workspace:', error);
        next(error);
    }
};

export const getWorkspaceModules = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const userWorkspace = await UserWorkspace.findOne({
            where: { userId, workspaceId: id }
        });

        if (!userWorkspace) {
            return next(errorHandler(403, "Você não tem acesso a este workspace"));
        }

        const modules = await WorkspaceModule.findAll({
            where: { workspaceId: id }
        });

        res.status(200).json(modules);
    } catch (error) {
        console.error('Erro ao buscar módulos do workspace:', error);
        next(error);
    }
};

export const addWorkspaceModule = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { moduleName } = req.body;
        const userId = req.user.id;

        const userWorkspace = await UserWorkspace.findOne({
            where: { userId, workspaceId: id, role: 'owner' }
        });

        if (!userWorkspace) {
            return next(errorHandler(403, "Você não tem permissão para adicionar módulos a este workspace"));
        }

        const module = await WorkspaceModule.create({ workspaceId: id, moduleName });
        res.status(201).json(module);
    } catch (error) {
        console.error('Erro ao adicionar módulo ao workspace:', error);
        next(error);
    }
};

export const updateWorkspaceModule = async (req, res, next) => {
    try {
        const { id, moduleId } = req.params;
        const { isActive } = req.body;
        const userId = req.user.id;

        const userWorkspace = await UserWorkspace.findOne({
            where: { userId, workspaceId: id, role: 'owner' }
        });

        if (!userWorkspace) {
            return next(errorHandler(403, "Você não tem permissão para atualizar módulos deste workspace"));
        }

        const module = await WorkspaceModule.findOne({
            where: { id: moduleId, workspaceId: id }
        });

        if (!module) {
            return next(errorHandler(404, "Módulo não encontrado"));
        }

        await module.update({ isActive });
        res.status(200).json(module);
    } catch (error) {
        console.error('Erro ao atualizar módulo do workspace:', error);
        next(error);
    }
};

export const deleteWorkspaceModule = async (req, res, next) => {
    try {
        const { id, moduleId } = req.params;
        const userId = req.user.id;

        const userWorkspace = await UserWorkspace.findOne({
            where: { userId, workspaceId: id, role: 'owner' }
        });

        if (!userWorkspace) {
            return next(errorHandler(403, "Você não tem permissão para excluir módulos deste workspace"));
        }

        const module = await WorkspaceModule.findOne({
            where: { id: moduleId, workspaceId: id }
        });

        if (!module) {
            return next(errorHandler(404, "Módulo não encontrado"));
        }

        await module.destroy();
        res.status(200).json({ message: "Módulo excluído com sucesso" });
    } catch (error) {
        console.error('Erro ao excluir módulo do workspace:', error);
        next(error);
    }
};

export const joinWorkspaceByInviteCode = async (req, res, next) => {
    try {
        const { inviteCode } = req.body;
        const userId = req.user.id;

        const workspace = await Workspace.findOne({ where: { inviteCode } });

        if (!workspace) {
            return next(errorHandler(404, "Workspace não encontrado com este código de convite"));
        }

        const existingUserWorkspace = await UserWorkspace.findOne({
            where: { userId, workspaceId: workspace.id }
        });

        if (existingUserWorkspace) {
            return next(errorHandler(400, "Você já é membro deste workspace"));
        }

        await UserWorkspace.create({
            userId,
            workspaceId: workspace.id,
            role: 'member' // ou qualquer outra role padrão que você queira atribuir
        });

        res.status(200).json({ message: "Você foi adicionado ao workspace com sucesso", workspace });
    } catch (error) {
        console.error('Erro ao juntar-se ao workspace:', error);
        next(error);
    }
};
