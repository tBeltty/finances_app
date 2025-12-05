const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { sequelize } = require('./config/db');
const authController = require('./controllers/authController');
const householdController = require('./controllers/householdController');
const financeController = require('./controllers/financeController');
const authMiddleware = require('./middleware/authMiddleware');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());
// Models & Associations
const User = require('./models/User');
const { Category, Expense } = require('./models/Finance');
const Household = require('./models/Household');
const HouseholdMember = require('./models/HouseholdMember');
const Savings = require('./models/Savings');
const HouseholdInvite = require('./models/HouseholdInvite');

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

// Auth Routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/verify-email/:token', authController.verifyEmail);
app.post('/api/auth/forgot-password', authController.forgotPassword);
app.post('/api/auth/reset-password/:token', authController.resetPassword);
app.post('/api/auth/resend-verification', authController.resendVerification);

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
app.delete('/api/auth/me', authMiddleware, authController.deleteAccount);

const householdMiddleware = require('./middleware/householdMiddleware');

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

const PORT = process.env.PORT || 3001;

sequelize.sync({ alter: true }).then(() => {
    console.log('Database connected!');
    console.log('Models synced!');
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(err => console.log(err));
