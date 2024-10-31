'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Campaigns', 'workspaceId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Workspaces',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Campaigns', 'workspaceId');
  }
}; 