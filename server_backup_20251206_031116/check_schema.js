const { sequelize } = require('./config/db');

async function checkSchema() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const [results, metadata] = await sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'Loans';");
        console.log('Loans Table Columns:', results.map(c => c.column_name));

    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
}

checkSchema();
