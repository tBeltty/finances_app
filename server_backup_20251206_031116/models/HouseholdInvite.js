const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const HouseholdInvite = sequelize.define('HouseholdInvite', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    householdId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    invitedBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    isUsed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    timestamps: true,
});

module.exports = HouseholdInvite;
