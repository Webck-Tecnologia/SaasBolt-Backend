import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
    class ConversationParticipants extends Model {
        static associate(models) {
            // Associações, se necessário
        }
    }

    ConversationParticipants.init({
        conversationId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Conversations',
                key: 'id'
            }
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        }
    }, {
        sequelize,
        modelName: 'ConversationParticipants',
        tableName: 'ConversationParticipants',
        timestamps: false
    });

    return ConversationParticipants;
};
