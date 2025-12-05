import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, ChevronDown, Sparkles, Check, X } from 'lucide-react';
import CustomSelect from '../../components/Inputs/CustomSelect';

export default function ExpenseForm({
    newExpense,
    setNewExpense,
    categories,
    handleAddExpense,
    addTemplateCategories,
    handleAddCategory,
    currency
}) {
    const { t } = useTranslation();
    const [showQuickCategory, setShowQuickCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState('slate');

    const handleCategoryChange = (value) => {
        if (value === 'NEW') {
            setShowQuickCategory(true);
        } else {
            setNewExpense({ ...newExpense, categoryId: value });
        }
    };

    const saveNewCategory = async () => {
        if (!newCategoryName.trim()) return;
        if (handleAddCategory) {
            const newCat = await handleAddCategory(newCategoryName);
            if (newCat) {
                setNewExpense({ ...newExpense, categoryId: newCat.id });
                setShowQuickCategory(false);
                setNewCategoryName('');
            }
        }
    };

    return (
        <div className="bg-surface-container backdrop-blur-sm rounded-2xl border border-outline shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                    <div className="bg-primary-container p-1.5 rounded-lg">
                        <Plus className="w-5 h-5 text-on-primary-container" />
                    </div>
                    {t('expenses.newExpense')}
                </h2>
            </div>

            <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">{t('expenses.description')}</label>
                    <input
                        type="text"
                        placeholder={t('expenses.descriptionPlaceholder')}
                        value={newExpense.name}
                        onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
                        className="w-full bg-surface/50 border border-outline rounded-xl px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">{t('expenses.amount')}</label>
                    <div className="relative">
                        <input
                            type="text"
                            inputMode="decimal"
                            placeholder={t('expenses.amountPlaceholder')}
                            value={newExpense.amount}
                            onChange={(e) => {
                                const val = e.target.value;
                                // Determine separators based on currency
                                const isDotThousands = ['COP', 'EUR', 'HNL', 'CLP', 'ARS'].includes(currency);
                                const thousandsSep = isDotThousands ? '.' : ',';
                                const decimalSep = isDotThousands ? ',' : '.';

                                // Remove invalid characters (allow digits and decimal separator)
                                // We allow the decimal separator only once
                                let cleanVal = val;

                                // Regex to match allowed chars: digits and the specific decimal separator
                                const allowedPattern = new RegExp(`[^0-9${decimalSep}]`, 'g');
                                cleanVal = cleanVal.replace(allowedPattern, '');

                                // Handle multiple decimal separators (keep only the first one)
                                const parts = cleanVal.split(decimalSep);
                                if (parts.length > 2) {
                                    cleanVal = parts[0] + decimalSep + parts.slice(1).join('');
                                }

                                // Format the integer part
                                const integerPart = parts[0];
                                const decimalPart = parts.length > 1 ? decimalSep + parts[1] : '';

                                // Add thousands separators to integer part
                                const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSep);

                                setNewExpense({ ...newExpense, amount: formattedInteger + decimalPart });
                            }}
                            className="w-full bg-surface/50 border border-outline rounded-xl px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-mono"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">{t('expenses.type')}</label>
                    <div className="relative">
                        <CustomSelect
                            value={newExpense.type}
                            onChange={(val) => setNewExpense({ ...newExpense, type: val })}
                            options={[
                                { value: 'Variable', label: t('expenses.variable') },
                                { value: 'Fijo', label: t('expenses.fixed') }
                            ]}
                            placeholder={t('expenses.type')}
                        />
                    </div>
                </div>

                <div className="relative">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">{t('expenses.category')}</label>

                    {showQuickCategory ? (
                        <div className="absolute top-0 left-0 w-full z-20 bg-surface-container/95 backdrop-blur-xl border border-outline rounded-2xl shadow-2xl p-2 flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                            <input
                                type="text"
                                autoFocus
                                placeholder={t('expenses.newCategory')}
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                className="w-full bg-surface/50 border border-outline rounded-xl px-3 py-2 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-on-surface-variant"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        saveNewCategory();
                                    }
                                }}
                            />
                            <button
                                type="button"
                                onClick={saveNewCategory}
                                className="bg-primary hover:bg-primary-hover text-on-primary p-2 rounded-lg transition-colors shadow-lg shadow-primary/20"
                            >
                                <Check className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowQuickCategory(false)}
                                className="bg-surface-container hover:bg-surface text-on-surface-variant hover:text-on-surface p-2 rounded-lg transition-colors border border-outline"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <CustomSelect
                            value={newExpense.categoryId}
                            onChange={handleCategoryChange}
                            options={[
                                ...(categories || []).map(cat => ({ value: cat.id, label: cat.name })),
                                { value: 'NEW', label: t('expenses.addNewCategory'), icon: Plus }
                            ]}
                            placeholder={t('expenses.select')}
                        />
                    )}
                </div>

                <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">{t('expenses.date')}</label>
                    <input
                        type="date"
                        value={newExpense.date}
                        onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                        disabled={!newExpense.isPaid}
                        className={`w-full bg-surface/50 border border-outline rounded-xl px-4 py-2.5 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${!newExpense.isPaid ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                </div>

                <div className="flex items-end gap-2">
                    <label className="flex items-center gap-3 w-full bg-surface/50 border border-outline rounded-xl px-4 py-2.5 cursor-pointer hover:bg-surface/80 transition-colors">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${newExpense.isPaid ? 'bg-emerald-500 border-emerald-500' : 'border-on-surface-variant'}`}>
                            {newExpense.isPaid && <Sparkles className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <input
                            type="checkbox"
                            checked={newExpense.isPaid}
                            onChange={(e) => setNewExpense({ ...newExpense, isPaid: e.target.checked, payWithSavings: false })}
                            className="hidden"
                        />
                        <span className={`text-sm font-medium ${newExpense.isPaid ? 'text-emerald-400' : 'text-on-surface-variant'}`}>
                            <span>{newExpense.isPaid ? t('expenses.paid') : t('expenses.pending')}</span>
                        </span>
                    </label>

                    {newExpense.isPaid && (
                        <label className="flex items-center gap-2 bg-surface/50 border border-outline rounded-xl px-3 py-2.5 cursor-pointer hover:bg-surface/80 transition-colors" title={t('expenses.payWithSavings')}>
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${newExpense.payWithSavings ? 'bg-primary border-primary' : 'border-on-surface-variant'}`}>
                                {newExpense.payWithSavings && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <input
                                type="checkbox"
                                checked={newExpense.payWithSavings || false}
                                onChange={(e) => setNewExpense({ ...newExpense, payWithSavings: e.target.checked })}
                                className="hidden"
                            />
                            <span className={`text-xs font-bold ${newExpense.payWithSavings ? 'text-primary' : 'text-on-surface-variant'}`}>
                                {t('expenses.savings')}
                            </span>
                        </label>
                    )}
                </div>

                <div className="md:col-span-2 lg:col-span-4">
                    <button
                        type="submit"
                        disabled={!newExpense.name || !newExpense.amount}
                        className="w-full bg-primary hover:bg-primary-hover text-on-primary font-bold py-3 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transform active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span>{t('expenses.addExpense')}</span>
                    </button>
                </div>
            </form >
        </div >
    );
}
