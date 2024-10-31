import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
    class UserWorkspace extends Model {
        static associate(models) {
            // Associações com User e Workspace
            UserWorkspace.belongsTo(models.User, {
                foreignKey: 'userId',
                as: 'user'
            });
            UserWorkspace.belongsTo(models.Workspace, {
                foreignKey: 'workspaceId',
                as: 'workspace'
            });
        }
    }

    UserWorkspace.init({
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        workspaceId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'Workspaces',
                key: 'id'
            }
        },
        role: {
            type: DataTypes.ENUM('owner', 'admin', 'member'),
            allowNull: false,
            defaultValue: 'member'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        lastAccessed: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'UserWorkspace',
        tableName: 'UserWorkspaces',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['userId', 'workspaceId']
            }
        ]
    });

    return UserWorkspace;
};
