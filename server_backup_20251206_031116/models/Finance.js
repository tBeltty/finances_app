const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Category = sequelize.define('Category', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    color: {
        type: DataTypes.STRING,
        defaultValue: 'slate'
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    householdId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Households',
            key: 'id'
        }
    }
});

const Expense = sequelize.define('Expense', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    amount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('Fijo', 'Variable'),
        defaultValue: 'Variable'
    },
    categoryId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    paid: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    month: {
        type: DataTypes.STRING, // Format: "MM-YYYY"
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: true, // Changed to true to allow migration
        defaultValue: DataTypes.NOW
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    householdId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Households',
            key: 'id'
        }
    },
    isPaidWithSavings: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
});

module.exports = { Category, Expense };
