import React, { useState } from 'react';
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
    updateSavings
}) {
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
                setTimeout(async () => {
                    if (confirm(`¿Deseas transferir ${formatCurrency(savingsAmount)} a tus ahorros automáticamente?`)) {
                        await updateSavings(savingsAmount, 'add');
                        alert(`Se han añadido ${formatCurrency(savingsAmount)} a tus ahorros.`);
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
            <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700 shadow-lg hover:shadow-blue-500/10 transition-all duration-300 group h-full">
                <div className="flex flex-col items-center justify-center text-center gap-2 h-full">
                    <div className="bg-emerald-500/10 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="w-full flex flex-col items-center">
                        <p className="text-slate-400 text-xs font-medium mb-1">Ingresos</p>
                        {isEditingIncome ? (
                            <div className="flex items-center justify-center gap-2">
                                <input
                                    type="number"
                                    value={tempIncome}
                                    onChange={(e) => setTempIncome(e.target.value)}
                                    onKeyDown={handleIncomeKeyDown}
                                    className="w-32 bg-transparent border-b border-emerald-500 text-xl font-bold text-slate-200 focus:outline-none text-center"
                                    autoFocus
                                />
                                <div className="flex items-center gap-1">
                                    <button onClick={handleSaveIncome} className="text-emerald-400 hover:bg-emerald-500/10 p-1 rounded">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setIsEditingIncome(false)} className="text-rose-400 hover:bg-rose-500/10 p-1 rounded">
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
                                <h3 className="text-xl font-bold text-slate-200 group-hover/value:text-emerald-400 transition-colors">
                                    {formatCurrency(income || 0)}
                                </h3>
                                <Edit3 className="w-3 h-3 text-emerald-400 absolute -right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover/value:opacity-100 transition-opacity" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Balance Real (Disponible en Caja) */}
            <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700 shadow-lg hover:shadow-blue-500/10 transition-all duration-300 h-full">
                <div className="flex flex-col items-center justify-center text-center gap-2 h-full">
                    <div className="bg-blue-500/10 p-2.5 rounded-xl">
                        <Wallet className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="w-full">
                        <p className="text-slate-400 text-xs font-medium mb-1">Balance Real (Caja)</p>
                        <h3 className={`text-xl font-bold ${currentBalance >= 0 ? 'text-slate-200' : 'text-rose-400'}`}>
                            {formatCurrency(currentBalance)}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Presupuestado */}
            <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700 shadow-lg hover:shadow-slate-500/10 transition-all duration-300 h-full">
                <div className="flex flex-col items-center justify-center text-center gap-2 h-full">
                    <div className="bg-slate-500/10 p-2.5 rounded-xl">
                        <DollarSign className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="w-full">
                        <p className="text-slate-400 text-xs font-medium mb-1">Gastos Totales</p>
                        <h3 className="text-xl font-bold text-slate-200 break-words">
                            {formatCurrency(totalBudgeted)}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Por Pagar */}
            <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700 shadow-lg hover:shadow-amber-500/10 transition-all duration-300 h-full">
                <div className="flex flex-col items-center justify-center text-center gap-2 h-full">
                    <div className="bg-amber-500/10 p-2.5 rounded-xl">
                        <TrendingDown className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="w-full">
                        <p className="text-slate-400 text-xs font-medium mb-1">Por Pagar</p>
                        <h3 className="text-xl font-bold text-slate-200 break-words">
                            {formatCurrency(totalPending)}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Saldo Proyectado (Después de pagar todo) */}
            <div className="md:col-span-2 xl:col-span-4 bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700 shadow-lg hover:shadow-indigo-500/10 transition-all duration-300">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-500/10 p-3 rounded-xl">
                            <Wallet className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <p className="text-slate-400 text-sm font-medium">Saldo Proyectado (Final)</p>
                                <span className="text-xs font-bold px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-400">
                                    Si pagas todo
                                </span>
                            </div>
                            <h3 className={`text-3xl font-bold ${projectedBalance >= 0 ? 'text-slate-200' : 'text-rose-400'}`}>
                                {formatCurrency(projectedBalance)}
                            </h3>
                        </div>
                    </div>
                    <div className="text-sm text-slate-400 bg-slate-900/50 px-4 py-3 rounded-xl border border-slate-700">
                        <p className="mb-1">Resumen:</p>
                        <div className="flex gap-4 text-xs">
                            <span>Ingresos: <span className="text-emerald-400 font-semibold">{formatCurrency(income)}</span></span>
                            <span>- Gastos: <span className="text-rose-400 font-semibold">{formatCurrency(totalBudgeted)}</span></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
