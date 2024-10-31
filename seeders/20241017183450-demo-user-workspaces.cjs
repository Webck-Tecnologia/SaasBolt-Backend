'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Primeiro, vamos verificar quais usuários existem
    const existingUsers = await queryInterface.sequelize.query(
      'SELECT id FROM "Users"',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const existingUserIds = new Set(existingUsers.map(user => user.id));

    const userWorkspaces = [];
    for (let i = 0; i < 10; i++) {
      if (existingUserIds.has(i + 1)) {
        userWorkspaces.push({
          userId: i + 1,
          workspaceId: i < 5 ? 1 : 2,
          role: i === 0 || i === 5 ? 'admin' : 'member',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    if (userWorkspaces.length > 0) {
      await queryInterface.bulkInsert('UserWorkspaces', userWorkspaces, {});
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('UserWorkspaces', null, {});
  }
};
