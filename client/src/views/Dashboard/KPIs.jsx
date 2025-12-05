import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, Wallet, TrendingDown, CreditCard, CheckCircle2, Edit3, X } from 'lucide-react';

export default function KPIs({
    income,
    setIncome,
    saveIncome,
    currentBalance,
    totalBudgeted,
    totalPending,
    projectedBalance,
    expenses,
    formatCurrency,
    household,
    updateSavings,
    onPendingClick
}) {
    const { t } = useTranslation();
    const [isEditingIncome, setIsEditingIncome] = useState(false);
    const [tempIncome, setTempIncome] = useState(String(income));

    const handleSaveIncome = async () => {
        const val = parseFloat(tempIncome);
        const finalIncome = isNaN(val) ? 0 : val;

        setIncome(finalIncome);
        await saveIncome(finalIncome);
        setIsEditingIncome(false);

        // Auto-Savings Logic
        if (household?.savingsGoalType && household.savingsGoalType !== 'NONE' && finalIncome > 0) {
            let savingsAmount = 0;

            if (household.savingsGoalType === 'PERCENT') {
                savingsAmount = finalIncome * (household.savingsGoalValue / 100);
            } else if (household.savingsGoalType === 'FIXED') {
                savingsAmount = household.savingsGoalValue;
            }

            if (savingsAmount > 0) {
                // Small delay to let the UI update first
                // Small delay to let the UI update first
                setTimeout(async () => {
                    if (confirm(t('dashboard.confirmTransfer', { amount: formatCurrency(savingsAmount) }))) {
                        await updateSavings(savingsAmount, 'add');
                        alert(t('dashboard.savingsAdded', { amount: formatCurrency(savingsAmount) }));
                    }
                }, 100);
            }
        }
    };

    const handleIncomeKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSaveIncome();
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            {/* Ingresos */}
            <div className="bg-surface-container backdrop-blur-sm p-6 rounded-2xl border border-outline shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 group h-full">
                <div className="flex flex-col items-center justify-center text-center gap-2 h-full">
                    <div className="bg-success/10 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                        <DollarSign className="w-5 h-5 text-success" />
                    </div>
                    <div className="w-full flex flex-col items-center">
                        <p className="text-on-surface-variant text-xs font-medium mb-1">{t('dashboard.income')}</p>
                        {isEditingIncome ? (
                            <div className="flex items-center justify-center gap-2">
                                <input
                                    type="number"
                                    value={tempIncome}
                                    onChange={(e) => setTempIncome(e.target.value)}
                                    onKeyDown={handleIncomeKeyDown}
                                    className="w-32 bg-transparent border-b border-emerald-500 text-xl font-bold text-on-surface focus:outline-none text-center"
                                    autoFocus
                                />
                                <div className="flex items-center gap-1">
                                    <button onClick={handleSaveIncome} className="text-success hover:bg-success/10 p-1 rounded">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setIsEditingIncome(false)} className="text-error hover:bg-error/10 p-1 rounded">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => setIsEditingIncome(true)}
                                className="cursor-pointer group/value relative"
                                title="Clic para editar ingresos"
                            >
                                <h3 className="text-xl font-bold text-on-surface group-hover/value:text-success transition-colors">
                                    {formatCurrency(income || 0)}
                                </h3>
                                <Edit3 className="w-3 h-3 text-success absolute -right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover/value:opacity-100 transition-opacity" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Balance Real (Disponible en Caja) */}
            <div className="bg-surface-container backdrop-blur-sm p-6 rounded-2xl border border-outline shadow-lg hover:shadow-blue-500/10 transition-all duration-300 h-full">
                <div className="flex flex-col items-center justify-center text-center gap-2 h-full">
                    <div className="bg-blue-500/10 p-2.5 rounded-xl">
                        <Wallet className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="w-full">
                        <p className="text-on-surface-variant text-xs font-medium mb-1">{t('dashboard.realBalance')}</p>
                        <h3 className={`text-xl font-bold ${currentBalance >= 0 ? 'text-on-surface' : 'text-error'}`}>
                            {formatCurrency(currentBalance)}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Presupuestado */}
            <div className="bg-surface-container backdrop-blur-sm p-6 rounded-2xl border border-outline shadow-lg hover:shadow-primary/10 transition-all duration-300 h-full">
                <div className="flex flex-col items-center justify-center text-center gap-2 h-full">
                    <div className="bg-primary/10 p-2.5 rounded-xl">
                        <DollarSign className="w-5 h-5 text-primary" />
                    </div>
                    <div className="w-full">
                        <p className="text-on-surface-variant text-xs font-medium mb-1">{t('dashboard.totalExpenses')}</p>
                        <h3 className="text-xl font-bold text-on-surface break-words">
                            {formatCurrency(totalBudgeted)}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Por Pagar */}
            <div
                onClick={onPendingClick}
                className="bg-surface-container backdrop-blur-sm p-6 rounded-2xl border border-outline shadow-lg hover:shadow-amber-500/10 transition-all duration-300 h-full cursor-pointer group hover:scale-[1.02] active:scale-[0.98]"
            >
                <div className="flex flex-col items-center justify-center text-center gap-2 h-full">
                    <div className="bg-amber-500/10 p-2.5 rounded-xl group-hover:bg-amber-500/20 transition-colors">
                        <TrendingDown className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="w-full">
                        <p className="text-on-surface-variant text-xs font-medium mb-1">{t('dashboard.pending')}</p>
                        <h3 className="text-xl font-bold text-on-surface break-words group-hover:text-amber-400 transition-colors">
                            {formatCurrency(totalPending)}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Saldo Proyectado (Después de pagar todo) */}
            <div className="md:col-span-2 xl:col-span-4 bg-surface-container backdrop-blur-sm p-6 rounded-2xl border border-outline shadow-lg hover:shadow-indigo-500/10 transition-all duration-300">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-xl">
                            <Wallet className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <p className="text-on-surface-variant text-sm font-medium">{t('dashboard.projectedBalance')}</p>
                            </div>
                            <h3 className={`text-3xl font-bold ${projectedBalance >= 0 ? 'text-on-surface' : 'text-error'}`}>
                                {formatCurrency(projectedBalance)}
                            </h3>
                        </div>
                    </div>
                    <div className="text-sm text-on-surface-variant bg-surface/50 px-4 py-3 rounded-xl border border-outline">
                        <p className="mb-1">{t('dashboard.summary')}</p>
                        <div className="flex gap-4 text-xs">
                            <span>{t('dashboard.income')}: <span className="text-success font-semibold">{formatCurrency(income)}</span></span>
                            <span>- {t('dashboard.totalExpenses')}: <span className="text-error font-semibold">{formatCurrency(totalBudgeted)}</span></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
