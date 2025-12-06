const { sequelize } = require('../config/db');

async function drop() {
    try {
        await sequelize.authenticate();
        await sequelize.getQueryInterface().dropTable('AuditLogs');
        console.log('✅ Dropped AuditLogs table');
    } catch (error) {
        console.error('Error dropping table:', error);
    } finally {
        await sequelize.close();
    }
}

drop();
