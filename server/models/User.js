const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    emailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    emailVerificationToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    resetPasswordToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    resetPasswordExpires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    twoFactorSecret: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    isTwoFactorEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    hasCompletedOnboarding: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    monthlyIncome: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    currency: {
        type: DataTypes.STRING,
        defaultValue: 'USD'
    },
    language: {
        type: DataTypes.STRING,
        defaultValue: 'en'
    },
    theme: {
        type: DataTypes.STRING,
        defaultValue: 'cosmic'
    },
    mode: {
        type: DataTypes.STRING,
        defaultValue: 'dark'
    },
    logo: {
        type: DataTypes.STRING,
        defaultValue: 'cosmic'
    }
}, {
    timestamps: true,
});

module.exports = User;
