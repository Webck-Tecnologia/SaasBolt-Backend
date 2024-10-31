import { Sequelize } from 'sequelize';
import sequelize from '../config/database.js';

import UserModel from './user.js';
import MessageModel from './message.js';
import ConversationModel from './conversation.js';
import ConversationParticipantsModel from './conversationParticipants.js';
import WorkspaceModel from './workspace.js';
import UserWorkspaceModel from './userWorkspace.js';
import WorkspaceModuleModel from './workspaceModule.js';
import InstanceModel from './instance.js';
import CampaignModel from './Campaign.js';
import MessageCampaignModel from './messageCampaign.js';
import RecipientModel from './recipient.js';
import MessageHistoryModel from './messageHistory.js';
import PasswordResetTokenModel from './passwordResetToken.js';

const models = {
  User: UserModel(sequelize),
  Message: MessageModel(sequelize),
  Conversation: ConversationModel(sequelize),
  ConversationParticipants: ConversationParticipantsModel(sequelize),
  Workspace: WorkspaceModel(sequelize),
  UserWorkspace: UserWorkspaceModel(sequelize),
  WorkspaceModule: WorkspaceModuleModel(sequelize),
  Instance: InstanceModel(sequelize),
  Campaign: CampaignModel(sequelize),
  MessageCampaign: MessageCampaignModel(sequelize),
  Recipient: RecipientModel(sequelize),
  MessageHistory: MessageHistoryModel(sequelize),
  PasswordResetToken: PasswordResetTokenModel(sequelize)
};

Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

export { sequelize };
export default models;
