import models from '../models/index.js';
import bcrypt from 'bcrypt';

const { User, Workspace, UserWorkspace, Instance } = models;

async function initializeDatabase() {
  try {
    // Sincronizar todos os modelos com o banco de dados
    await models.sequelize.sync({ force: true });

    console.log('Banco de dados sincronizado.');

    // Criar workspaces iniciais
    const workspace1 = await Workspace.create({
      name: 'Workspace 1',
      cnpj: '12345678901234',
      activeModules: ['module1', 'module2'],
      inviteCode: 'INVITE1'
    });

    // ... (resto do código de inicialização)

    // Criar instâncias iniciais (se necessário)
    await Instance.create({
      instanceName: 'instance1',
      instanceId: 'id1',
      workspaceId: workspace1.id,
      status: 'active'
    });

    console.log('Dados iniciais inseridos com sucesso.');
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados:', error);
  }
}

initializeDatabase();

