import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, DollarSign, Calendar, Tag } from 'lucide-react';

const INCOME_CATEGORIES = [
    { id: 'freelance', labelKey: 'income.categories.freelance' },
    { id: 'sale', labelKey: 'income.categories.sale' },
    { id: 'rent', labelKey: 'income.categories.rent' },
    { id: 'dividend', labelKey: 'income.categories.dividend' },
    { id: 'cashback', labelKey: 'income.categories.cashback' },
    { id: 'other', labelKey: 'income.categories.other' }
];

export default function IncomeModal({ isOpen, onClose, onSave, currency, formatCurrency }) {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: 'other'
    });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.description || !formData.amount) return;

        setLoading(true);
        try {
            await onSave({
                ...formData,
                amount: parseFloat(formData.amount),
                type: 'extra'
            });
            setFormData({
                description: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                category: 'other'
            });
            onClose();
        } catch (err) {
            console.error('Error saving income:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface-container border border-outline rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-outline">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Plus className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-lg font-semibold text-main">{t('income.addTitle')}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
                        <X className="w-5 h-5 text-secondary" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Description */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-secondary uppercase">{t('income.description')}</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder={t('income.descriptionPlaceholder')}
                                className="w-full bg-surface border border-outline rounded-xl px-4 py-3 text-main placeholder:text-secondary/50 focus:border-primary focus:outline-none"
                                required
                            />
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-secondary uppercase">{t('income.amount')}</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                            <input
                                type="number"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="0"
                                className="w-full bg-surface border border-outline rounded-xl pl-10 pr-4 py-3 text-main placeholder:text-secondary/50 focus:border-primary focus:outline-none"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                    </div>

                    {/* Category & Date Row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-secondary uppercase">{t('income.category')}</label>
                            <div className="relative">
                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full bg-surface border border-outline rounded-xl pl-9 pr-4 py-3 text-main appearance-none cursor-pointer focus:border-primary focus:outline-none"
                                >
                                    {INCOME_CATEGORIES.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{t(cat.labelKey)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-secondary uppercase">{t('income.date')}</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full bg-surface border border-outline rounded-xl pl-9 pr-4 py-3 text-main focus:border-primary focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading || !formData.description || !formData.amount}
                        className="w-full bg-primary hover:bg-primary-container text-main py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Plus className="w-5 h-5" />
                                {t('income.add')}
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
