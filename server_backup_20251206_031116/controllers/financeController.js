const { Expense, Category } = require('../models/Finance');
const Savings = require('../models/Savings');
const Income = require('../models/Income');
const { Loan, LoanPayment } = require('../models/Loan');
const { Parser } = require('json2csv');

exports.getExpenses = async (req, res) => {
    try {
        const { month } = req.query;
        const expenses = await Expense.findAll({
            where: {
                householdId: req.householdId,
                month
            },
            order: [['date', 'DESC']]
        });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSavings = async (req, res) => {
    try {
        let savings = await Savings.findOne({ where: { householdId: req.householdId } });
        if (!savings) {
            savings = await Savings.create({ householdId: req.householdId, balance: 0 });
        }
        res.json(savings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateSavings = async (req, res) => {
    try {
        const { amount, operation } = req.body; // operation: 'add' or 'subtract'
        let savings = await Savings.findOne({ where: { householdId: req.householdId } });

        if (!savings) {
            savings = await Savings.create({ householdId: req.householdId, balance: 0 });
        }

        const val = parseFloat(amount);
        if (isNaN(val)) return res.status(400).json({ message: 'Invalid amount' });

        if (operation === 'add') {
            savings.balance += val;
        } else if (operation === 'subtract') {
            savings.balance -= val;
        } else if (operation === 'set') {
            savings.balance = val;
        } else {
            // Direct set if needed, or error
            return res.status(400).json({ message: 'Invalid operation' });
        }

        savings.lastUpdated = new Date();
        await savings.save();
        res.json(savings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createExpense = async (req, res) => {
    try {
        const { name, amount, type, categoryId, month, date, payWithSavings } = req.body;

        const expense = await Expense.create({
            name,
            amount,
            type,
            categoryId,
            month,
            date,
            userId: req.user.id,
            householdId: req.householdId,
            paid: req.body.paid !== undefined ? req.body.paid : (payWithSavings ? amount : 0),
            isPaidWithSavings: payWithSavings || false
        });

        if (payWithSavings) {
            let savings = await Savings.findOne({ where: { householdId: req.householdId } });
            if (savings) {
                savings.balance -= parseFloat(amount);
                savings.lastUpdated = new Date();
                await savings.save();
            }
        }

        res.status(201).json(expense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const { paid, name, amount, type, categoryId, date } = req.body;
        // Verify expense belongs to household
        const expense = await Expense.findOne({
            where: {
                id,
                householdId: req.householdId
            }
        });

        if (!expense) return res.status(404).json({ message: 'Expense not found' });

        if (paid !== undefined) expense.paid = paid;
        if (name) expense.name = name;
        if (amount) expense.amount = amount;
        if (type) expense.type = type;
        if (categoryId) expense.categoryId = categoryId;
        if (date) expense.date = date;

        await expense.save();
        res.json(expense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const expense = await Expense.findOne({
            where: {
                id,
                householdId: req.householdId
            }
        });

        if (!expense) return res.status(404).json({ message: 'Expense not found' });

        // Restore savings if it was paid with savings
        if (expense.isPaidWithSavings) {
            let savings = await Savings.findOne({ where: { householdId: req.householdId } });
            if (savings) {
                savings.balance += parseFloat(expense.amount);
                savings.lastUpdated = new Date();
                await savings.save();
            }
        }

        await expense.destroy();
        res.json({ message: 'Expense deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({
            where: { householdId: req.householdId }
        });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name, color } = req.body;
        const id = `cat_${Date.now()}`;
        const category = await Category.create({
            id,
            name,
            color,
            userId: req.user.id,
            householdId: req.householdId
        });
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, color } = req.body;
        const category = await Category.findOne({
            where: {
                id,
                householdId: req.householdId
            }
        });

        if (!category) return res.status(404).json({ message: 'Category not found' });

        if (name) category.name = name;
        if (color) category.color = color;

        await category.save();
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        // Delete expenses first (cascade)
        await Expense.destroy({
            where: {
                categoryId: id,
                householdId: req.householdId
            }
        });
        // Then delete category
        await Category.destroy({
            where: {
                id,
                householdId: req.householdId
            }
        });
        res.json({ message: 'Category and associated expenses deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.rolloverExpenses = async (req, res) => {
    try {
        const { fromMonth, toMonth } = req.body;
        const userId = req.user.id;
        const householdId = req.householdId;

        const fixedExpenses = await Expense.findAll({
            where: {
                householdId,
                month: fromMonth,
                type: 'Fijo'
            }
        });

        if (fixedExpenses.length === 0) {
            return res.json({ message: 'No fixed expenses to rollover', count: 0 });
        }

        // Default date for rolled over expenses is the 1st of the new month
        const [month, year] = toMonth.split('-');
        const newDate = `${year}-${month}-01`;

        const newExpenses = fixedExpenses.map(exp => ({
            name: exp.name,
            amount: exp.amount,
            type: 'Fijo',
            categoryId: exp.categoryId,
            month: toMonth,
            date: newDate,
            paid: 0,
            userId,
            householdId
        }));

        await Expense.bulkCreate(newExpenses);
        res.json({ message: 'Expenses rolled over', count: newExpenses.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.exportExpenses = async (req, res) => {
    try {
        const { month } = req.query;
        const expenses = await Expense.findAll({
            where: {
                householdId: req.householdId,
                month
            }
        });

        const fields = ['date', 'name', 'amount', 'type', 'categoryId', 'paid', 'month'];
        const opts = { fields };
        const parser = new Parser(opts);
        const csv = parser.parse(expenses);

        res.header('Content-Type', 'text/csv');
        res.attachment(`expenses-${month}.csv`);
        return res.send(csv);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ============ INCOME FUNCTIONS ============

exports.getIncomes = async (req, res) => {
    try {
        const { month } = req.query; // Format: "MM-YYYY"
        const [mm, yyyy] = month.split('-');
        const startDate = `${yyyy}-${mm}-01`;
        const endDate = new Date(yyyy, parseInt(mm), 0).toISOString().split('T')[0];

        const incomes = await Income.findAll({
            where: {
                householdId: req.householdId,
                date: {
                    [require('sequelize').Op.between]: [startDate, endDate]
                }
            },
            order: [['date', 'DESC']]
        });
        res.json(incomes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createIncome = async (req, res) => {
    try {
        const { description, amount, date, type, category } = req.body;
        const income = await Income.create({
            householdId: req.householdId,
            description,
            amount,
            date: date || new Date(),
            type: type || 'extra',
            category
        });
        res.status(201).json(income);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateIncome = async (req, res) => {
    try {
        const { id } = req.params;
        const income = await Income.findOne({
            where: { id, householdId: req.householdId }
        });
        if (!income) return res.status(404).json({ message: 'Income not found' });

        const { description, amount, date, category } = req.body;
        if (description) income.description = description;
        if (amount) income.amount = amount;
        if (date) income.date = date;
        if (category) income.category = category;

        await income.save();
        res.json(income);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteIncome = async (req, res) => {
    try {
        const { id } = req.params;
        const income = await Income.findOne({
            where: { id, householdId: req.householdId }
        });
        if (!income) return res.status(404).json({ message: 'Income not found' });

        await income.destroy();
        res.json({ message: 'Income deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ============ LOAN FUNCTIONS ============

exports.getLoans = async (req, res) => {
    try {
        const { type } = req.query; // 'lent' or 'borrowed' or undefined for all
        const where = { householdId: req.householdId };
        if (type) where.type = type;

        const loans = await Loan.findAll({
            where,
            include: [{ model: LoanPayment, as: 'payments' }],
            order: [['createdAt', 'DESC']]
        });
        res.json(loans);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createLoan = async (req, res) => {
    try {
        const { personName, type, amount, date, dueDate, notes, installments, interestRate, paymentFrequency } = req.body;
        const loan = await Loan.create({
            householdId: req.householdId,
            personName,
            type, // 'lent' or 'borrowed'
            amount,
            date: date || new Date(),
            dueDate,
            notes,
            installments: installments || 1,
            interestRate: interestRate || 0,
            interestType: req.body.interestType || 'simple',
            paymentFrequency: paymentFrequency || 'monthly'
        });
        res.status(201).json(loan);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateLoan = async (req, res) => {
    try {
        const { id } = req.params;
        const loan = await Loan.findOne({
            where: { id, householdId: req.householdId }
        });
        if (!loan) return res.status(404).json({ message: 'Loan not found' });

        const { personName, amount, dueDate, notes, status, installments, interestRate, paymentFrequency } = req.body;
        if (personName) loan.personName = personName;
        if (amount) loan.amount = amount;
        if (dueDate !== undefined) loan.dueDate = dueDate;
        if (notes !== undefined) loan.notes = notes;
        if (status) loan.status = status;
        if (installments) loan.installments = installments;
        if (interestRate !== undefined) loan.interestRate = interestRate;
        if (req.body.interestType) loan.interestType = req.body.interestType;
        if (paymentFrequency) loan.paymentFrequency = paymentFrequency;

        await loan.save();
        res.json(loan);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteLoan = async (req, res) => {
    try {
        const { id } = req.params;
        const loan = await Loan.findOne({
            where: { id, householdId: req.householdId }
        });
        if (!loan) return res.status(404).json({ message: 'Loan not found' });

        // Delete payments first
        await LoanPayment.destroy({ where: { loanId: id } });
        await loan.destroy();
        res.json({ message: 'Loan deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addLoanPayment = async (req, res) => {
    try {
        const { id } = req.params; // loan id
        const { amount, date, notes, destination } = req.body; // destination: 'income', 'savings', 'none'

        // Verify loan belongs to household
        const loan = await Loan.findOne({
            where: { id, householdId: req.householdId }
        });
        if (!loan) return res.status(404).json({ message: 'Loan not found' });

        const payment = await LoanPayment.create({
            loanId: id,
            amount,
            date: date || new Date(),
            notes
        });

        // Handle Destination Logic (Only for 'lent' loans usually, but logic holds for any money coming in)
        if (loan.type === 'lent') {
            if (destination === 'income') {
                await Income.create({
                    householdId: req.householdId,
                    description: `Pago de préstamo: ${loan.personName}`,
                    amount: amount,
                    date: date || new Date(),
                    type: 'extra',
                    category: 'Préstamo'
                });
            } else if (destination === 'savings') {
                let savings = await Savings.findOne({ where: { householdId: req.householdId } });
                if (!savings) {
                    savings = await Savings.create({ householdId: req.householdId, balance: 0 });
                }
                savings.balance += parseFloat(amount);
                savings.lastUpdated = new Date();
                await savings.save();
            }
        } else if (loan.type === 'borrowed') {
            // Handle Source Logic for paying back a loan
            const { source } = req.body; // 'savings', 'expense', 'none'

            if (source === 'expense') {
                // Find or create 'Deudas' category
                let category = await Category.findOne({
                    where: {
                        householdId: req.householdId,
                        name: 'Deudas'
                    }
                });

                if (!category) {
                    category = await Category.create({
                        id: `cat_${Date.now()}`,
                        name: 'Deudas',
                        color: '#ef4444', // Red color
                        userId: req.user.id,
                        householdId: req.householdId
                    });
                }

                await Expense.create({
                    name: `Pago de préstamo: ${loan.personName}`,
                    amount: amount,
                    type: 'Variable',
                    categoryId: category.id,
                    month: new Date(date || new Date()).toISOString().slice(0, 7), // YYYY-MM
                    date: date || new Date(),
                    userId: req.user.id,
                    householdId: req.householdId,
                    paid: amount
                });
            } else if (source === 'savings') {
                let savings = await Savings.findOne({ where: { householdId: req.householdId } });
                if (savings) {
                    savings.balance -= parseFloat(amount);
                    savings.lastUpdated = new Date();
                    await savings.save();
                }
            }
        }

        // Check if fully paid
        const allPayments = await LoanPayment.findAll({ where: { loanId: id } });
        const totalPaid = allPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

        // Calculate total with interest for accurate status
        const principal = parseFloat(loan.amount);
        const rate = parseFloat(loan.interestRate || 0);
        let totalToPay = 0;

        if (loan.interestType === 'effective_annual' && loan.installments > 1) {
            // Effective Annual Rate calculation
            // Convert Annual Rate to Monthly Rate: r = (1 + EA)^(1/12) - 1
            const annualRateDecimal = rate / 100;
            const monthlyRate = Math.pow(1 + annualRateDecimal, 1 / 12) - 1;

            // PMT Formula: P * (r * (1 + r)^n) / ((1 + r)^n - 1)
            const pmt = principal * (monthlyRate * Math.pow(1 + monthlyRate, loan.installments)) / (Math.pow(1 + monthlyRate, loan.installments) - 1);

            totalToPay = pmt * loan.installments;
        } else {
            // Simple Interest: Principal + (Principal * Rate%)
            const interest = principal * (rate / 100);
            totalToPay = principal + interest;
        }

        if (totalPaid >= totalToPay - 0.01) { // Small epsilon for float comparison
            loan.status = 'paid';
            await loan.save();
        } else if (loan.status === 'paid' && totalPaid < totalToPay) {
            // Re-open if payment was deleted or amount changed (though this is addPayment, good to be safe)
            loan.status = 'active';
            await loan.save();
        }

        res.status(201).json(payment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
