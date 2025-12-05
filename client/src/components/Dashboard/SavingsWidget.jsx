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
            <div className="bg-surface-container backdrop-blur-sm rounded-2xl border border-outline shadow-lg p-6 animate-pulse">
                <div className="h-6 w-32 bg-slate-700 rounded mb-4"></div>
                <div className="h-10 w-48 bg-slate-700 rounded"></div>
            </div>
        );
    }

    return (
        <div className="bg-surface-container backdrop-blur-sm rounded-2xl border border-outline shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                    <div className="bg-success/10 p-1.5 rounded-lg">
                        <Wallet className="w-5 h-5 text-success" />
                    </div>
                    {t('dashboard.savingsWidget.title')}
                </h2>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-xs font-bold text-success hover:text-success bg-success/10 hover:bg-success/20 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        {t('dashboard.savingsWidget.manage')}
                    </button>
                )}
            </div>

            {!isEditing ? (
                <div>
                    <div className="text-3xl font-bold text-on-surface mb-1">
                        {formatCurrency(savings?.balance || 0)}
                    </div>
                    <p className="text-xs text-on-surface-variant">{t('dashboard.savingsWidget.available')}</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setOperation('add')}
                            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 ${operation === 'add'
                                ? 'bg-success/20 text-success border border-success/50'
                                : 'bg-surface/50 text-on-surface-variant border border-outline hover:bg-surface'
                                }`}
                        >
                            <Plus className="w-4 h-4" /> {t('dashboard.savingsWidget.deposit')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setOperation('subtract')}
                            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 ${operation === 'subtract'
                                ? 'bg-error/20 text-error border border-rose-500/50'
                                : 'bg-surface/50 text-on-surface-variant border border-outline hover:bg-surface'
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
                            className="w-full bg-surface/50 border border-outline rounded-xl px-4 py-2 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-success/50 focus:border-success transition-all font-mono"
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={!amount}
                            className="flex-1 bg-success hover:opacity-80 text-main font-bold py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Check className="w-4 h-4" /> {t('dashboard.savingsWidget.confirm')}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setIsEditing(false);
                                setAmount('');
                            }}
                            className="px-3 bg-surface-container hover:bg-surface text-on-surface-variant rounded-xl transition-colors border border-outline"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
