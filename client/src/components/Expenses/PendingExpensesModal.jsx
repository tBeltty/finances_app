import React from 'react';
import { X, Calendar, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PendingExpensesModal({ isOpen, onClose, expenses, formatCurrency, onPay }) {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-surface-container border border-outline rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 border-b border-outline flex items-center justify-between bg-surface-container-high/50 rounded-t-2xl">
                    <h2 className="text-lg font-bold text-on-surface">{t('dashboard.pendingExpenses')}</h2>
                    <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* List */}
                <div className="overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {expenses.length === 0 ? (
                        <p className="text-center text-on-surface-variant py-8">{t('expenses.noExpenses')}</p>
                    ) : (
                        expenses.map(expense => (
                            <div key={expense.id} className="bg-surface/50 border border-outline p-3 rounded-xl flex items-center justify-between hover:bg-surface transition-colors">
                                <div>
                                    <p className="font-semibold text-on-surface">{expense.name}</p>
                                    <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-1">
                                        <Calendar size={12} />
                                        <span>{expense.date ? (() => {
                                            const [year, month, day] = expense.date.split('-');
                                            return `${day}/${month}/${year.slice(-2)}`;
                                        })() : '-'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="font-bold text-primary">{formatCurrency(expense.amount - (expense.paid || 0))}</p>
                                        <p className="text-[10px] text-on-surface-variant uppercase">{t('dashboard.remaining')}</p>
                                    </div>
                                    <button
                                        onClick={() => onPay(expense.id)}
                                        className="p-2 bg-success/10 text-success hover:bg-emerald-500/20 rounded-lg transition-colors"
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
                <div className="p-4 border-t border-outline bg-surface-container-high/50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="w-full bg-surface hover:bg-surface-container-high text-on-surface font-medium py-2.5 rounded-xl transition-colors border border-outline"
                    >
                        {t('common.close')}
                    </button>
                </div>
            </div>
        </div>
    );
}
