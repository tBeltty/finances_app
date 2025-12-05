import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useFinances from '../../hooks/useFinances';
import KPIs from './KPIs';
import ExpenseList from '../Expenses/ExpenseList';
import ExpenseForm from '../Expenses/ExpenseForm';
import SavingsWidget from '../../components/Dashboard/SavingsWidget';
import Controls from '../../components/Dashboard/Controls';
import SettingsModal from '../../components/Settings/SettingsModal';
import PendingExpensesModal from '../../components/Expenses/PendingExpensesModal';
import { useAuth } from '../../context/AuthContext';
import { Users, Settings as SettingsIcon, LogOut, Plus, Menu, X } from 'lucide-react';
import QuickAddModal from '../../components/Dashboard/QuickAddModal';
import ErrorBoundary from '../../components/ErrorBoundary';
import { useUI } from '../../context/UIContext';

import AnalyticsView from '../Analytics/AnalyticsView';
import { PieChart as PieChartIcon, LayoutDashboard } from 'lucide-react';

export default function Dashboard() {
    const { user, refreshUser, logout } = useAuth();
    const { t } = useTranslation();
    const { settingsOpen, closeSettings } = useUI();
    const [showQuickAdd, setShowQuickAdd] = useState(false);
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

                <SettingsModal
                    isOpen={settingsOpen}
                    onClose={closeSettings}
                    categories={categories}
                    handleAddCategory={handleAddCategory}
                    handleDeleteCategory={handleDeleteCategory}
                    handleEditCategory={handleEditCategory}
                    handleAddTemplateCategories={addTemplateCategories}
                    user={user}
                    refreshUser={refreshUser}
                    household={household}
                    updateHouseholdSettings={updateHouseholdSettings}
                />

                <QuickAddModal
                    isOpen={showQuickAdd}
                    onClose={() => setShowQuickAdd(false)}
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

                {/* Mobile FAB for Quick Add */}
                <button
                    onClick={() => setShowQuickAdd(true)}
                    className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary-hover text-white rounded-full shadow-2xl shadow-primary/30 flex items-center justify-center z-40 transition-transform hover:scale-110 active:scale-95"
                >
                    <Plus className="w-8 h-8" />
                </button>


            </div>
        </ErrorBoundary>
    );
}
