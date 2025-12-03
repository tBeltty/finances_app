const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Savings = sequelize.define('Savings', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    householdId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Households',
            key: 'id'
        }
    },
    balance: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        allowNull: false
    },
    lastUpdated: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

module.exports = Savings;
