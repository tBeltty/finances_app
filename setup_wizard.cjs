const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
    console.log("==========================================");
    console.log("   Finances App - Setup Wizard");
    console.log("==========================================\n");

    // 1. Database Configuration
    console.log("--- Database Configuration ---");
    const dbName = await question("Database Name (default: finances_db): ") || "finances_db";
    const dbUser = await question("Database User (default: finances_user): ") || "finances_user";
    const dbPass = await question("Database Password: ");
    const dbHost = await question("Database Host (default: localhost): ") || "localhost";
    const dbPort = await question("Database Port (default: 5432): ") || "5432";

    // 2. App Configuration
    console.log("\n--- App Configuration ---");
    const port = await question("App Port (default: 3001): ") || "3001";
    const jwtSecret = await question("JWT Secret (leave empty to generate random): ") || crypto.randomBytes(32).toString('hex');
    const frontendUrl = await question("Frontend URL (e.g., https://finances.tbelt.online): ");

    // 3. Email Configuration (Resend)
    console.log("\n--- Email Configuration (Resend) ---");
    const resendApiKey = await question("Resend API Key (re_...): ");
    const fromEmail = await question("From Email (e.g., noreply@finances.tbelt.online): ");

    // 4. Generate .env
    const envContent = `PORT=${port}
DB_NAME=${dbName}
DB_USER=${dbUser}
DB_PASS=${dbPass}
DB_HOST=${dbHost}
DB_PORT=${dbPort}
JWT_SECRET=${jwtSecret}
RESEND_API_KEY=${resendApiKey}
FROM_EMAIL=${fromEmail}
FRONTEND_URL=${frontendUrl}
`;

    const envPath = path.join(__dirname, 'server', '.env');
    fs.writeFileSync(envPath, envContent);
    console.log(`\n[✓] .env file generated at ${envPath}`);

    // 5. Initialize Database
    console.log("\n--- Initializing Database ---");
    const sequelize = new Sequelize(dbName, dbUser, dbPass, {
        host: dbHost,
        port: dbPort,
        dialect: 'postgres',
        logging: false
    });

    try {
        await sequelize.authenticate();
        console.log("[✓] Database connection successful.");

        // Import models to sync
        // Note: We need to require models here. Assuming standard structure.
        // We might need to adjust paths if running from root vs server dir.
        // Let's assume we run this from root.

        // Define User model inline to avoid path issues or complex requires if dependencies are missing
        // But better to try requiring the actual model if possible.
        // Since we are in root, and server is in ./server

        // Let's try to sync using the existing db config logic if possible, but we just overwrote .env
        // So we can just use the sequelize instance we just created.

        const { DataTypes } = require('sequelize');
        const User = sequelize.define('User', {
            username: { type: DataTypes.STRING, allowNull: false, unique: true },
            email: { type: DataTypes.STRING, allowNull: true, unique: true },
            password: { type: DataTypes.STRING, allowNull: false },
            emailVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
            emailVerificationToken: { type: DataTypes.STRING, allowNull: true },
            resetPasswordToken: { type: DataTypes.STRING, allowNull: true },
            resetPasswordExpires: { type: DataTypes.DATE, allowNull: true },
            twoFactorSecret: { type: DataTypes.STRING, allowNull: true },
            isTwoFactorEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
            hasCompletedOnboarding: { type: DataTypes.BOOLEAN, defaultValue: false }
        });

        // Also define Expense and Category to ensure tables exist
        const Category = sequelize.define('Category', {
            id: { type: DataTypes.STRING, primaryKey: true },
            name: { type: DataTypes.STRING, allowNull: false },
            color: { type: DataTypes.STRING, defaultValue: 'slate' },
            userId: { type: DataTypes.INTEGER, allowNull: false }
        });

        const Expense = sequelize.define('Expense', {
            name: { type: DataTypes.STRING, allowNull: false },
            amount: { type: DataTypes.FLOAT, allowNull: false },
            type: { type: DataTypes.ENUM('Fijo', 'Variable'), defaultValue: 'Variable' },
            categoryId: { type: DataTypes.STRING, allowNull: true },
            month: { type: DataTypes.STRING, allowNull: false },
            date: { type: DataTypes.STRING, allowNull: true },
            paid: { type: DataTypes.FLOAT, defaultValue: 0 },
            userId: { type: DataTypes.INTEGER, allowNull: false }
        });

        await sequelize.sync({ alter: true });
        console.log("[✓] Database models synced.");

        // 6. Create Admin User
        console.log("\n--- Create Admin User ---");
        const createAdmin = await question("Do you want to create a new user? (y/n): ");
        if (createAdmin.toLowerCase() === 'y') {
            const username = await question("Username: ");
            const email = await question("Email: ");
            const password = await question("Password: ");

            const hashedPassword = await bcrypt.hash(password, 10);
            const emailVerificationToken = crypto.randomBytes(32).toString('hex');

            try {
                await User.create({
                    username,
                    email,
                    password: hashedPassword,
                    emailVerified: true, // Auto-verify admin created via wizard
                    emailVerificationToken: null,
                    hasCompletedOnboarding: false
                });
                console.log(`[✓] User ${username} created successfully!`);
            } catch (error) {
                console.error("Error creating user:", error.message);
            }
        }

    } catch (error) {
        console.error("[X] Database error:", error.message);
    } finally {
        await sequelize.close();
        rl.close();
        console.log("\nSetup complete! You can now run 'npm run dev' or 'npm start'.");
    }
}

main();
