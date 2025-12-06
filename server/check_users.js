const { sequelize } = require('./config/db');
const User = require('./models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function checkUsers() {
    try {
        await sequelize.authenticate();
        const users = await User.findAll({
            attributes: ['id', 'username', 'email', 'role', 'emailVerified']
        });
        console.log(`Found ${users.length} users:`);
        users.forEach(u => console.log(JSON.stringify(u.toJSON())));
    } catch (error) {
        console.error(error);
    } finally {
        await sequelize.close();
    }
}

checkUsers();
