import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Recipient extends Model {
    static associate(models) {
      Recipient.belongsTo(models.Campaign, { foreignKey: 'campaignId' });
      // Remova ou comente a linha abaixo se MessageLog não existir
      // Recipient.hasMany(models.MessageLog, { foreignKey: 'recipientId' });
    }
  }

  Recipient.init({
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    variables: {
      type: DataTypes.JSON,
      allowNull: true
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
    modelName: 'Recipient',
    tableName: 'Recipients'
  });

  return Recipient;
};
