const User = require('../models/User');
const Household = require('../models/Household');
const HouseholdMember = require('../models/HouseholdMember');
const { Op } = require('sequelize');

exports.cleanupUnverifiedUsers = async () => {
    try {
        console.log('Running daily cleanup...');

        // 1. Unverified Users (24h)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const usersToDelete = await User.findAll({
            where: {
                emailVerified: false,
                createdAt: { [Op.lt]: twentyFourHoursAgo }
            }
        });
        await hardDeleteUsers(usersToDelete, 'Unverified');

        // 2. Soft Deleted Users (30 Days Retention)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const expiredDeletedUsers = await User.findAll({
            where: {
                deletedAt: { [Op.lt]: thirtyDaysAgo }
            },
            paranoid: false // Find soft-deleted users
        });

        if (expiredDeletedUsers.length > 0) {
            console.log(`Found ${expiredDeletedUsers.length} expired soft-deleted users. Purging...`);
            await hardDeleteUsers(expiredDeletedUsers, 'Expired Soft-Delete');
        }

        console.log('Cleanup complete.');
    } catch (error) {
        console.error('Error during user cleanup:', error);
    }
};

async function hardDeleteUsers(users, reason) {
    if (users.length === 0) return;

    // Lazy load models to avoid circular deps if any
    const Expense = require('../models/Finance').Expense;
    const Category = require('../models/Finance').Category;
    const Income = require('../models/Income'); // Ensure correct import path
    const Loan = require('../models/Loan').Loan;
    const Savings = require('../models/Savings');

    for (const user of users) {
        try {
            // Delete HouseholdMemberships
            await HouseholdMember.destroy({ where: { userId: user.id } });

            // Find Households owned
            const households = await Household.findAll({ where: { ownerId: user.id } });
            const householdIds = households.map(h => h.id);

            if (householdIds.length > 0) {
                await Expense.destroy({ where: { householdId: householdIds } });
                await Category.destroy({ where: { householdId: householdIds } });
                await Savings.destroy({ where: { householdId: householdIds } });
                await Income.destroy({ where: { householdId: householdIds } });
                await Loan.destroy({ where: { householdId: householdIds } });
                await HouseholdMember.destroy({ where: { householdId: householdIds } });
                await Household.destroy({ where: { id: householdIds } });
            }

            // Hard Delete User
            await User.destroy({ where: { id: user.id }, force: true });
            console.log(`[${reason}] Perm-deleted user ${user.id} (${user.email})`);
        } catch (err) {
            console.error(`Failed to delete user ${user.id}:`, err);
        }
    }
}
