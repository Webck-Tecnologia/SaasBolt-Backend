import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class MessageCampaign extends Model {
    static associate(models) {
      MessageCampaign.belongsTo(models.Campaign, { foreignKey: 'campaignId' });
      // Verifique se o modelo MessageLog existe antes de criar a associação
      if (models.MessageLog) {
        MessageCampaign.hasMany(models.MessageLog, { foreignKey: 'messageCampaignId' });
      }
    }
  }

  MessageCampaign.init({
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    campaignId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Campaigns',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'MessageCampaign',
    tableName: 'MessageCampaigns'
  });

  return MessageCampaign;
};
