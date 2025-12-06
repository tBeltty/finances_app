const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const HouseholdMember = sequelize.define('HouseholdMember', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    householdId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Households',
            key: 'id'
        }
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: 'member', // 'owner', 'admin', 'member'
        allowNull: false
    },
    isDefault: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
});

module.exports = HouseholdMember;
