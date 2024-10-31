import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
    class MessageHistory extends Model {
        static associate(models) {
            MessageHistory.belongsTo(models.Campaign, { 
                foreignKey: 'campaignId',
                as: 'campaign'
            });
        }
    }

    MessageHistory.init({
        campaignId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Campaigns',
                key: 'id'
            }
        },
        contact: {
            type: DataTypes.STRING,
            allowNull: false
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('SENT', 'ERROR'),
            allowNull: false
        },
        error: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        sentAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        metadata: {
            type: DataTypes.JSONB,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'MessageHistory',
        tableName: 'MessageHistories'
    });

    return MessageHistory;
};
