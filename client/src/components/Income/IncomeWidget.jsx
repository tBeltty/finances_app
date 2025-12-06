import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Plus, Trash2, Briefcase } from 'lucide-react';
import IncomeModal from './IncomeModal';

export default function IncomeWidget({
    mainIncome,
    formatCurrency,
    selectedMonth,
    token
}) {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);
    const [extraIncomes, setExtraIncomes] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // Fetch extra incomes for the month
    useEffect(() => {
        const fetchIncomes = async () => {
            if (!token) return;
            try {
                const res = await fetch(`/api/incomes?month=${selectedMonth}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setExtraIncomes(data);
                }
            } catch (err) {
                console.error('Error fetching incomes:', err);
            }
        };
        fetchIncomes();
    }, [selectedMonth, token]);

    const handleAddIncome = async (incomeData) => {
        const res = await fetch('/api/incomes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(incomeData)
        });
        if (res.ok) {
            const newIncome = await res.json();
            setExtraIncomes([newIncome, ...extraIncomes]);
        }
    };

    const handleDeleteIncome = async (id) => {
        const res = await fetch(`/api/incomes/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            setExtraIncomes(extraIncomes.filter(i => i.id !== id));
        }
    };

    const extraTotal = extraIncomes.reduce((sum, i) => sum + parseFloat(i.amount), 0);
    const totalIncome = (mainIncome || 0) + extraTotal;
    const hasExtras = extraIncomes.length > 0;

    return (
        <>
            <div className="bg-surface-container border border-outline rounded-xl overflow-hidden">
                {/* Header - always visible */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full flex items-center justify-between p-4 hover:bg-surface-container-high transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Briefcase className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-secondary uppercase font-medium">{t('income.title')}</p>
                            <p className="text-xl font-bold text-main">{formatCurrency(totalIncome)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {hasExtras && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                +{extraIncomes.length}
                            </span>
                        )}
                        {expanded ? (
                            <ChevronUp className="w-5 h-5 text-secondary" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-secondary" />
                        )}
                    </div>
                </button>

                {/* Expanded content */}
                {expanded && (
                    <div className="border-t border-outline">
                        {/* Main income */}
                        <div className="flex items-center justify-between px-4 py-3 bg-surface/50">
                            <span className="text-sm text-secondary">{t('income.mainSalary')}</span>
                            <span className="text-sm font-medium text-main">{formatCurrency(mainIncome || 0)}</span>
                        </div>

                        {/* Extra incomes list */}
                        {extraIncomes.map((income) => (
                            <div key={income.id} className="flex items-center justify-between px-4 py-3 border-t border-outline/50 group">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                        {t(`income.categories.${income.category || 'other'}`)}
                                    </span>
                                    <span className="text-sm text-main">{income.description}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-primary">+{formatCurrency(income.amount)}</span>
                                    <button
                                        onClick={() => handleDeleteIncome(income.id)}
                                        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-full transition-all"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-400" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Add button */}
                        <button
                            onClick={() => setShowModal(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-t border-outline text-primary hover:bg-primary/5 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="text-sm font-medium">{t('income.addExtra')}</span>
                        </button>
                    </div>
                )}
            </div>

            <IncomeModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleAddIncome}
                formatCurrency={formatCurrency}
            />
        </>
    );
}
