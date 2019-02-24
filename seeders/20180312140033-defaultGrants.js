'use strict';

module.exports = {
  up: queryInterface => {
    return queryInterface.bulkInsert('GrantTypes', [
      {
        value: 'authorization_code',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { value: 'password', createdAt: new Date(), updatedAt: new Date() },
      { value: 'refresh_token', createdAt: new Date(), updatedAt: new Date() },
      {
        value: 'client_credentials',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: queryInterface => {
    return queryInterface.bulkDelete('GrantTypes', null, {});
  }
};
