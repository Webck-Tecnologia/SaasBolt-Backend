import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
    class User extends Model {
        static associate(models) {
            User.hasMany(models.Message, {
                foreignKey: 'senderId',
                as: 'sentMessages'
            });

            User.hasMany(models.PasswordResetToken, {
                foreignKey: 'userId',
                as: 'passwordResetTokens',
                onDelete: 'CASCADE'
            });

            User.hasMany(models.Message, {
                foreignKey: 'recipientId',
                as: 'receivedMessages'
            });

            User.belongsToMany(models.Conversation, {
                through: 'ConversationParticipants',
                as: 'conversations',
                foreignKey: 'userId'
            });

            User.belongsToMany(models.Workspace, {
                through: models.UserWorkspace,
                foreignKey: 'userId',
                otherKey: 'workspaceId',
                as: 'participatedWorkspaces'
            });

            User.belongsTo(models.Workspace, {
                foreignKey: 'activeWorkspaceId',
                as: 'activeWorkspace'
            });

            User.hasMany(models.UserWorkspace, { 
                foreignKey: 'userId', 
                as: 'userWorkspaces' 
            });
        }
    }

    User.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        cpf: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        profilePicture: {
            type: DataTypes.STRING,
            defaultValue: '',
        },
        gender: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isIn: [['Masculino', 'Feminino']],
            },
        },
        activeWorkspaceId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Workspaces',
                key: 'id'
            }
        }
    }, {
        sequelize,
        modelName: 'User',
        tableName: 'Users',
        timestamps: true,
    });

    return User;
};
