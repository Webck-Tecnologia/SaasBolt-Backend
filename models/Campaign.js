import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Campaign extends Model {
    static associate(models) {
      Campaign.belongsTo(models.Workspace, {
        foreignKey: 'workspaceId',
        as: 'workspace'
      });
      
      // Adiciona a associação com MessageHistory
      Campaign.hasMany(models.MessageHistory, {
        foreignKey: 'campaignId',
        as: 'MessageHistories'
      });
    }
  }

  Campaign.init({
    workspaceId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    name: DataTypes.STRING,
    type: DataTypes.STRING,
    startImmediately: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    startDate: DataTypes.DATE,
    messageInterval: DataTypes.INTEGER,
    messages: DataTypes.JSONB,
    instanceIds: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    csvFileUrl: DataTypes.STRING,
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'URL da imagem armazenada no MinIO'
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'PENDING'
    },
    successCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    failureCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    error: DataTypes.TEXT,
    lastProcessedAt: DataTypes.DATE,
    instanceId: DataTypes.STRING,
    scheduledTo: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Data e hora agendada para início da campanha'
    }
  }, {
    sequelize,
    modelName: 'Campaign',
    tableName: 'Campaigns'
  });

  return Campaign;
};
