const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
const { sequelize } = require('./config/db');
const authController = require('./controllers/authController');
const householdController = require('./controllers/householdController');
const financeController = require('./controllers/financeController');
const authMiddleware = require('./middleware/authMiddleware');
const householdMiddleware = require('./middleware/householdMiddleware');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            // IMPORTANT: If you add external scripts (e.g. Analytics, Stripe), add them here!
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            // data: required for 2FA QR codes and some images
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "data:"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    crossOriginEmbedderPolicy: false
}));

// CORS - Restrict to allowed origins
const allowedOrigins = [
    'https://finances.tbelt.online',
    'https://vano.tbelt.online', // Admin Dashboard
    'http://localhost:5173', // Dev frontend
    'http://localhost:5174', // Dev Admin frontend
    'http://localhost:3002'  // Dev backend
];
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('CORS not allowed'), false);
    },
    credentials: true
}));

app.use(express.json());

// Custom Security Middleware
const sanitizer = require('./middleware/sanitizer');
const globalLimiter = require('./middleware/globalRateLimiter');

// Apply Global Rate Limiter (Auto-Cloudflare Trigger)
app.post('/api/loans', authMiddleware, householdMiddleware, financeController.createLoan);
app.put('/api/loans/:id', authMiddleware, householdMiddleware, financeController.updateLoan);
app.delete('/api/loans/:id', authMiddleware, householdMiddleware, financeController.deleteLoan);
app.post('/api/loans/:id/payments', authMiddleware, householdMiddleware, financeController.addLoanPayment);

// Models & Associations
const User = require('./models/User');
const { Category, Expense } = require('./models/Finance');
const Household = require('./models/Household');
const HouseholdMember = require('./models/HouseholdMember');
const Savings = require('./models/Savings');
const HouseholdInvite = require('./models/HouseholdInvite');
const Income = require('./models/Income');
const { Loan, LoanPayment } = require('./models/Loan');
const AuditLog = require('./models/AuditLog');
const Notification = require('./models/Notification');
const Translation = require('./models/Translation');

// User <-> Household
User.belongsToMany(Household, { through: HouseholdMember, foreignKey: 'userId' });
Household.belongsToMany(User, { through: HouseholdMember, foreignKey: 'householdId' });
User.hasMany(HouseholdMember, { foreignKey: 'userId' });
HouseholdMember.belongsTo(User, { foreignKey: 'userId' });
Household.hasMany(HouseholdMember, { foreignKey: 'householdId' });
HouseholdMember.belongsTo(Household, { foreignKey: 'householdId' });

// Household <-> Finance
Household.hasMany(Expense, { foreignKey: 'householdId' });
Expense.belongsTo(Household, { foreignKey: 'householdId' });
Household.hasMany(Category, { foreignKey: 'householdId' });
Category.belongsTo(Household, { foreignKey: 'householdId' });

// Household <-> Savings
Household.hasOne(Savings, { foreignKey: 'householdId' });
Savings.belongsTo(Household, { foreignKey: 'householdId' });

// Household <-> HouseholdInvite
Household.hasMany(HouseholdInvite, { foreignKey: 'householdId' });
HouseholdInvite.belongsTo(Household, { foreignKey: 'householdId' });

// Household <-> Income
Household.hasMany(Income, { foreignKey: 'householdId' });
Income.belongsTo(Household, { foreignKey: 'householdId' });

// Loan <-> Household
Household.hasMany(Loan, { foreignKey: 'householdId' });
Loan.belongsTo(Household, { foreignKey: 'householdId' });

// AuditLog Associations
AuditLog.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(AuditLog, { foreignKey: 'userId' });

// Auth Routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/verify-email/:token', authController.verifyEmail);
app.post('/api/auth/forgot-password', authController.forgotPassword);
app.post('/api/auth/reset-password/:token', authController.resetPassword);
app.post('/api/auth/resend-verification', authController.resendVerification);
app.post('/api/auth/validate-email', authController.validateEmailEndpoint);

const notificationRoutes = require('./routes/notificationRoutes');
const translationRoutes = require('./routes/translationRoutes');
app.use('/api/notifications', notificationRoutes);
app.use('/api/translations', translationRoutes);

app.use(express.static(path.join(__dirname, '../dist')));

// 2FA Routes
app.post('/api/auth/2fa/enable', authMiddleware, authController.generate2FA);
app.post('/api/auth/2fa/verify', authMiddleware, authController.verify2FA);
app.post('/api/auth/2fa/disable', authMiddleware, authController.disable2FA);

app.get('/api/auth/me', authMiddleware, authController.getMe);
app.post('/api/auth/onboarding/complete', authMiddleware, authController.completeOnboarding);
app.put('/api/auth/income', authMiddleware, authController.updateIncome);
app.put('/api/auth/update-income', authMiddleware, authController.updateIncome); // Alias
app.put('/api/auth/currency', authMiddleware, authController.updateCurrency);
app.put('/api/auth/update-currency', authMiddleware, authController.updateCurrency); // Alias
app.put('/api/auth/update-language', authMiddleware, authController.updateLanguage);
app.put('/api/auth/update-theme', authMiddleware, authController.updateTheme);
app.put('/api/auth/loan-settings', authMiddleware, authController.updateLoanSettings);
app.delete('/api/auth/me', authMiddleware, authController.deleteAccount);



// Household Routes
app.post('/api/households/invite', authMiddleware, householdController.createInvite);
app.post('/api/households/join', authMiddleware, householdController.joinHousehold);
app.get('/api/households/members', authMiddleware, householdController.getMembers);
app.put('/api/households/rename', authMiddleware, householdMiddleware, householdController.renameHousehold);
app.put('/api/households/settings', authMiddleware, householdMiddleware, householdController.updateSettings);
app.get('/api/households/current', authMiddleware, householdController.getHousehold);

// Finance Routes
app.get('/api/expenses', authMiddleware, householdMiddleware, financeController.getExpenses);
app.post('/api/expenses', authMiddleware, householdMiddleware, financeController.createExpense);
app.put('/api/expenses/:id', authMiddleware, householdMiddleware, financeController.updateExpense);
app.delete('/api/expenses/:id', authMiddleware, householdMiddleware, financeController.deleteExpense);
app.post('/api/expenses/rollover', authMiddleware, householdMiddleware, financeController.rolloverExpenses);
app.get('/api/expenses/export', authMiddleware, householdMiddleware, financeController.exportExpenses);

app.get('/api/categories', authMiddleware, householdMiddleware, financeController.getCategories);
app.post('/api/categories', authMiddleware, householdMiddleware, financeController.createCategory);
app.put('/api/categories/:id', authMiddleware, householdMiddleware, financeController.updateCategory);
app.delete('/api/categories/:id', authMiddleware, householdMiddleware, financeController.deleteCategory);

app.get('/api/savings', authMiddleware, householdMiddleware, financeController.getSavings);
app.post('/api/savings', authMiddleware, householdMiddleware, financeController.updateSavings);

// Income Routes
app.get('/api/incomes', authMiddleware, householdMiddleware, financeController.getIncomes);
app.post('/api/incomes', authMiddleware, householdMiddleware, financeController.createIncome);
app.put('/api/incomes/:id', authMiddleware, householdMiddleware, financeController.updateIncome);
app.delete('/api/incomes/:id', authMiddleware, householdMiddleware, financeController.deleteIncome);

// Admin Routes
const adminController = require('./controllers/adminController');
const adminMonitor = require('./controllers/adminMonitor');
const adminMiddleware = require('./middleware/adminMiddleware');

app.get('/api/admin/system-health', authMiddleware, adminMiddleware, adminMonitor.getSystemHealth);
app.get('/api/admin/stats', authMiddleware, adminMiddleware, adminController.getStats);
app.get('/api/admin/analytics', authMiddleware, adminMiddleware, adminController.getAnalytics);
app.get('/api/admin/users', authMiddleware, adminMiddleware, adminController.getUsers);
app.get('/api/admin/audit-logs', authMiddleware, adminMiddleware, adminController.getAuditLogs);
app.get('/api/admin/users/:id', authMiddleware, adminMiddleware, adminController.getUserDetails);
app.post('/api/admin/users/bulk-action', authMiddleware, adminMiddleware, adminController.bulkDelete);
app.post('/api/admin/users/:id/restore', authMiddleware, adminMiddleware, adminController.restoreUser);
app.put('/api/admin/users/:id/status', authMiddleware, adminMiddleware, adminController.updateUserStatus);
app.put('/api/admin/users/:id/promote', authMiddleware, adminMiddleware, adminController.promoteUser);
app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, adminController.deleteUser);



// Backup Status Route (public - for backup notification)
const fs = require('fs');
app.get('/api/system/backup-status', (req, res) => {
    const statusFile = '/tmp/finances_backup_status.json';
    try {
        if (fs.existsSync(statusFile)) {
            const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
            // Only show notification if backup is in progress
            if (status.status === 'in_progress') {
                return res.json({ inProgress: true, message: status.message });
            }
        }
        res.json({ inProgress: false });
    } catch (err) {
        res.json({ inProgress: false });
    }
});

const PORT = process.env.PORT || 3001;
const cronService = require('./services/cronService');

sequelize.sync({ alter: true }).then(() => {
    console.log('Database connected!');
    console.log('Models synced!');
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);

        // Run cleanup and reminders on startup
        cronService.cleanupUnverifiedUsers();
        cronService.checkLoanReminders();

        // Schedule jobs every 24 hours
        setInterval(() => {
            cronService.cleanupUnverifiedUsers();
            cronService.checkLoanReminders();
        }, 24 * 60 * 60 * 1000);
    });
}).catch(err => console.log(err));

