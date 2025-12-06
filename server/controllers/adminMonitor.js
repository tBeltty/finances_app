const os = require('os');
const User = require('../models/User');
const { Loan } = require('../models/Loan');
const AuditLog = require('../models/AuditLog');

exports.getSystemHealth = async (req, res) => {
    try {
        // System Resources
        const freeMem = os.freemem();
        const totalMem = os.totalmem();
        const usedMem = totalMem - freeMem;
        const memUsage = Math.round((usedMem / totalMem) * 100);
        const cpuLoad = os.loadavg(); // [1min, 5min, 15min]
        const uptime = os.uptime();

        // Business Metrics (Growth/Security)
        const ONE_DAY = 24 * 60 * 60 * 1000;
        const yesterday = new Date(Date.now() - ONE_DAY);

        const newUsers24h = await User.count({
            where: { createdAt: { [require('sequelize').Op.gt]: yesterday } }
        });

        const activeLoans = await Loan.count({ where: { status: 'active' } });

        const failedLogins24h = await AuditLog.count({
            where: {
                action: 'LOGIN_FAIL',
                createdAt: { [require('sequelize').Op.gt]: yesterday }
            }
        });

        // Alerts Logic
        const alerts = [];
        if (memUsage > 85) alerts.push({ type: 'warning', message: 'High Memory Usage (>85%)' });
        if (cpuLoad[0] > 1.5) alerts.push({ type: 'warning', message: 'High CPU Load' }); // Assuming 1-2 cores
        if (newUsers24h > 50) alerts.push({ type: 'info', message: 'High User Growth detected (>50/day)' });
        if (failedLogins24h > 20) alerts.push({ type: 'critical', message: `High Failed Logins detected (${failedLogins24h}/24h)` });

        res.json({
            resources: {
                memory: { free: freeMem, total: totalMem, usagePercentage: memUsage },
                cpu: { loadAvg: cpuLoad },
                uptime
            },
            metrics: {
                newUsers24h,
                activeLoans,
                failedLogins24h
            },
            alerts
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
