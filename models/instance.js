import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
    class Instance extends Model {
        static associate(models) {
            Instance.belongsTo(models.Workspace, { foreignKey: 'workspaceId' });
            if (models.Campaign) {
                Instance.hasMany(models.Campaign, { foreignKey: 'instanceId' });
            }
        }
    }

    Instance.init({
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        phoneNumber: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        status: {
            type: DataTypes.ENUM('CONNECTED', 'DISCONNECTED', 'WAITING_QR', 'CONNECTING'),
            allowNull: false,
            defaultValue: 'DISCONNECTED'
        },
        workspaceId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Workspaces',
                key: 'id'
            }
        },
        qrcode: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        frontName: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Instance',
        tableName: 'Instances'
    });

    return Instance;
};
