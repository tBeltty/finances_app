const User = require('../models/User');
const Household = require('../models/Household');
const HouseholdMember = require('../models/HouseholdMember');
const { Op } = require('sequelize');

exports.cleanupUnverifiedUsers = async () => {
    try {
        console.log('Running daily cleanup of unverified users...');
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const usersToDelete = await User.findAll({
            where: {
                emailVerified: false,
                createdAt: { [Op.lt]: twentyFourHoursAgo }
            }
        });

        if (usersToDelete.length === 0) {
            console.log('No unverified users to cleanup.');
            return;
        }

        console.log(`Found ${usersToDelete.length} unverified users to clean up.`);

        for (const user of usersToDelete) {
            try {
                // 1. Delete HouseholdMemberships of this user
                await HouseholdMember.destroy({ where: { userId: user.id } });

                // 2. Find Households owned by this user
                const households = await Household.findAll({ where: { ownerId: user.id } });
                for (const household of households) {
                    // Delete members of this household
                    await HouseholdMember.destroy({ where: { householdId: household.id } });
                    // Delete the household
                    await Household.destroy({ where: { id: household.id } });
                }

                // 3. Delete User
                await User.destroy({ where: { id: user.id } });
                console.log(`Cleaned up user ${user.id} (${user.username})`);
            } catch (err) {
                console.error(`Failed to delete user ${user.id}:`, err);
            }
        }
        console.log('Cleanup complete.');
    } catch (error) {
        console.error('Error during user cleanup:', error);
    }
};
