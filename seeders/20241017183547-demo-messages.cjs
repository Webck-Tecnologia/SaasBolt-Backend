'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const messages = [];
    for (let i = 0; i < 20; i++) {
      messages.push({
        content: `Mensagem de exemplo ${i}`,
        senderId: (i % 10) + 1,
        conversationId: (i % 4) + 1,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    await queryInterface.bulkInsert('Messages', messages, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Messages', null, {});
  }
};