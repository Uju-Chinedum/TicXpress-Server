'use strict';

const { type } = require('os');
const { v7: uuidv7 } = require('uuidv7');

module.exports = {
  /**
   * Add altering commands here.
   *
   * Example:
   * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
   */

  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('events', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        unique: true,
        defaultValue: uuidv7,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      phoneNumber: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      organizer: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      location: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      time: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      paid: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      amount: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      dashboardCode: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    await queryInterface.dropTable('events');
  },
};
