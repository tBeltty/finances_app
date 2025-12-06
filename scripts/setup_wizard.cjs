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

// Translations
const translations = {
    en: {
        title: "   Finances App - Setup Wizard",
        dbConfig: "--- Database Configuration ---",
        dbName: "Database Name (default: finances_db): ",
        dbUser: "Database User (default: finances_user): ",
        dbPass: "Database Password: ",
        dbHost: "Database Host (default: localhost): ",
        dbPort: "Database Port (default: 5432): ",
        appConfig: "\n--- App Configuration ---",
        appPort: "App Port (default: 3001): ",
        jwtSecret: "JWT Secret (leave empty to generate random): ",
        frontendUrl: "Frontend URL (e.g., https://finances.tbelt.online): ",
        emailConfig: "\n--- Email Configuration (Resend) ---",
        resendApiKey: "Resend API Key (re_...): ",
        fromEmail: "From Email (e.g., noreply@finances.tbelt.online): ",
        envGenerated: "\n[✓] .env file generated at",
        initDb: "\n--- Initializing Database ---",
        dbSuccess: "[✓] Database connection successful.",
        installingDeps: "\n📦 Installing dependencies...",
        installingRoot: "   - Root...",
        installingServer: "   - Server (Backend)...",
        installingClient: "   - Client (Frontend)...",
        depsInstalled: "✅ Dependencies installed.",
        depsError: "❌ Error installing dependencies:",
        modelsSynced: "[✓] Database models synced.",
        createAdminTitle: "\n--- Create Admin User ---",
        createAdminPrompt: "Do you want to create a new user? (y/n): ",
        username: "Username: ",
        email: "Email: ",
        password: "Password: ",
        userCreated: "[✓] User created successfully!",
        userError: "Error creating user:",
        dbError: "[X] Database error:",
        complete: "\nSetup complete! You can now run 'npm run dev' or 'npm start'."
    },
    es: {
        title: "   Finances App - Asistente de Configuración",
        dbConfig: "--- Configuración de Base de Datos ---",
        dbName: "Nombre de la BD (defecto: finances_db): ",
        dbUser: "Usuario de la BD (defecto: finances_user): ",
        dbPass: "Contraseña de la BD: ",
        dbHost: "Host de la BD (defecto: localhost): ",
        dbPort: "Puerto de la BD (defecto: 5432): ",
        appConfig: "\n--- Configuración de la App ---",
        appPort: "Puerto de la App (defecto: 3001): ",
        jwtSecret: "Secreto JWT (dejar vacío para generar aleatorio): ",
        frontendUrl: "URL del Frontend (ej., https://finances.tbelt.online): ",
        emailConfig: "\n--- Configuración de Email (Resend) ---",
        resendApiKey: "API Key de Resend (re_...): ",
        fromEmail: "Email Remitente (ej., noreply@finances.tbelt.online): ",
        envGenerated: "\n[✓] Archivo .env generado en",
        initDb: "\n--- Inicializando Base de Datos ---",
        dbSuccess: "[✓] Conexión a la base de datos exitosa.",
        installingDeps: "\n📦 Instalando dependencias...",
        installingRoot: "   - Raíz...",
        installingServer: "   - Servidor (Backend)...",
        installingClient: "   - Cliente (Frontend)...",
        depsInstalled: "✅ Dependencias instaladas.",
        depsError: "❌ Error instalando dependencias:",
        modelsSynced: "[✓] Modelos de base de datos sincronizados.",
        createAdminTitle: "\n--- Crear Usuario Administrador ---",
        createAdminPrompt: "¿Deseas crear un nuevo usuario? (s/n): ",
        username: "Usuario: ",
        email: "Email: ",
        password: "Contraseña: ",
        userCreated: "[✓] Usuario creado exitosamente!",
        userError: "Error creando usuario:",
        dbError: "[X] Error de base de datos:",
        complete: "\n¡Configuración completa! Ahora puedes ejecutar 'npm run dev' o 'npm start'."
    }
};

let lang = 'en'; // Default
const t = (key) => translations[lang][key] || key;

async function main() {
    console.log("==========================================");

    // Language Selection
    const langChoice = await question("Select Language / Seleccione Idioma (en/es) [default: en]: ");
    lang = (langChoice.toLowerCase().trim() === 'es') ? 'es' : 'en';

    console.log(t('title'));
    console.log("==========================================\n");

    // 1. Database Configuration
    console.log(t('dbConfig'));
    const dbName = await question(t('dbName')) || "finances_db";
    const dbUser = await question(t('dbUser')) || "finances_user";
    const dbPass = await question(t('dbPass'));
    const dbHost = await question(t('dbHost')) || "localhost";
    const dbPort = await question(t('dbPort')) || "5432";

    // 2. App Configuration
    console.log(t('appConfig'));
    const port = await question(t('appPort')) || "3001";
    const jwtSecret = await question(t('jwtSecret')) || crypto.randomBytes(32).toString('hex');
    const frontendUrl = await question(t('frontendUrl'));

    // 3. Email Configuration (Resend)
    console.log(t('emailConfig'));
    const resendApiKey = await question(t('resendApiKey'));
    const fromEmail = await question(t('fromEmail'));

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
    console.log(`${t('envGenerated')} ${envPath}`);

    // 5. Initialize Database
    console.log(t('initDb'));
    const sequelize = new Sequelize(dbName, dbUser, dbPass, {
        host: dbHost,
        port: dbPort,
        dialect: 'postgres',
        logging: false
    });

    try {
        await sequelize.authenticate();
        console.log(t('dbSuccess'));

        console.log(t('installingDeps'));
        try {
            // Install root deps (concurrently)
            console.log(t('installingRoot'));
            const { execSync } = require('child_process');
            execSync('npm install', { stdio: 'inherit' });

            // Install server deps
            console.log(t('installingServer'));
            execSync('cd server && npm install', { stdio: 'inherit' });

            // Install client deps
            console.log(t('installingClient'));
            execSync('cd client && npm install', { stdio: 'inherit' });

            // Install admin_client deps
            console.log("   - Admin Client (Dashboard)...");
            execSync('cd admin_client && npm install', { stdio: 'inherit' });

            console.log(t('depsInstalled'));
        } catch (error) {
            console.error(t('depsError'), error.message);
        }

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
            hasCompletedOnboarding: { type: DataTypes.BOOLEAN, defaultValue: false },
            language: { type: DataTypes.STRING, defaultValue: 'en' }
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
        console.log(t('modelsSynced'));

        // 6. Create Admin User
        console.log(t('createAdminTitle'));
        const createAdmin = await question(t('createAdminPrompt'));
        if (createAdmin.toLowerCase() === 'y' || createAdmin.toLowerCase() === 's') {
            const username = await question(t('username'));
            const email = await question(t('email'));
            const password = await question(t('password'));

            const hashedPassword = await bcrypt.hash(password, 10);
            const emailVerificationToken = crypto.randomBytes(32).toString('hex');

            try {
                await User.create({
                    username,
                    email,
                    password: hashedPassword,
                    emailVerified: true, // Auto-verify admin created via wizard
                    emailVerificationToken: null,
                    hasCompletedOnboarding: false,
                    language: lang // Set language based on wizard selection
                });
                console.log(`${t('userCreated').replace('User', username)}`);
            } catch (error) {
                console.error(t('userError'), error.message);
            }
        }

    } catch (error) {
        console.error(t('dbError'), error.message);
    } finally {
        await sequelize.close();
        rl.close();
        console.log(t('complete'));
    }
}

main();
