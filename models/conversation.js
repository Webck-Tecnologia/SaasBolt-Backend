import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
    class Conversation extends Model {
        static associate(models) {
            Conversation.belongsTo(models.Workspace, { foreignKey: 'workspaceId' });
            Conversation.belongsToMany(models.User, { 
                through: models.ConversationParticipants,
                foreignKey: 'conversationId',
                otherKey: 'userId',
                as: 'participants'
            });
            Conversation.hasMany(models.Message, { as: 'messages', foreignKey: 'conversationId' });
        }
    }

    Conversation.init({
        workspaceId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Workspaces',
                key: 'id'
            }
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        isGroup: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        lastMessageAt: {
            type: DataTypes.DATE
        },
        groupProfilePhoto: {
            type: DataTypes.STRING,
            allowNull: true
        },
        type: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    }, {
        sequelize,
        modelName: 'Conversation',
        tableName: 'Conversations'
    });

    return Conversation;
};

