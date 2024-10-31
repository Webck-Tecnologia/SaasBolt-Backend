'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('MessageHistories', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            campaignId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Campaigns',
                    key: 'id'
                }
            },
            contact: {
                type: Sequelize.STRING,
                allowNull: false
            },
            message: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            status: {
                type: Sequelize.ENUM('SENT', 'ERROR'),
                allowNull: false
            },
            error: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            sentAt: {
                type: Sequelize.DATE,
                allowNull: false
            },
            metadata: {
                type: Sequelize.JSONB,
                allowNull: true
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('MessageHistories');
    }
};
