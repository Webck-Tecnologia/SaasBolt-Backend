import sequelize from '../config/database.js';
import models from '../models/index.js';
import bcryptjs from 'bcryptjs';
import { Sequelize } from 'sequelize';
import retry from 'retry';

const { User, Workspace, UserWorkspace, Campaign, MessageHistory } = models;

// Função para gerar um código de convite único
const generateUniqueInviteCode = async () => {
    let inviteCode;
    let isUnique = false;
    
    while (!isUnique) {
        inviteCode = Math.floor(10000 + Math.random() * 90000).toString();
        const existingWorkspace = await Workspace.findOne({ where: { inviteCode } });
        if (!existingWorkspace) {
            isUnique = true;
        }
    }
    
    return inviteCode;
};

async function createInitialUsers() {
  const users = [
    { username: 'User 0', email: 'usuario@teste.com.br', password: '123', cpf: '12345678901', gender: 'Masculino' },
    { username: 'User 1', email: 'usuario1@teste.com.br', password: '123', cpf: '23456789012', gender: 'Feminino' }
  ];

  for (const user of users) {
    const hashedPassword = await bcryptjs.hash(user.password, 10);
    await User.create({
      ...user,
      password: hashedPassword,
      profilePicture: user.gender === 'Masculino' 
        ? `https://avatar.iran.liara.run/public/boy?username=${user.username}`
        : `https://avatar.iran.liara.run/public/girl?username=${user.username}`
    });
  }

  console.log('Usuários iniciais criados com sucesso.');
}

async function createInitialWorkspaces() {
  try {
    const workspaces = [
      { name: 'Pensar Clube', cnpj: '12345678901234' }
    ];

    for (const workspaceData of workspaces) {
      const inviteCode = await generateUniqueInviteCode();
      await Workspace.create({
        ...workspaceData,
        inviteCode
      });
    }

    console.log('Workspaces iniciais criados com sucesso.');
  } catch (error) {
    console.error('Erro ao criar workspaces iniciais:', error);
  }
}

async function createInitialCampaigns() {
  try {
    const workspace = await Workspace.findOne();
    if (!workspace) {
      console.log('Nenhum workspace encontrado para criar campanhas.');
      return;
    }

    const campaigns = [
      {
        name: 'Campanha Teste',
        workspaceId: workspace.id,
        type: 'WHATSAPP',
        startImmediately: false,
        startDate: new Date(),
        messageInterval: 30,
        messages: JSON.stringify([
          { type: 'text', content: 'Mensagem teste 1' }
        ]),
        status: 'FINISHED',
        successCount: 0,
        failureCount: 0
      }
    ];

    for (const campaignData of campaigns) {
      await Campaign.create(campaignData);
    }

    console.log('Campanhas iniciais criadas com sucesso.');
  } catch (error) {
    console.error('Erro ao criar campanhas iniciais:', error);
  }
}

async function createInitialMessageHistory() {
  try {
    const campaign = await Campaign.findOne();
    if (!campaign) {
      console.log('Nenhuma campanha encontrada para criar histórico.');
      return;
    }

    const messageHistories = [
      {
        campaignId: campaign.id,
        contact: '5584999999999',
        message: 'Mensagem teste 1',
        status: 'ERROR',
        sentAt: new Date(),
        metadata: {
          contactName: 'Contato Teste',
          messageType: 'text',
          variables: {
            nome: 'Contato Teste',
            phone: '5584999999999'
          }
        }
      },
      {
        campaignId: campaign.id,
        contact: '5584988888888',
        message: 'Mensagem teste 2',
        status: 'ERROR',
        error: 'Erro de teste',
        sentAt: new Date(),
        metadata: {
          contactName: 'Contato Erro',
          messageType: 'text',
          variables: {
            nome: 'Contato Erro',
            phone: '5584988888888'
          },
          errorDetails: 'Detalhes do erro de teste'
        }
      }
    ];

    for (const historyData of messageHistories) {
      await MessageHistory.create(historyData);
    }

    console.log('Histórico de mensagens inicial criado com sucesso.');
  } catch (error) {
    console.error('Erro ao criar histórico de mensagens inicial:', error);
  }
}

async function associateUsersToWorkspaces() {
  try {
    const users = await User.findAll();
    const workspaces = await Workspace.findAll();

    for (const workspace of workspaces) {
      // Associar o primeiro usuário como owner
      await UserWorkspace.create({
        userId: users[0].id,
        workspaceId: workspace.id,
        role: 'owner'
      });

      // Atualizar o activeWorkspaceId do usuário
      await users[0].update({ activeWorkspaceId: workspace.id });
    }

    console.log('Usuários associados aos workspaces com sucesso.');
  } catch (error) {
    console.error('Erro ao associar usuários aos workspaces:', error);
  }
}

async function initDatabase() {
  try {
    await sequelize.sync({ 
      force: true,
      alter: {
        drop: false,
        order: [
          'Users',
          'Workspaces',
          'UserWorkspaces',
          'Campaigns',
          'MessageHistories'
        ]
      }
    });
    console.log('Banco de dados sincronizado com sucesso.');

    if (process.env.PRODUCTION === 'false') {
      await createInitialUsers();
      await createInitialWorkspaces();
      await associateUsersToWorkspaces();
      await createInitialCampaigns();
      await createInitialMessageHistory();
    }

    console.log('Inicialização do banco de dados concluída.');
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados:', error);
  } finally {
    await sequelize.close();
  }
}

initDatabase();

function connectWithRetry() {
  const operation = retry.operation({
    retries: 5,
    factor: 3,
    minTimeout: 1 * 1000,
    maxTimeout: 60 * 1000,
    randomize: true,
  });

  return new Promise((resolve, reject) => {
    operation.attempt(async (currentAttempt) => {
      try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
        resolve(sequelize);
      } catch (error) {
        console.error('Unable to connect to the database:', error);
        if (operation.retry(error)) {
          console.log(`Retrying connection attempt ${currentAttempt}`);
          return;
        }
        reject(error);
      }
    });
  });
}

export default connectWithRetry;
