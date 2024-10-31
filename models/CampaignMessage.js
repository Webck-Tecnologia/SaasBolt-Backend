import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const CampaignMessage = sequelize.define('CampaignMessage', {
    type: {
      type: DataTypes.ENUM('TEXT', 'IMAGE', 'DOCUMENT', 'AUDIO'),
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    variations: {
      type: DataTypes.JSON,
      defaultValue: []
    }
  });

  return CampaignMessage;
};
