'use strict';

/** @type {import('sequelize-cli').Migration} */
const { v7: uuidv7 } = require('uuidv7');
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.removeColumn('events', 'capacity');

    await queryInterface.removeColumn('events', 'amount');

    await queryInterface.removeColumn('events', 'cryptoAmount');

    await queryInterface.removeColumn('events', 'currency');

    await queryInterface.removeColumn('events', 'cryptoCurrency');

    await queryInterface.removeColumn('events', 'cryptoSymbol');

    await queryInterface.createTable('tickets', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        unique: true,
        defaultValue: uuidv7,
      },
      eventId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'events',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      amount: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      cryptoAmount: {
        type: Sequelize.DECIMAL(20, 8),
        allowNull: true,
      },
      currency: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
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

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.addColumn('events', 'capacity', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn('events', 'amount', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('events', 'cryptoAmount', {
      type: Sequelize.DECIMAL(20, 8),
      allowNull: true,
    });

    await queryInterface.addColumn('events', 'currency', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('events', 'cryptoCurrency', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('events', 'cryptoSymbol', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.dropTable('tickets');
  }
};
