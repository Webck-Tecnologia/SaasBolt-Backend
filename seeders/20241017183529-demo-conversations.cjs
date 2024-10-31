'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Conversations', [
      {
        name: 'Grupo A',
        type: 'GROUP',
        instanceId: 'instance-a1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Conversa Particular 1',
        type: 'PRIVATE',
        instanceId: 'instance-a1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Grupo B',
        type: 'GROUP',
        instanceId: 'instance-b1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Conversa Particular 2',
        type: 'PRIVATE',
        instanceId: 'instance-b1',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Conversations', null, {});
  }
};