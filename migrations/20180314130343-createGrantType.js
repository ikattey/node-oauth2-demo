const { GRANT_TYPES } = require('../constants');
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('GrantTypes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      value: Sequelize.ENUM(...GRANT_TYPES),
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
  down: queryInterface => {
    return queryInterface.dropTable('GrantTypes');
  }
};
