'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('events', 'cryptoCurrency', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('events', 'cryptoSymbol', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.changeColumn('transactions', 'eventId', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'events',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      unique: true,
    });

    await queryInterface.changeColumn('transactions', 'transactionReference', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });

    await queryInterface.addColumn('transactions', 'currency', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('events', 'cryptoCurrency');

    await queryInterface.removeColumn('events', 'cryptoSymbol');

    await queryInterface.changeColumn('transactions', 'eventId', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'events',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      unique: false,
    });

    await queryInterface.changeColumn('transactions', 'transactionReference', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: false,
    });

    await queryInterface.removeColumn('transactions', 'currency');
  },
};
