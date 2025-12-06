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

/**
 * Check for loans with upcoming due dates and create in-app notifications.
 * Runs daily. Notifies 3 days and 1 day before due date.
 */
exports.checkLoanReminders = async () => {
    try {
        console.log('Running loan reminder check...');
        const { Loan } = require('../models/Loan');
        const Notification = require('../models/Notification');
        const HouseholdMember = require('../models/HouseholdMember');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const threeDaysFromNow = new Date(today);
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        const oneDayFromNow = new Date(today);
        oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

        // Find active loans with dueDate in next 3 days
        const upcomingLoans = await Loan.findAll({
            where: {
                status: 'active',
                dueDate: {
                    [Op.gte]: today,
                    [Op.lte]: threeDaysFromNow
                }
            }
        });

        for (const loan of upcomingLoans) {
            const dueDate = new Date(loan.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            const daysUntilDue = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));

            // Only notify on 3 days and 1 day before
            if (daysUntilDue !== 3 && daysUntilDue !== 1) continue;

            // Get all users in this household
            const members = await HouseholdMember.findAll({
                where: { householdId: loan.householdId }
            });

            for (const member of members) {
                const titleEn = daysUntilDue === 1 ? 'Loan Due Tomorrow' : 'Loan Due in 3 Days';
                const titleEs = daysUntilDue === 1 ? 'Préstamo vence mañana' : 'Préstamo vence en 3 días';

                const messageEn = loan.type === 'lent'
                    ? `${loan.personName} owes you a payment due ${dueDate.toLocaleDateString()}.`
                    : `Your payment to ${loan.personName} is due ${dueDate.toLocaleDateString()}.`;
                const messageEs = loan.type === 'lent'
                    ? `${loan.personName} te debe un pago para el ${dueDate.toLocaleDateString()}.`
                    : `Tu pago a ${loan.personName} vence el ${dueDate.toLocaleDateString()}.`;

                await Notification.create({
                    userId: member.userId,
                    type: 'warning',
                    title: titleEn,
                    message: messageEn,
                    title_es: titleEs,
                    message_es: messageEs,
                    link: '/loans',
                    actionMetadata: { loanId: loan.id, daysUntilDue }
                });
            }
        }
        console.log(`Loan reminder check complete. Processed ${upcomingLoans.length} loans.`);
    } catch (error) {
        console.error('Error during loan reminder check:', error);
    }
};
