import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
    class WorkspaceModule extends Model {
        static associate(models) {
            WorkspaceModule.belongsTo(models.Workspace, {
                foreignKey: 'workspaceId',
                as: 'workspace'
            });
        }
    }

    WorkspaceModule.init({
        workspaceId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Workspaces',
                key: 'id'
            }
        },
        moduleName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        sequelize,
        modelName: 'WorkspaceModule',
        tableName: 'WorkspaceModules',
        timestamps: true,
    });

    return WorkspaceModule;
};