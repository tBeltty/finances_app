const { Expense, Category } = require('../models/Finance');
const Savings = require('../models/Savings');
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
