import { DataTypes } from 'sequelize';

export default (sequelize) => {
    const Message = sequelize.define('Message', {
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
    });

    Message.associate = (models) => {
        Message.belongsTo(models.User, {
            foreignKey: 'senderId',
            as: 'sender'
        });

        Message.belongsTo(models.Conversation, {
            foreignKey: 'conversationId',
            as: 'conversation'
        });
    };

    return Message;
};