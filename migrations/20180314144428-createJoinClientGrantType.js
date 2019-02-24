'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('ClientGrantTypes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      clientId: {
        type: Sequelize.UUID,
        onDelete: 'cascade', onUpdate: 'cascade',
        references: {
          model: 'Clients',
          key: 'id'
        }
      },

      grantTypeId: {
        type: Sequelize.INTEGER,
        onDelete: 'cascade', onUpdate: 'cascade',
        references: {
          model: 'GrantTypes',
          key: 'id'
        }
      },

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
  down: (queryInterface) => {
    return queryInterface.dropTable('ClientGrantTypes');
  }
};
