const User = require('../models/User');
const { Expense, Category } = require('../models/Finance');
const Income = require('../models/Income');
const { Loan } = require('../models/Loan');
const Household = require('../models/Household');
const HouseholdMember = require('../models/HouseholdMember');
const Savings = require('../models/Savings');
const AuditLog = require('../models/AuditLog');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');

exports.getStats = async (req, res) => {
    try {
        const userCount = await User.count();
        const activeLoans = await Loan.count({ where: { status: 'active' } });
        const auditCount = await AuditLog.count();

        res.json({
            userCount,
            activeLoans,
            auditCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAnalytics = async (req, res) => {
    try {
        const { Op } = require('sequelize');

        // 1. User Growth (Last 6 Months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const users = await User.findAll({
            where: { createdAt: { [Op.gte]: sixMonthsAgo } },
            attributes: ['createdAt']
        });

        const growthMap = {};
        users.forEach(u => {
            const month = new Date(u.createdAt).toLocaleString('en-US', { month: 'short' });
            growthMap[month] = (growthMap[month] || 0) + 1;
        });

        const userGrowth = Object.entries(growthMap).map(([name, value]) => ({ name, value }));

        // 2. Theme Distribution
        const themes = await User.findAll({
            attributes: ['theme', [sequelize.fn('COUNT', sequelize.col('theme')), 'count']],
            group: ['theme']
        });
        const themeDistribution = themes.map(t => ({ name: t.theme, value: parseInt(t.get('count')) }));

        // 3. Logo Preferences
        const logos = await User.findAll({
            attributes: ['logo', [sequelize.fn('COUNT', sequelize.col('logo')), 'count']],
            group: ['logo']
        });
        const logoDistribution = logos.map(l => ({ name: l.logo || 'Default', value: parseInt(l.get('count')) }));

        // 4. Activity Stats (Active < 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const activeUsers = await User.count({ where: { lastLogin: { [Op.gte]: sevenDaysAgo } } });
        const inactiveUsers = await User.count({ where: { lastLogin: { [Op.lt]: sevenDaysAgo } } }); // or null
        const neverLoggedIn = await User.count({ where: { lastLogin: null } });

        const activityStats = [
            { name: 'Active (7d)', value: activeUsers },
            { name: 'Inactive', value: inactiveUsers + neverLoggedIn }
        ];

        // 4. Marketing Consent Stats
        const consented = await User.count({ where: { marketingConsent: true } });
        const optedOut = await User.count({ where: { marketingConsent: false } }); // or null, treat as false

        const marketingStats = [
            { name: 'Opt-in', value: consented },
            { name: 'Opt-out', value: optedOut }
        ];

        res.json({
            userGrowth,
            themeDistribution,
            logoDistribution,
            activityStats,
            marketingStats
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const { scope } = req.query; // 'deleted' or undefined
        const whereClause = {};

        let paranoid = true;
        if (scope === 'deleted') {
            whereClause.deletedAt = { [Op.ne]: null };
            paranoid = false;
        }

        const users = await User.findAll({
            where: whereClause,
            attributes: ['id', 'username', 'email', 'emailVerified', 'role', 'createdAt', 'lastLogin', 'deletedAt'],
            order: [['createdAt', 'DESC']],
            limit: 100, // Pagination later
            paranoid
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAuditLogs = async (req, res) => {
    try {
        const logs = await AuditLog.findAll({
            order: [['createdAt', 'DESC']],
            limit: 200,
            include: [{ model: User, attributes: ['username'], required: false }]
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUserDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id, {
            attributes: ['id', 'username', 'email', 'emailVerified', 'role', 'createdAt', 'lastLogin', 'isTwoFactorEnabled', 'theme', 'currency', 'language', 'incomeFrequency', 'deletedAt'],
            paranoid: false // Allow finding deleted users
        });

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Calculate Privacy-Safe Stats
        const expenseCount = await Expense.count({
            include: [{ model: Household, include: [{ model: HouseholdMember, where: { userId: id } }] }]
        });

        // Simpler count: Expenses in households where user is member (approximate for performance)
        // Or strictly owned expenses if that's the model. 
        // Given current model: Expense -> Household. User -> HouseholdMember.
        // Let's count expenses in households this user OWNS for better accuracy/relevance.
        const householdsOwned = await Household.findAll({ where: { ownerId: id }, attributes: ['id'] });
        const householdIds = householdsOwned.map(h => h.id);

        const ownedExpenseCount = await Expense.count({ where: { householdId: householdIds } });
        const ownedLoansCount = await Loan.count({ where: { householdId: householdIds } });

        res.json({
            user,
            stats: {
                expenseCount: ownedExpenseCount,
                loanCount: ownedLoansCount,
                householdCount: householdIds.length
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'verify_email', 'disable_2fa' (reset_password is separate)

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        let detail = '';

        if (action === 'verify_email') {
            user.emailVerified = true;
            user.emailVerificationToken = null;
            detail = 'Email Manually Verified';
        } else if (action === 'disable_2fa') {
            user.isTwoFactorEnabled = false;
            user.twoFactorSecret = null;
            detail = '2FA Manually Disabled';
        } else {
            return res.status(400).json({ message: 'Invalid action' });
        }

        await user.save();

        await AuditLog.create({
            userId: req.user.id,
            action: 'ADMIN_UPDATE_USER',
            details: { target: user.email, action: detail },
            severity: 'WARNING',
            ipAddress: req.ip
        });

        res.json({ message: 'User status updated', user: { emailVerified: user.emailVerified, isTwoFactorEnabled: user.isTwoFactorEnabled } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.query; // 'forget' (Hard Delete) or undefined (Soft Delete)

        // Find user even if soft deleted (to allow Hard Delete of already soft-deleted)
        const user = await User.findByPk(id, { paranoid: false });

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Hardening
        if (user.role === 'admin' && req.user.email !== process.env.SUPER_ADMIN_EMAIL) {
            return res.status(403).json({ message: 'Only Super Admin can delete other admins.' });
        }
        if (user.id === req.user.id) return res.status(400).json({ message: 'Cannot delete yourself.' });

        if (type === 'forget') {
            // --- HARD DELETE (Cascade) ---
            const householdsOwned = await Household.findAll({ where: { ownerId: id } });
            const householdIds = householdsOwned.map(h => h.id);

            if (householdIds.length > 0) {
                await Expense.destroy({ where: { householdId: householdIds } });
                await Category.destroy({ where: { householdId: householdIds } });
                await Savings.destroy({ where: { householdId: householdIds } });
                await Income.destroy({ where: { householdId: householdIds } });
                await Loan.destroy({ where: { householdId: householdIds } });
                await HouseholdMember.destroy({ where: { householdId: householdIds } });
                await Household.destroy({ where: { id: householdIds } });
            }
            // Remove memberships
            await HouseholdMember.destroy({ where: { userId: id } });

            await user.destroy({ force: true }); // HARD DELETE

            await AuditLog.create({
                userId: req.user.id,
                action: 'ADMIN_FORGET_USER',
                details: { targetDeleted: user.email, type: 'hard_GDPR' },
                severity: 'CRITICAL',
                ipAddress: req.ip
            });
            return res.json({ message: 'User permanently forgotten (Hard Delete)' });

        } else {
            // --- SOFT DELETE ---
            await user.destroy(); // Sets deletedAt

            await AuditLog.create({
                userId: req.user.id,
                action: 'ADMIN_DELETE_USER',
                details: { targetDeleted: user.email, type: 'soft' },
                severity: 'WARNING',
                ipAddress: req.ip
            });
            return res.json({ message: 'User moved to trash (Soft Delete)' });
        }
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.restoreUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id, { paranoid: false });

        if (!user) return res.status(404).json({ message: 'User not found' });

        await user.restore();

        await AuditLog.create({
            userId: req.user.id,
            action: 'ADMIN_RESTORE_USER',
            details: { targetRestored: user.email },
            severity: 'WARNING',
            ipAddress: req.ip
        });

        res.json({ message: 'User restored successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.bulkDelete = async (req, res) => {
    try {
        const { ids, action } = req.body; // action: 'delete' (soft) or 'forget' (hard) or 'restore'
        if (!ids || !Array.isArray(ids)) return res.status(400).json({ message: 'Invalid IDs' });

        const users = await User.findAll({ where: { id: ids }, paranoid: false });
        // Security check: Don't allow deleting self or super admin
        const safeUsers = users.filter(u => u.id !== req.user.id && u.email !== process.env.SUPER_ADMIN_EMAIL);

        if (action === 'restore') {
            await User.restore({ where: { id: safeUsers.map(u => u.id) } });
            return res.json({ message: `Restored ${safeUsers.length} users` });
        }

        if (action === 'forget') {
            // Hard Delete Loop (for cascade safety)
            for (const user of safeUsers) {
                // Cascade logic duplication (refactor ideally, but inline for safety now)
                const householdsOwned = await Household.findAll({ where: { ownerId: user.id } });
                const householdIds = householdsOwned.map(h => h.id);
                if (householdIds.length > 0) {
                    await Expense.destroy({ where: { householdId: householdIds } });
                    await Category.destroy({ where: { householdId: householdIds } });
                    await Savings.destroy({ where: { householdId: householdIds } });
                    await Income.destroy({ where: { householdId: householdIds } });
                    await Loan.destroy({ where: { householdId: householdIds } });
                    await HouseholdMember.destroy({ where: { householdId: householdIds } });
                    await Household.destroy({ where: { id: householdIds } });
                }
                await HouseholdMember.destroy({ where: { userId: user.id } });
                await user.destroy({ force: true });
            }
            return res.json({ message: `Permanently deleted ${safeUsers.length} users` });
        }

        // Default: Soft Delete
        await User.destroy({ where: { id: safeUsers.map(u => u.id) } });
        res.json({ message: `Moved ${safeUsers.length} users to trash` });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.promoteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Hardening: Only Super Admin can promote users
        if (req.user.email !== process.env.SUPER_ADMIN_EMAIL) {
            return res.status(403).json({ message: 'Only Super Admin can promote users.' });
        }

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.role === 'admin') {
            return res.status(400).json({ message: 'User is already an admin.' });
        }

        user.role = 'admin';
        await user.save();

        await AuditLog.create({
            userId: req.user.id,
            action: 'ADMIN_PROMOTE_USER',
            details: { targetPromoted: user.email },
            severity: 'CRITICAL',
            ipAddress: req.ip
        });

        res.json({ message: `User ${user.email} promoted to Admin.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
