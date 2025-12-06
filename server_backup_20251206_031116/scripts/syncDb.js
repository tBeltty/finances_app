const { sequelize } = require('../config/db');
const User = require('../models/User');
const { Category, Expense } = require('../models/Finance');
const { RECOVERED_CATEGORIES, RECOVERED_EXPENSES } = require('./seedData');

const sync = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Sync models (alter: true updates tables without dropping)
        await sequelize.sync({ alter: true });
        console.log('Models synced.');

        // Seed data for the first user (assuming ID 1)
        const user = await User.findOne({ where: { id: 1 } });
        if (user) {
            console.log(`Seeding data for user: ${user.username}`);

            // Seed Categories
            for (const cat of RECOVERED_CATEGORIES) {
                await Category.findOrCreate({
                    where: { id: cat.id, userId: user.id },
                    defaults: { ...cat, userId: user.id }
                });
            }

            // Seed Expenses (for current month: 12-2025)
            const currentMonth = "12-2025";
            for (const exp of RECOVERED_EXPENSES) {
                await Expense.findOrCreate({
                    where: { name: exp.name, month: currentMonth, userId: user.id },
                    defaults: {
                        ...exp,
                        userId: user.id,
                        month: currentMonth,
                        // Ensure ID is auto-generated or handled if we want to keep original IDs (sequelize uses ID by default)
                        // We let sequelize generate new IDs for expenses to avoid conflicts
                        id: undefined
                    }
                });
            }
            console.log('Data seeded successfully.');
        } else {
            console.log('No user found with ID 1. Please register a user first.');
        }

        process.exit();
    } catch (error) {
        console.error('Error syncing database:', error);
        process.exit(1);
    }
};

sync();
