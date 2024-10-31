'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Workspaces', [
      {
        name: 'Workspace 1',
        cnpj: '12345678901234',
        activeModules: ['chat', 'kanban'],
        inviteCode: 'INVITE1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Workspace 2',
        cnpj: '56789012345678',
        activeModules: ['chat', 'kanban'],
        inviteCode: 'INVITE2',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Workspaces', null, {});
  }
};
