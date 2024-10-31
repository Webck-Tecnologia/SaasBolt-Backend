import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class MessageLog extends Model {
    static associate(models) {
      MessageLog.belongsTo(models.MessageCampaign, { foreignKey: 'messageCampaignId' });
      MessageLog.belongsTo(models.Recipient, { foreignKey: 'recipientId' });
    }
  }

  MessageLog.init({
    messageCampaignId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'MessageCampaigns',
        key: 'id'
      }
    },
    recipientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Recipients',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('SENT', 'DELIVERED', 'READ', 'FAILED'),
      allowNull: false,
      defaultValue: 'SENT'
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'MessageLog',
    tableName: 'MessageLogs'
  });

  return MessageLog;
};
