import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
    class PasswordResetToken extends Model {
        static associate(models) {
            PasswordResetToken.belongsTo(models.User, {
                foreignKey: 'userId',
                as: 'user',
                onDelete: 'CASCADE'
            });
        }
    }

    PasswordResetToken.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        token: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false,
            validate: {
                isDate: true,
                isAfterNow(value) {
                    if (value && value < new Date()) {
                        throw new Error('A data de expiração deve ser futura');
                    }
                }
            }
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        used: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        sequelize,
        modelName: 'PasswordResetToken',
        tableName: 'PasswordResetTokens',
        timestamps: true,
        indexes: [
            {
                fields: ['token'],
                unique: true
            },
            {
                fields: ['userId']
            },
            {
                fields: ['expiresAt']
            }
        ]
    });

    return PasswordResetToken;
};