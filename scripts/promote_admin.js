const { sequelize } = require('../server/config/db');
const User = require('../server/models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const email = process.argv[2];

if (!email) {
    console.error('Usage: node promote_admin.js <email>');
    process.exit(1);
}

async function promote() {
    try {
        await sequelize.authenticate();
        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.error(`User with email ${email} not found.`);
            process.exit(1);
        }

        user.role = 'admin';
        await user.save();

        console.log(`✅ User ${user.username} (${email}) has been promoted to ADMIN.`);
    } catch (error) {
        console.error('Error promoting user:', error);
    } finally {
        await sequelize.close();
    }
}

promote();
