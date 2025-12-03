import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Wallet, Plus, Minus, Check, X } from 'lucide-react';

export default function SavingsWidget({ savings, updateSavings, formatCurrency, loading }) {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [amount, setAmount] = useState('');
    const [operation, setOperation] = useState('add'); // 'add' or 'subtract'

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount) return;

        const success = await updateSavings(amount, operation);
        if (success) {
            setIsEditing(false);
            setAmount('');
        }
    };

    if (loading) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 shadow-lg p-6 animate-pulse">
                <div className="h-6 w-32 bg-slate-700 rounded mb-4"></div>
                <div className="h-10 w-48 bg-slate-700 rounded"></div>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                    <div className="bg-emerald-500/10 p-1.5 rounded-lg">
                        <Wallet className="w-5 h-5 text-emerald-400" />
                    </div>
                    {t('dashboard.savingsWidget.title')}
                </h2>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        {t('dashboard.savingsWidget.manage')}
                    </button>
                )}
            </div>

            {!isEditing ? (
                <div>
                    <div className="text-3xl font-bold text-white mb-1">
                        {formatCurrency(savings?.balance || 0)}
                    </div>
                    <p className="text-xs text-slate-400">{t('dashboard.savingsWidget.available')}</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setOperation('add')}
                            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 ${operation === 'add'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                                : 'bg-slate-900/50 text-slate-400 border border-slate-700 hover:bg-slate-800'
                                }`}
                        >
                            <Plus className="w-4 h-4" /> {t('dashboard.savingsWidget.deposit')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setOperation('subtract')}
                            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 ${operation === 'subtract'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50'
                                : 'bg-slate-900/50 text-slate-400 border border-slate-700 hover:bg-slate-800'
                                }`}
                        >
                            <Minus className="w-4 h-4" /> {t('dashboard.savingsWidget.withdraw')}
                        </button>
                    </div>

                    <div className="relative">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0"
                            className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-mono"
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={!amount}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Check className="w-4 h-4" /> {t('dashboard.savingsWidget.confirm')}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setIsEditing(false);
                                setAmount('');
                            }}
                            className="px-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
