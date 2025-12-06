const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AuditLog = sequelize.define('AuditLog', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true // Nullable for failed login attempts where user might not exist or be known
    },
    action: {
        type: DataTypes.STRING, // LOGIN, LOGIN_FAIL, PASS_CHANGE, etc.
        allowNull: false
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: true
    },
    details: {
        type: DataTypes.JSON, // Store flexible metadata (e.g. browser info, failure reason)
        allowNull: true
    },
    severity: {
        type: DataTypes.ENUM('INFO', 'WARNING', 'CRITICAL'),
        defaultValue: 'INFO'
    }
}, {
    updatedAt: false // We only care when it happened
});

module.exports = AuditLog;
