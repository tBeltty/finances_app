const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Loan = sequelize.define('Loan', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    householdId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    personName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('lent', 'borrowed'),
        allowNull: false // 'lent' = presté, 'borrowed' = me prestaron
    },
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('active', 'paid', 'overdue', 'forgiven'),
        defaultValue: 'active'
    },
    installments: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: false
    },
    interestRate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
        allowNull: false
    },
    interestType: {
        type: DataTypes.ENUM('simple', 'effective_annual'),
        defaultValue: 'simple',
        allowNull: false
    },
    paymentFrequency: {
        type: DataTypes.ENUM('monthly', 'biweekly', 'weekly'),
        defaultValue: 'monthly',
        allowNull: false
    },
    // Bank Credit specific fields
    isBankCredit: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    monthlyInsurance: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        allowNull: false
    },
    monthlyCommission: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        allowNull: false
    },
    lateInterestRate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
        allowNull: false
    },
    currentInstallment: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    remainingBalance: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true // If null, calculated from amount - payments
    }
}, {
    tableName: 'Loans',
    timestamps: true
});

const LoanPayment = sequelize.define('LoanPayment', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    loanId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Loans',
            key: 'id'
        }
    },
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    notes: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'LoanPayments',
    timestamps: true
});

// Associations
Loan.hasMany(LoanPayment, { foreignKey: 'loanId', as: 'payments' });
LoanPayment.belongsTo(Loan, { foreignKey: 'loanId' });

module.exports = { Loan, LoanPayment };
