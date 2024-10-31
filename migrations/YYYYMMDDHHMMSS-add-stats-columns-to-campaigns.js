'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Campaigns', 'totalMessages', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });
    await queryInterface.addColumn('Campaigns', 'successCount', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });
    await queryInterface.addColumn('Campaigns', 'failureCount', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Campaigns', 'totalMessages');
    await queryInterface.removeColumn('Campaigns', 'successCount');
    await queryInterface.removeColumn('Campaigns', 'failureCount');
  }
}; 