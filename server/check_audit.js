const { sequelize } = require('./config/db');
const AuditLog = require('./models/AuditLog');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function checkLogs() {
    try {
        await sequelize.authenticate();
        const logs = await AuditLog.findAll({
            order: [['createdAt', 'DESC']],
            limit: 5
        });

        console.log('--- LATEST AUDIT LOGS ---');
        logs.forEach(log => {
            console.log(`[${log.severity}] ${log.action} - ${log.ipAddress} (${log.createdAt})`);
            console.log(`Details: ${JSON.stringify(log.details)}`);
            console.log('-------------------------');
        });

        if (logs.length === 0) console.log("No logs found.");

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkLogs();
