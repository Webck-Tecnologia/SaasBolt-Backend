'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Conversations', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Workspaces',
          key: 'id',
        },
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      isGroup: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      lastMessageAt: {
        type: Sequelize.DATE,
      },
      groupProfilePhoto: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      type: {  // Adicionando a coluna "type" se realmente for necessária
        type: Sequelize.STRING,
        allowNull: true, // Defina conforme necessário
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Conversations');
  },
};
