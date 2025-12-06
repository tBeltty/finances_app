const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Income = sequelize.define('Income', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    householdId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    type: {
        type: DataTypes.ENUM('main', 'extra'),
        defaultValue: 'extra'
    },
    category: {
        type: DataTypes.STRING,
        allowNull: true // freelance, sale, rent, dividend, cashback, other
    }
}, {
    tableName: 'Incomes',
    timestamps: true
});

module.exports = Income;
