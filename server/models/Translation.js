const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Translation = sequelize.define('Translation', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    namespace: {
        type: DataTypes.STRING,
        defaultValue: 'translation',
        allowNull: false
    },
    lang: {
        type: DataTypes.STRING(5), // en, es, etc.
        allowNull: false
    },
    key: {
        type: DataTypes.STRING,
        allowNull: false
    },
    value: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    tableName: 'Translations',
    timestamps: true,
    indexes: [
        { unique: true, fields: ['lang', 'namespace', 'key'] }
    ]
});

module.exports = Translation;
