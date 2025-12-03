import React from 'react';
import { X, Calendar, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PendingExpensesModal({ isOpen, onClose, expenses, formatCurrency, onPay }) {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/50 rounded-t-2xl">
                    <h2 className="text-lg font-bold text-slate-200">{t('dashboard.pendingExpenses')}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* List */}
                <div className="overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {expenses.length === 0 ? (
                        <p className="text-center text-slate-500 py-8">{t('expenses.noExpenses')}</p>
                    ) : (
                        expenses.map(expense => (
                            <div key={expense.id} className="bg-slate-800/50 border border-slate-700 p-3 rounded-xl flex items-center justify-between hover:bg-slate-800 transition-colors">
                                <div>
                                    <p className="font-semibold text-slate-200">{expense.name}</p>
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                                        <Calendar size={12} />
                                        <span>{expense.date ? (() => {
                                            const [year, month, day] = expense.date.split('-');
                                            return `${day}/${month}/${year.slice(-2)}`;
                                        })() : '-'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="font-bold text-amber-400">{formatCurrency(expense.amount - (expense.paid || 0))}</p>
                                        <p className="text-[10px] text-slate-500 uppercase">{t('dashboard.remaining')}</p>
                                    </div>
                                    <button
                                        onClick={() => onPay(expense.id)}
                                        className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
                                        title={t('expenses.payFull')}
                                    >
                                        <CheckCircle2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 bg-slate-800/50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-2.5 rounded-xl transition-colors"
                    >
                        {t('common.close')}
                    </button>
                </div>
            </div>
        </div>
    );
}
