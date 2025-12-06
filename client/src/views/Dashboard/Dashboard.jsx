import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useFinances from '../../hooks/useFinances';
import KPIs from './KPIs';
import ExpenseList from '../Expenses/ExpenseList';
import SavingsWidget from '../../components/Dashboard/SavingsWidget';
import IncomeWidget from '../../components/Income/IncomeWidget';
import ExpenseForm from '../Expenses/ExpenseForm';
import Controls from '../../components/Dashboard/Controls';
import PendingExpensesModal from '../../components/Expenses/PendingExpensesModal';
import { useAuth } from '../../context/AuthContext';
import { Users, Settings as SettingsIcon, LogOut, Plus, Menu, X, DollarSign, CreditCard } from 'lucide-react';
import QuickAddModal from '../../components/Dashboard/QuickAddModal';
import IncomeModal from '../../components/Income/IncomeModal';
import ErrorBoundary from '../../components/ErrorBoundary';
import { useUI } from '../../context/UIContext';

import AnalyticsView from '../Analytics/AnalyticsView';
import { PieChart as PieChartIcon, LayoutDashboard } from 'lucide-react';

export default function Dashboard() {
    const { user, refreshUser, logout } = useAuth();
    const { t } = useTranslation();
    const { settingsOpen, closeSettings } = useUI();
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [showIncomeModal, setShowIncomeModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [activeView, setActiveView] = useState('overview'); // 'overview' | 'analytics'



    const finances = useFinances();

    const {
        income, setIncome, saveIncome,
        categories,
        expenses,
        totalBudgeted,
        totalPending,
        handleAddExpense,
        handleDeleteExpense,
        updateExpense,
        newExpense, setNewExpense,
        filterMode, setFilterMode,
        selectedDate, setSelectedDate,
        sortMode, setSortMode,
        formatCurrency,
        currency,
        savings,
        updateSavings,
        loadingSavings,
        addTemplateCategories,
        selectedMonth, setSelectedMonth,
        handleRollover,
        handleExport,
        handleAddCategory,
        handleDeleteCategory,
        handleEditCategory,
        groupedExpenses,
        household,
        updateHouseholdSettings,
        currentBalance,
        projectedBalance,
        handleToggleExpenseType,
        handleMarkUnpaid,
        handleUpdatePayment,
        handlePayFull,
        handlePayCategory,
        loading
    } = finances;

    const [showPendingModal, setShowPendingModal] = useState(false);
    const pendingExpenses = expenses.filter(e => (e.paid || 0) < e.amount);

    // Handler for adding extra income from FAB
    const handleAddIncome = async (incomeData) => {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/incomes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'x-household-id': localStorage.getItem('currentHouseholdId') || ''
            },
            body: JSON.stringify(incomeData)
        });
        if (res.ok) {
            // Refresh finances to update income widget
            window.location.reload();
        }
    };

    useEffect(() => {
    }, []);

    if (!user) {
        return null;
    }

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-main pb-24 md:pb-8">
                <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

                    {/* Header & Controls */}
                    <Controls
                        user={user}
                        logout={logout}
                        income={income}
                        saveIncome={saveIncome}
                        selectedMonth={selectedMonth}
                        setSelectedMonth={setSelectedMonth}
                        handleRollover={handleRollover}
                        handleExport={handleExport}
                        household={household}
                        updateSavings={updateSavings}
                        formatCurrency={formatCurrency}
                        filterMode={filterMode}
                        setFilterMode={setFilterMode}
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                        sortMode={sortMode}
                        setSortMode={setSortMode}
                        onOpenSettings={() => { }} // Placeholder or connect to UI context if needed
                    />

                    {/* View Switcher */}
                    <div className="flex p-1 bg-surface-container border border-outline rounded-xl w-full md:w-fit">
                        <button
                            onClick={() => setActiveView('overview')}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'overview'
                                ? 'bg-primary-container text-on-primary-container shadow-sm'
                                : 'text-on-surface-variant hover:text-on-surface'
                                }`}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            {t('dashboard.tabs.overview')}
                        </button>
                        <button
                            onClick={() => setActiveView('analytics')}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'analytics'
                                ? 'bg-primary-container text-on-primary-container shadow-sm'
                                : 'text-on-surface-variant hover:text-on-surface'
                                }`}
                        >
                            <PieChartIcon className="w-4 h-4" />
                            {t('dashboard.tabs.analytics')}
                        </button>
                    </div>

                    {activeView === 'overview' ? (
                        <>
                            <KPIs
                                totalBudgeted={totalBudgeted}
                                totalPending={totalPending}
                                currentBalance={currentBalance}
                                projectedBalance={projectedBalance}
                                formatCurrency={formatCurrency}
                                income={income}
                                setIncome={setIncome}
                                saveIncome={saveIncome}
                                household={household}
                                updateSavings={updateSavings}
                                onPendingClick={() => setShowPendingModal(true)}
                                expenses={expenses}
                            />
                            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                                <div className="xl:col-span-3 space-y-6">
                                    <div className="hidden lg:block">
                                        <ExpenseForm
                                            newExpense={newExpense}
                                            setNewExpense={setNewExpense}
                                            categories={categories}
                                            handleAddExpense={handleAddExpense}
                                            handleAddCategory={handleAddCategory}
                                            loading={loading}
                                            currency={currency}
                                        />
                                    </div>
                                    <ExpenseList
                                        groupedExpenses={groupedExpenses}
                                        handlePayCategory={handlePayCategory}
                                        handleUpdatePayment={handleUpdatePayment}
                                        handlePayFull={handlePayFull}
                                        handleDeleteExpense={handleDeleteExpense}
                                        handleDeleteCategory={handleDeleteCategory}
                                        updateExpense={updateExpense}
                                        handleToggleExpenseType={handleToggleExpenseType}
                                        handleMarkUnpaid={handleMarkUnpaid}
                                        handleEditCategory={handleEditCategory}
                                        formatCurrency={formatCurrency}
                                        currency={currency}
                                        categories={categories}
                                    />
                                </div>
                                <div className="space-y-6">
                                    <IncomeWidget
                                        mainIncome={income}
                                        formatCurrency={formatCurrency}
                                        selectedMonth={selectedMonth}
                                        token={localStorage.getItem('token')}
                                    />
                                    <SavingsWidget
                                        savings={savings}
                                        updateSavings={updateSavings}
                                        loading={loadingSavings}
                                        formatCurrency={formatCurrency}
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <AnalyticsView
                            expenses={expenses}
                            categories={categories}
                            currency={currency}
                            formatCurrency={formatCurrency}
                        />
                    )}
                </div>



                <QuickAddModal
                    isOpen={showExpenseModal}
                    onClose={() => setShowExpenseModal(false)}
                    newExpense={newExpense}
                    setNewExpense={setNewExpense}
                    categories={categories}
                    handleAddExpense={handleAddExpense}
                    currency={currency}
                />

                <PendingExpensesModal
                    isOpen={showPendingModal}
                    onClose={() => setShowPendingModal(false)}
                    expenses={pendingExpenses}
                    formatCurrency={formatCurrency}
                    onPay={handlePayFull}
                />

                <IncomeModal
                    isOpen={showIncomeModal}
                    onClose={() => setShowIncomeModal(false)}
                    onSave={handleAddIncome}
                    currency={currency}
                    formatCurrency={formatCurrency}
                />

                {/* Mobile FAB for Quick Add with Menu */}
                <div className="md:hidden fixed bottom-6 right-6 z-40">
                    {showQuickAdd && (
                        <div className="absolute bottom-16 right-0 flex flex-col gap-3 mb-2 animate-fade-in">
                            <button
                                onClick={() => {
                                    setShowQuickAdd(false);
                                    setShowIncomeModal(true);
                                }}
                                className="flex items-center gap-2 bg-success hover:bg-success/90 text-white px-4 py-3 rounded-full shadow-lg whitespace-nowrap"
                            >
                                <DollarSign className="w-5 h-5" />
                                {t('income.addTitle')}
                            </button>
                            <button
                                onClick={() => {
                                    // Close menu and open QuickAddModal for expense
                                    setShowQuickAdd(false);
                                    setTimeout(() => setShowExpenseModal(true), 100);
                                }}
                                className="flex items-center gap-2 bg-error hover:bg-error/90 text-white px-4 py-3 rounded-full shadow-lg whitespace-nowrap"
                            >
                                <CreditCard className="w-5 h-5" />
                                {t('dashboard.addExpense')}
                            </button>
                        </div>
                    )}
                    <button
                        onClick={() => setShowQuickAdd(!showQuickAdd)}
                        className={`w-14 h-14 bg-primary hover:bg-primary-hover text-white rounded-full shadow-2xl shadow-primary/30 flex items-center justify-center transition-all duration-300 ${showQuickAdd ? 'rotate-45' : ''}`}
                    >
                        <Plus className="w-8 h-8" />
                    </button>
                </div>


            </div>
        </ErrorBoundary>
    );
}
