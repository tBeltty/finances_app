const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Household = sequelize.define('Household', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    ownerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    inviteCode: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true
    },
    savingsGoalType: {
        type: DataTypes.ENUM('PERCENT', 'FIXED', 'NONE'),
        defaultValue: 'NONE'
    },
    savingsGoalValue: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    }
});

module.exports = Household;
