import React, { useState, useEffect } from 'react';
import useFinances from '../../hooks/useFinances';
import KPIs from './KPIs';
import ExpenseList from '../Expenses/ExpenseList';
import ExpenseForm from '../Expenses/ExpenseForm';
import SavingsWidget from '../../components/Dashboard/SavingsWidget';
import Controls from '../../components/Dashboard/Controls';
import SettingsModal from '../../components/Settings/SettingsModal';
import { useAuth } from '../../context/AuthContext';
import { Users, Settings as SettingsIcon, LogOut, Plus, Menu, X } from 'lucide-react';
import QuickAddModal from '../../components/Dashboard/QuickAddModal';
import ErrorBoundary from '../../components/ErrorBoundary';
import { useUI } from '../../context/UIContext';

import AnalyticsView from '../Analytics/AnalyticsView';
import { PieChart as PieChartIcon, LayoutDashboard } from 'lucide-react';

export default function Dashboard() {
    console.log("Dashboard: Rendering...");
    const { user, refreshUser, logout } = useAuth();
    const { settingsOpen, closeSettings } = useUI();
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [activeView, setActiveView] = useState('overview'); // 'overview' | 'analytics'

    console.log("Dashboard: User:", user);

    const finances = useFinances();
    console.log("Dashboard: useFinances hook result:", finances);

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

    useEffect(() => {
        console.log("Dashboard: Mounted");
        return () => console.log("Dashboard: Unmounted");
    }, []);

    if (!user) {
        console.log("Dashboard: No user, returning null");
        return null;
    }

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-slate-950 pb-24 md:pb-8">
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
                    <div className="flex p-1 bg-slate-900/50 border border-slate-800 rounded-xl w-fit">
                        <button
                            onClick={() => setActiveView('overview')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'overview'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Resumen
                        </button>
                        <button
                            onClick={() => setActiveView('analytics')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'analytics'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            <PieChartIcon className="w-4 h-4" />
                            Analíticas
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
                                            currency={household?.currency || 'COP'}
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
                />

                {/* Mobile FAB for Quick Add */}
                <button
                    onClick={() => setShowQuickAdd(true)}
                    className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-2xl shadow-indigo-500/30 flex items-center justify-center z-40 transition-transform hover:scale-110 active:scale-95"
                >
                    <Plus className="w-8 h-8" />
                </button>

                {/* Debug Version Indicator */}
                <div className="fixed bottom-2 left-2 text-xs text-slate-600 font-mono pointer-events-none z-50">
                    v1.1.0
                </div>
            </div>
        </ErrorBoundary>
    );
}
