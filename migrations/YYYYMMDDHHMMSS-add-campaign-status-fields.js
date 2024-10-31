export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Campaigns', 'status', {
      type: Sequelize.ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'COMPLETED_WITH_ERRORS'),
      defaultValue: 'PENDING',
      allowNull: false
    });

    await queryInterface.addColumn('Campaigns', 'successCount', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });

    await queryInterface.addColumn('Campaigns', 'failureCount', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });

    await queryInterface.addColumn('Campaigns', 'error', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('Campaigns', 'lastProcessedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Campaigns', 'status');
    await queryInterface.removeColumn('Campaigns', 'successCount');
    await queryInterface.removeColumn('Campaigns', 'failureCount');
    await queryInterface.removeColumn('Campaigns', 'error');
    await queryInterface.removeColumn('Campaigns', 'lastProcessedAt');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_Campaigns_status;');
  }
};
