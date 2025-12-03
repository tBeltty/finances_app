import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../db';

export default function useFinances() {
    const { user } = useAuth();
    const [income, setIncome] = useState(0);

    const [categories, setCategories] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
    });

    // UI State
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [newExpense, setNewExpense] = useState({
        name: '',
        amount: '',
        type: 'Variable',
        categoryId: '',
        date: new Date().toISOString().split('T')[0],
        isPaid: false
    });
    const [loading, setLoading] = useState(true);
    const [filterMode, setFilterMode] = useState('month'); // 'month' | 'day'
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const activeHouseholdId = useMemo(() => {
        if (user?.Households?.length > 0) {
            // For now, default to the first household or the one marked as default
            const defaultHousehold = user.Households.find(h => h.HouseholdMember.isDefault);
            return defaultHousehold ? defaultHousehold.id : user.Households[0].id;
        }
        return null;
    }, [user]);

    const [sortMode, setSortMode] = useState('date'); // 'date', 'amount_desc', 'amount_asc'
    const [savings, setSavings] = useState(null);
    const [household, setHousehold] = useState(null);
    const [loadingSavings, setLoadingSavings] = useState(true);

    const fetchSavings = async () => {
        if (!user || !activeHouseholdId) return;
        setLoadingSavings(true);
        try {
            const res = await fetch('/api/savings', {
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'X-Household-Id': activeHouseholdId
                }
            });
            if (res.ok) {
                const data = await res.json();
                setSavings(data);
            }
        } catch (error) {
            console.error("Error fetching savings:", error);
        } finally {
            setLoadingSavings(false);
        }
    };

    const updateSavings = async (amount, operation) => {
        if (!activeHouseholdId) return false;
        try {
            const res = await fetch('/api/savings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                    'X-Household-Id': activeHouseholdId
                },
                body: JSON.stringify({ amount, operation })
            });
            if (res.ok) {
                const data = await res.json();
                setSavings(data);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error updating savings:", error);
            return false;
        }
    };

    useEffect(() => {
        if (user && activeHouseholdId) {
            fetchSavings();
        }
    }, [user, activeHouseholdId]);

    useEffect(() => {
        if (user?.token && activeHouseholdId) {
            console.log("useFinances: Fetching data for", selectedMonth, "Household:", activeHouseholdId);
            console.log("useFinances: User Currency:", user.currency);

            // Set income from user profile
            if (user.monthlyIncome !== undefined && user.monthlyIncome !== null) {
                setIncome(Number(user.monthlyIncome));
            }
            fetchData();
        } else {
            console.log("useFinances: Skipping fetch. User:", !!user, "Household:", activeHouseholdId);
        }
    }, [user, selectedMonth, activeHouseholdId]);

    // Derived State
    const filteredExpenses = useMemo(() => {
        let filtered = expenses;

        if (filterMode === 'day') {
            filtered = expenses.filter(e => e.date === selectedDate);
        }

        if (sortMode === 'amount_desc') {
            return [...filtered].sort((a, b) => b.amount - a.amount);
        } else if (sortMode === 'amount_asc') {
            return [...filtered].sort((a, b) => a.amount - b.amount);
        } else {
            // Default date sort (newest first)
            return [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
        }
    }, [expenses, filterMode, selectedDate, sortMode]);

    const totalBudgeted = useMemo(() => {
        return expenses.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
    }, [expenses]);

    const totalPaid = useMemo(() => {
        return expenses.reduce((acc, curr) => acc + (curr.paid || 0), 0);
    }, [expenses]);

    const totalPending = totalBudgeted - totalPaid;

    const currentBalance = income - totalPaid;
    const projectedBalance = income - totalBudgeted;

    const groupedExpenses = useMemo(() => {
        const grouped = {};
        expenses.forEach(expense => {
            const catId = expense.categoryId;
            if (!grouped[catId]) {
                grouped[catId] = {
                    ...categories.find(c => c.id == catId) || { name: 'Sin Categoría', color: 'slate' },
                    total: 0,
                    paid: 0,
                    items: []
                };
            }
            grouped[catId].total += expense.amount;
            grouped[catId].paid += (expense.paid || 0);
            grouped[catId].items.push(expense);
        });
        return Object.values(grouped).sort((a, b) => b.total - a.total);
    }, [expenses, categories]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Load from local DB
            const localCats = await db.categories.where('userId').equals(user.id).toArray();
            // Get all expenses for month, distinguish synced vs unsynced
            const localExps = await db.expenses.where('[month+userId]').equals([selectedMonth, user.id]).toArray();

            if (localCats.length > 0) setCategories(localCats);

            if (localExps.length > 0) {
                // Sanitize local data to remove NaNs
                const sanitizedExps = localExps.map(e => ({
                    ...e,
                    amount: isNaN(Number(e.amount)) ? 0 : Number(e.amount),
                    paid: isNaN(Number(e.paid)) ? 0 : Number(e.paid)
                }));
                setExpenses(sanitizedExps);
            }

            // 2. Fetch from API (Revalidate)
            if (navigator.onLine && activeHouseholdId) {
                const headers = {
                    'Authorization': `Bearer ${user.token}`,
                    'X-Household-Id': activeHouseholdId
                };
                const [catRes, expRes] = await Promise.all([
                    fetch('/api/categories', { headers }),
                    fetch(`/api/expenses?month=${selectedMonth}`, { headers })
                ]);

                if (catRes.ok) {
                    const cats = await catRes.json();
                    setCategories(cats);
                    // Sync local DB: Replace only synced ones or all? Categories are usually global/synced.
                    // For safety, let's just overwrite categories as they are less prone to high-frequency offline edits
                    await db.categories.where('userId').equals(user.id).delete();
                    await db.categories.bulkPut(cats.map(c => ({ ...c, userId: user.id })));
                }

                if (expRes.ok) {
                    const serverExps = await expRes.json();

                    // Sanitize server expenses
                    const sanitizedServerExps = serverExps.map(e => ({
                        ...e,
                        amount: isNaN(Number(e.amount)) ? 0 : Number(e.amount),
                        paid: isNaN(Number(e.paid)) ? 0 : Number(e.paid),
                        userId: user.id,
                        synced: true
                    }));

                    // Identify unsynced local expenses
                    const unsyncedLocal = localExps.filter(e => e.synced === false);

                    // Merge: Server expenses + Unsynced local expenses
                    const mergedExpenses = [
                        ...sanitizedServerExps,
                        ...unsyncedLocal
                    ];

                    setExpenses(mergedExpenses);

                    // Update DB: Delete SYNCED expenses for this month, keep UNSYNCED
                    // This is tricky with Dexie. Easier to bulkPut server ones (overwrite) and keep unsynced.
                    // But we need to remove deleted ones.
                    // Strategy: Delete all SYNCED for this month/user, then add new server ones.

                    await db.expenses
                        .where('[month+userId]')
                        .equals([selectedMonth, user.id])
                        .filter(e => e.synced !== false) // Filter to delete only synced
                        .delete();

                    await db.expenses.bulkPut(serverExps.map(e => ({ ...e, userId: user.id, synced: true })));

                    // Try to sync unsynced items in background (simple retry)
                    if (unsyncedLocal.length > 0) {
                        syncUnsynced(unsyncedLocal, headers);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const syncUnsynced = async (items, headers) => {
        for (const item of items) {
            try {
                // Remove local-only fields before sending
                const { id, synced, userId, ...payload } = item;
                const res = await fetch('/api/expenses', {
                    method: 'POST',
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    const saved = await res.json();
                    // Update local DB to replace temp ID with real ID and set synced=true
                    await db.expenses.delete(id); // Delete temp
                    await db.expenses.put({ ...saved, userId: user.id, synced: true });
                    // Update state
                    setExpenses(prev => prev.map(e => e.id === id ? { ...saved, userId: user.id, synced: true } : e));
                }
            } catch (err) {
                console.error("Background sync failed for item:", item.name, err);
            }
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (!newExpense.name || !newExpense.amount) return;

        const tempId = Date.now(); // Temporary ID for local DB
        const expensePayload = {
            ...newExpense,
            amount: parseFloat(newExpense.amount),
            paid: newExpense.isPaid ? parseFloat(newExpense.amount) : 0,
            month: selectedMonth,
            // Si está pagado, usa la fecha seleccionada o hoy. Si no, null.
            date: newExpense.isPaid ? (newExpense.date || new Date().toISOString().split('T')[0]) : null,
            userId: user.id,
            payWithSavings: newExpense.payWithSavings
        };

        // Optimistic Update: Mark as unsynced
        const optimisticExpense = { ...expensePayload, id: tempId, synced: false };
        setExpenses([...expenses, optimisticExpense]);
        await db.expenses.add(optimisticExpense);

        setNewExpense({
            name: '',
            amount: '',
            type: 'Variable',
            categoryId: '',
            date: new Date().toISOString().split('T')[0],
            isPaid: false,
            payWithSavings: false
        });

        try {
            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                    'X-Household-Id': activeHouseholdId
                },
                body: JSON.stringify(expensePayload)
            });

            if (res.ok) {
                const savedExpense = await res.json();
                // Replace temp ID with real ID in state and DB, mark synced
                setExpenses(prev => prev.map(exp => exp.id === tempId ? { ...savedExpense, synced: true } : exp));
                await db.expenses.delete(tempId);
                await db.expenses.put({ ...savedExpense, userId: user.id, synced: true });

                // If paid with savings, refresh savings balance
                if (expensePayload.payWithSavings) {
                    fetchSavings();
                }
            }
        } catch (error) {
            console.error("Error adding expense:", error);
            // It remains in DB as synced: false, will be picked up by next fetchData sync
        }
    };

    const handleDeleteExpense = async (id) => {
        // Optimistic
        setExpenses(expenses.filter(exp => exp.id !== id));
        await db.expenses.delete(id);

        try {
            await fetch(`/api/expenses/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'X-Household-Id': activeHouseholdId
                }
            });
        } catch (error) {
            console.error("Error deleting expense:", error);
            fetchData(); // Revert
        }
    };

    const updateExpense = async (updatedExpense) => {
        try {
            const res = await fetch(`/api/expenses/${updatedExpense.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                    'X-Household-Id': activeHouseholdId
                },
                body: JSON.stringify(updatedExpense)
            });

            if (res.ok) {
                setExpenses(expenses.map(e => e.id === updatedExpense.id ? { ...e, ...updatedExpense } : e));
            }
        } catch (error) {
            console.error("Error updating expense:", error);
        }
    };

    const handleToggleExpenseType = async (expenseId) => {
        const expense = expenses.find(e => e.id === expenseId);
        if (expense) {
            const newType = expense.type === 'Fijo' ? 'Variable' : 'Fijo';
            await updateExpense({ ...expense, type: newType });
        }
    };

    const handleMarkUnpaid = async (expenseId) => {
        const expense = expenses.find(e => e.id === expenseId);
        if (expense) {
            await updateExpense({ ...expense, paid: 0, date: null });
        }
    };

    const handleUpdatePayment = async (id, amount) => {
        const newPaid = parseFloat(amount);
        const paid = isNaN(newPaid) ? 0 : newPaid;
        const expense = expenses.find(e => e.id === id);

        // Si se está pagando algo y no tenía fecha, poner fecha de hoy
        const updates = { paid };
        if (paid > 0 && !expense.date) {
            updates.date = new Date().toISOString().split('T')[0];
        }

        // Optimistic update
        setExpenses(expenses.map(exp => exp.id === id ? { ...exp, ...updates } : exp));

        try {
            await fetch(`/api/expenses/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                    'X-Household-Id': activeHouseholdId
                },
                body: JSON.stringify(updates)
            });
        } catch (error) {
            console.error("Error updating payment:", error);
            fetchData(); // Revert on error
        }
    };

    const handlePayFull = async (id) => {
        const expense = expenses.find(e => e.id === id);
        if (!expense) return;

        const paid = expense.amount;
        const updates = { paid };

        // Si no tenía fecha, poner fecha de hoy al pagar
        if (!expense.date) {
            updates.date = new Date().toISOString().split('T')[0];
        }

        setExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, ...updates } : exp));

        try {
            await fetch(`/api/expenses/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                    'X-Household-Id': activeHouseholdId
                },
                body: JSON.stringify(updates)
            });
        } catch (error) {
            console.error("Error paying full:", error);
            fetchData();
        }
    };

    const handlePayCategory = async (categoryId) => {
        const categoryExpenses = expenses.filter(e => e.categoryId === categoryId);

        // Optimistic
        setExpenses(prev => prev.map(exp => {
            if (exp.categoryId === categoryId) {
                return { ...exp, paid: exp.amount };
            }
            return exp;
        }));

        try {
            await Promise.all(categoryExpenses.map(exp =>
                fetch(`/api/expenses/${exp.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${user.token}`,
                        'X-Household-Id': activeHouseholdId
                    },
                    body: JSON.stringify({ paid: exp.amount })
                })
            ));
        } catch (error) {
            console.error("Error paying category:", error);
            fetchData();
        }
    };

    const handleAddCategory = async (name) => {
        if (!activeHouseholdId) return;
        try {
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                    'X-Household-Id': activeHouseholdId
                },
                body: JSON.stringify({ name, color: 'slate' })
            });

            if (res.ok) {
                const newCat = await res.json();
                setCategories([...categories, newCat]);
                return newCat;
            }
        } catch (error) {
            console.error("Error adding category:", error);
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!activeHouseholdId) return { success: false, message: 'No household active' };

        // Check for active expenses in this category
        const hasExpenses = expenses.some(e => e.categoryId == id);
        if (hasExpenses) {
            return { success: false, message: 'No se puede eliminar: Hay gastos activos.' };
        }

        if (categories.length <= 1) {
            return { success: false, message: 'Debe quedar al menos una categoría.' };
        }

        try {
            await fetch(`/api/categories/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'X-Household-Id': activeHouseholdId
                }
            });
            setCategories(categories.filter(c => c.id !== id));
            // No need to filter expenses as we ensured there are none
            return { success: true };
        } catch (error) {
            console.error("Error deleting category:", error);
            return { success: false, message: 'Error al eliminar la categoría.' };
        }
    };

    const handleEditCategory = async (updatedCategory) => {
        if (!activeHouseholdId) return;
        try {
            const res = await fetch(`/api/categories/${updatedCategory.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                    'X-Household-Id': activeHouseholdId
                },
                body: JSON.stringify({ name: updatedCategory.name, color: updatedCategory.color })
            });

            if (res.ok) {
                setCategories(categories.map(c => c.id === updatedCategory.id ? updatedCategory : c));
            }
        } catch (error) {
            console.error("Error editing category:", error);
        }
    };

    const handleAddTemplateCategories = async () => {
        if (!activeHouseholdId) return;
        const templates = [
            { name: 'Servicios Públicos', color: 'blue' },
            { name: 'Gastos Hogar', color: 'green' },
            { name: 'Transporte', color: 'amber' },
            { name: 'Créditos', color: 'rose' }
        ];

        // Filter out categories that already exist (case insensitive)
        const existingNames = categories.map(c => c.name.toLowerCase());
        const newTemplates = templates.filter(t => !existingNames.includes(t.name.toLowerCase()));

        if (newTemplates.length === 0) {
            alert('Todas las categorías de la plantilla ya existen.');
            return;
        }

        try {
            for (const template of newTemplates) {
                const res = await fetch('/api/categories', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${user.token}`,
                        'X-Household-Id': activeHouseholdId
                    },
                    body: JSON.stringify(template)
                });

                if (res.ok) {
                    const newCat = await res.json();
                    setCategories(prev => [...prev, newCat]);
                }
            }
            fetchData(); // Refresh categories
            alert(`Se añadieron ${newTemplates.length} categorías nuevas.`);
        } catch (error) {
            console.error("Error adding template categories:", error);
        }
    };

    const handleRollover = async () => {
        if (!activeHouseholdId) return;
        const [month, year] = selectedMonth.split('-');
        let prevMonth = parseInt(month) - 1;
        let prevYear = parseInt(year);
        if (prevMonth === 0) {
            prevMonth = 12;
            prevYear -= 1;
        }
        const prevMonthStr = `${String(prevMonth).padStart(2, '0')}-${prevYear}`;

        try {
            const res = await fetch('/api/expenses/rollover', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                    'X-Household-Id': activeHouseholdId
                },
                body: JSON.stringify({ fromMonth: prevMonthStr, toMonth: selectedMonth })
            });

            if (res.ok) {
                const data = await res.json();
                alert(`Se importaron ${data.count} gastos fijos.`);
                fetchData();
            }
        } catch (error) {
            console.error("Error rolling over:", error);
        }
    };

    const handleExport = async () => {
        if (!activeHouseholdId) return;
        try {
            const res = await fetch(`/api/expenses/export?month=${selectedMonth}`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'X-Household-Id': activeHouseholdId
                }
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `gastos-${selectedMonth}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
        } catch (error) {
            console.error("Error exporting:", error);
        }
    };

    const saveIncome = async (val) => {
        setIncome(val);
        try {
            await fetch('/api/auth/income', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ income: val })
            });
        } catch (error) {
            console.error("Error saving income:", error);
        }
    };

    const formatCurrency = (amount) => {
        const currency = user?.currency || 'USD';
        const locales = {
            'USD': 'en-US',
            'EUR': 'de-DE',
            'COP': 'es-CO',
            'MXN': 'es-MX',
            'HNL': 'es-HN'
        };
        return new Intl.NumberFormat(locales[currency] || 'en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // ... (existing code)

    const updateHouseholdSettings = async (settings) => {
        try {
            const res = await fetch('/api/households/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(settings)
            });
            if (res.ok) {
                const updated = await res.json();
                setHousehold(updated);
                return { success: true };
            }
            return { success: false };
        } catch (error) {
            console.error(error);
            return { success: false };
        }
    };

    const fetchHousehold = async () => {
        if (!user) return;
        try {
            const res = await fetch('/api/households/current', {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setHousehold(data);
            }
        } catch (error) {
            console.error("Error fetching household:", error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchHousehold();
        }
    }, [user]);

    return {
        income, setIncome, saveIncome,
        categories,
        expenses: filteredExpenses,
        totalBudgeted,
        totalPaid,
        totalPending,
        currentBalance,
        projectedBalance,
        groupedExpenses,
        mobileMenuOpen, setMobileMenuOpen,
        showCategoryModal, setShowCategoryModal,
        newExpense, setNewExpense,
        handleAddExpense,
        handleDeleteExpense,
        updateExpense,
        handleUpdatePayment,
        handlePayFull,
        handlePayCategory,
        handleAddCategory,
        handleDeleteCategory,
        handleEditCategory,
        addTemplateCategories: handleAddTemplateCategories,
        selectedMonth, setSelectedMonth,
        handleRollover,
        handleExport,
        loading,
        filterMode, setFilterMode,
        selectedDate, setSelectedDate,
        handleToggleExpenseType,
        handleMarkUnpaid,
        sortMode, setSortMode,
        formatCurrency,
        currency: user?.currency || 'USD',
        savings,
        updateSavings,
        loadingSavings,
        activeHouseholdId,
        household,
        updateHouseholdSettings
    };


}
