import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
    HandCoins,
    CreditCard,
    Plus,
    Trash2,
    DollarSign,
    Calendar,
    User,
    StickyNote,
    CheckCircle2,
    X,
    ChevronDown,
    ChevronUp,
    Calculator,
    Percent,
    CalendarClock,
    Repeat
} from 'lucide-react';

export default function Loans() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('lent'); // 'lent' or 'borrowed'

    const householdId = useMemo(() => {
        if (!user?.Households?.length) return null;
        const defaultHousehold = user.Households.find(h => h.HouseholdMember.isDefault);
        return defaultHousehold ? defaultHousehold.id : user.Households[0].id;
    }, [user]);

    const formatCurrency = (amount) => {
        const currency = user?.currency || 'USD';
        const locales = {
            'USD': 'en-US',
            'EUR': 'de-DE',
            'COP': 'es-CO',
            'MXN': 'es-MX',
            'HNL': 'es-HN'
        };
        return new Intl.NumberFormat(locales[currency] || 'en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(null);
    const [expandedLoan, setExpandedLoan] = useState(null);
    const [editingLoan, setEditingLoan] = useState(null);

    const token = localStorage.getItem('token');

    // Fetch loans
    useEffect(() => {
        const fetchLoans = async () => {
            setLoading(true);
            try {
                if (!householdId) return;
                const res = await fetch(`/api/loans?type=${activeTab}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'x-household-id': householdId
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    setLoans(data);
                }
            } catch (err) {
                console.error('Error fetching loans:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLoans();
    }, [activeTab, token, householdId]);

    const handleCreateLoan = async (loanData) => {
        try {
            // alert('Sending request to /api/loans...'); // DEBUG
            const res = await fetch('/api/loans', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-household-id': householdId
                },
                body: JSON.stringify({ ...loanData, type: activeTab })
            });
            if (res.ok) {
                const newLoan = await res.json();
                setLoans([{ ...newLoan, payments: [] }, ...loans]);
                setShowModal(false);
            } else {
                const errorText = await res.text();
                console.error('Error creating loan:', errorText);
                alert('Error creating loan: ' + errorText);
            }
        } catch (err) {
            console.error('Error creating loan:', err);
            alert('Network error creating loan: ' + err.message);
        }
    };

    const handleUpdateLoan = async (loanData) => {
        try {
            const res = await fetch(`/api/loans/${editingLoan.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-household-id': householdId
                },
                body: JSON.stringify(loanData)
            });
            if (res.ok) {
                const updatedLoan = await res.json();
                setLoans(loans.map(l => l.id === editingLoan.id ? { ...updatedLoan, payments: l.payments } : l));
                setEditingLoan(null);
            } else {
                const errorText = await res.text();
                alert('Error updating loan: ' + errorText);
            }
        } catch (err) {
            console.error('Error updating loan:', err);
            alert('Network error updating loan: ' + err.message);
        }
    };

    const handleDeleteLoan = async (id) => {
        if (!confirm(t('loans.confirmDelete'))) return;
        const res = await fetch(`/api/loans/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-household-id': householdId
            }
        });
        if (res.ok) {
            setLoans(loans.filter(l => l.id !== id));
        }
    };

    const handleAddPayment = async (loanId, paymentData) => {
        const res = await fetch(`/api/loans/${loanId}/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'x-household-id': householdId
            },
            body: JSON.stringify(paymentData)
        });
        if (res.ok) {
            const payment = await res.json();
            setLoans(loans.map(l => {
                if (l.id === loanId) {
                    const newPayments = [...(l.payments || []), payment];
                    const totalPaid = newPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
                    return {
                        ...l,
                        payments: newPayments,
                        status: totalPaid >= parseFloat(l.amount) ? 'paid' : 'active'
                    };
                }
                return l;
            }));
            setShowPaymentModal(null);
        }
    };

    const handleMarkPaid = async (id) => {
        const res = await fetch(`/api/loans/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'x-household-id': householdId
            },
            body: JSON.stringify({ status: 'paid' })
        });
        if (res.ok) {
            setLoans(loans.map(l => l.id === id ? { ...l, status: 'paid' } : l));
        }
    };

    const getBalance = (loan) => {
        const paid = (loan.payments || []).reduce((sum, p) => sum + parseFloat(p.amount), 0);

        const principal = parseFloat(loan.amount);
        const rate = parseFloat(loan.interestRate || 0);
        let totalToPay = 0;

        if (loan.interestType === 'effective_annual' && loan.installments > 1) {
            // Effective Annual Rate calculation
            const annualRateDecimal = rate / 100;
            const monthlyRate = Math.pow(1 + annualRateDecimal, 1 / 12) - 1;
            const pmt = principal * (monthlyRate * Math.pow(1 + monthlyRate, loan.installments)) / (Math.pow(1 + monthlyRate, loan.installments) - 1);
            totalToPay = pmt * loan.installments;
        } else {
            // Simple Interest
            const interest = principal * (rate / 100);
            totalToPay = principal + interest;
        }

        return totalToPay - paid;
    };

    const activeLoans = loans.filter(l => l.status === 'active');
    const paidLoans = loans.filter(l => l.status === 'paid');
    const totalActive = activeLoans.reduce((sum, l) => sum + getBalance(l), 0);

    return (
        <div className="min-h-screen bg-main pb-24 md:pb-8">
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-main">{t('loans.title')}</h1>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary px-4 py-2 rounded-xl transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        {t('loans.add')}
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-surface-container border border-outline rounded-xl">
                    <button
                        onClick={() => setActiveTab('lent')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'lent'
                            ? 'bg-primary-container text-on-primary-container shadow-sm'
                            : 'text-on-surface-variant hover:text-on-surface'
                            }`}
                    >
                        <HandCoins className="w-5 h-5" />
                        {t('loans.lent')}
                    </button>
                    <button
                        onClick={() => setActiveTab('borrowed')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'borrowed'
                            ? 'bg-primary-container text-on-primary-container shadow-sm'
                            : 'text-on-surface-variant hover:text-on-surface'
                            }`}
                    >
                        <CreditCard className="w-5 h-5" />
                        {t('loans.borrowed')}
                    </button>
                </div>

                {/* Summary KPI */}
                <div className="bg-surface-container border border-outline rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-secondary uppercase font-medium">
                                {activeTab === 'lent' ? t('loans.totalOwedToYou') : t('loans.totalYouOwe')}
                            </p>
                            <p className={`text-2xl font-bold ${activeTab === 'lent' ? 'text-primary' : 'text-error'}`}>
                                {formatCurrency(totalActive)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-secondary">{activeLoans.length} {t('loans.active')}</p>
                            <p className="text-xs text-secondary">{paidLoans.length} {t('loans.completed')}</p>
                        </div>
                    </div>
                </div>

                {/* Loans List */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="text-center py-12 text-secondary">{t('common.loading')}</div>
                    ) : loans.length === 0 ? (
                        <div className="text-center py-12 text-secondary">
                            <p>{t('loans.empty')}</p>
                        </div>
                    ) : (
                        loans.map((loan) => {
                            const balance = getBalance(loan);
                            const isExpanded = expandedLoan === loan.id;
                            const isPaid = loan.status === 'paid';

                            return (
                                <div
                                    key={loan.id}
                                    className={`bg-surface-container border border-outline rounded-xl overflow-hidden transition-opacity ${isPaid ? 'opacity-60' : ''}`}
                                >
                                    {/* Loan Header */}
                                    <button
                                        onClick={() => setExpandedLoan(isExpanded ? null : loan.id)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-surface-container-high transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${isPaid ? 'bg-success/10' : 'bg-primary/10'}`}>
                                                <User className={`w-5 h-5 ${isPaid ? 'text-success' : 'text-primary'}`} />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-semibold text-main">{loan.personName}</p>
                                                <p className="text-xs text-secondary">
                                                    {new Date(loan.date).toLocaleDateString()}
                                                    {loan.dueDate && ` → ${new Date(loan.dueDate).toLocaleDateString()}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className={`font-bold ${isPaid ? 'text-success' : activeTab === 'lent' ? 'text-primary' : 'text-error'}`}>
                                                    {formatCurrency(balance)}
                                                </p>
                                                <p className="text-xs text-secondary">
                                                    {t('loans.of')} {formatCurrency(parseFloat(loan.amount) + (getBalance(loan) + (loan.payments || []).reduce((sum, p) => sum + parseFloat(p.amount), 0)) - parseFloat(loan.amount))}
                                                </p>
                                                {loan.installments > 1 && (
                                                    <p className="text-[10px] text-primary mt-0.5">
                                                        {loan.payments?.length || 0}/{loan.installments} {t('loans.installments')}
                                                    </p>
                                                )}
                                            </div>
                                            {isExpanded ? (
                                                <ChevronUp className="w-5 h-5 text-secondary" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-secondary" />
                                            )}
                                        </div>
                                    </button>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="border-t border-outline">
                                            {/* Notes */}
                                            {loan.notes && (
                                                <div className="px-4 py-3 bg-surface/50 flex items-start gap-2">
                                                    <StickyNote className="w-4 h-4 text-secondary mt-0.5" />
                                                    <p className="text-sm text-secondary">{loan.notes}</p>
                                                </div>
                                            )}

                                            {/* Payments History */}
                                            {loan.payments && loan.payments.length > 0 && (
                                                <div className="px-4 py-2">
                                                    <p className="text-xs text-secondary uppercase font-medium mb-2">{t('loans.payments')}</p>
                                                    {loan.payments.map((payment, i) => (
                                                        <div key={i} className="flex justify-between py-1.5 border-b border-outline/50 last:border-0">
                                                            <span className="text-sm text-secondary">
                                                                {new Date(payment.date).toLocaleDateString()}
                                                            </span>
                                                            <span className="text-sm font-medium text-success">
                                                                +{formatCurrency(payment.amount)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Actions */}
                                            {!isPaid && (
                                                <div className="flex border-t border-outline">
                                                    <button
                                                        onClick={() => setShowPaymentModal(loan.id)}
                                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-primary hover:bg-primary/5 transition-colors"
                                                    >
                                                        <DollarSign className="w-4 h-4" />
                                                        <span className="text-sm font-medium">{t('loans.addPayment')}</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleMarkPaid(loan.id)}
                                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-success hover:bg-success/5 transition-colors border-l border-outline"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        <span className="text-sm font-medium">{t('loans.markPaid')}</span>
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingLoan(loan)}
                                                        className="flex items-center justify-center px-4 py-3 text-secondary hover:bg-secondary/5 transition-colors border-l border-outline"
                                                    >
                                                        <StickyNote className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteLoan(loan.id)}
                                                        className="flex items-center justify-center px-4 py-3 text-error hover:bg-error/5 transition-colors border-l border-outline"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                            {isPaid && (
                                                <div className="flex border-t border-outline">
                                                    <button
                                                        onClick={() => setEditingLoan(loan)}
                                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-secondary hover:bg-secondary/5 transition-colors"
                                                    >
                                                        <StickyNote className="w-4 h-4" />
                                                        <span className="text-sm font-medium">{t('loans.edit')}</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteLoan(loan.id)}
                                                        className="flex items-center justify-center px-4 py-3 text-error hover:bg-error/5 transition-colors border-l border-outline"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Edit Loan Modal */}
            {editingLoan && (
                <LoanModal
                    initialData={editingLoan}
                    onClose={() => setEditingLoan(null)}
                    onSave={handleUpdateLoan}
                    type={activeTab}
                />
            )}

            {/* Create Loan Modal */}
            {showModal && (
                <LoanModal
                    onClose={() => setShowModal(false)}
                    onSave={handleCreateLoan}
                    type={activeTab}
                />
            )}

            {/* Add Payment Modal */}
            {showPaymentModal && (
                <PaymentModal
                    onClose={() => setShowPaymentModal(null)}
                    onSave={(data) => handleAddPayment(showPaymentModal, data)}
                    type={activeTab}
                />
            )}
        </div>
    );
}

// Loan Creation Modal
function LoanModal({ onClose, onSave, type, initialData }) {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [advancedMode, setAdvancedMode] = useState(false);
    const [formData, setFormData] = useState({
        personName: initialData?.personName || '',
        amount: initialData?.amount || '',
        date: initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        dueDate: initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
        notes: initialData?.notes || '',
        installments: initialData?.installments || 1,
        interestRate: initialData?.interestRate || 0,
        interestType: initialData?.interestType || user?.defaultInterestType || 'simple',
        paymentFrequency: initialData?.paymentFrequency || 'monthly'
    });
    const [loading, setLoading] = useState(false);
    const [isAdvanced, setIsAdvanced] = useState(!!initialData?.installments && initialData.installments > 1);

    const totalWithInterest = useMemo(() => {
        const principal = parseFloat(formData.amount) || 0;
        const rate = parseFloat(formData.interestRate) || 0;

        if (formData.interestType === 'effective_annual' && formData.installments > 1) {
            const annualRateDecimal = rate / 100;
            const monthlyRate = Math.pow(1 + annualRateDecimal, 1 / 12) - 1;
            const pmt = principal * (monthlyRate * Math.pow(1 + monthlyRate, formData.installments)) / (Math.pow(1 + monthlyRate, formData.installments) - 1);
            return pmt * formData.installments;
        } else {
            const interest = principal * (rate / 100);
            return principal + interest;
        }
    }, [formData.amount, formData.interestRate, formData.interestType, formData.installments]);

    const monthlyPayment = useMemo(() => {
        if (!formData.installments || formData.installments < 1) return totalWithInterest;
        return totalWithInterest / parseInt(formData.installments);
    }, [totalWithInterest, formData.installments]);

    const paymentSchedule = useMemo(() => {
        if (!formData.dueDate || !formData.installments || formData.installments < 1) return [];
        const schedule = [];
        const startDate = new Date(formData.dueDate);
        // Adjust for timezone offset to keep the date correct
        const userTimezoneOffset = startDate.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(startDate.getTime() + userTimezoneOffset);

        for (let i = 0; i < formData.installments; i++) {
            const date = new Date(adjustedDate);
            if (formData.paymentFrequency === 'monthly') {
                date.setMonth(date.getMonth() + i);
            } else if (formData.paymentFrequency === 'biweekly') {
                date.setDate(date.getDate() + (i * 14));
            } else if (formData.paymentFrequency === 'weekly') {
                date.setDate(date.getDate() + (i * 7));
            }
            schedule.push(date);
        }
        return schedule;
    }, [formData.dueDate, formData.installments, formData.paymentFrequency]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        // alert('Submit clicked. Name: ' + formData.personName + ', Amount: ' + formData.amount); // DEBUG
        if (!formData.personName || !formData.amount) {
            alert('Please fill in all required fields');
            return;
        }
        setLoading(true);
        try {
            await onSave({
                ...formData,
                amount: parseFloat(formData.amount),
                dueDate: formData.dueDate ? formData.dueDate : null,
                installments: parseInt(formData.installments) || 1,
                interestRate: parseFloat(formData.interestRate) || 0,
                interestType: formData.interestType || 'simple',
                paymentFrequency: formData.paymentFrequency || 'monthly'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface-container border border-outline rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between p-4 border-b border-outline">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                            {type === 'lent' ? <HandCoins className="w-5 h-5 text-primary" /> : <CreditCard className="w-5 h-5 text-primary" />}
                        </div>
                        <h2 className="text-lg font-semibold text-main">
                            {initialData ? t('loans.edit') : (type === 'lent' ? t('loans.addLent') : t('loans.addBorrowed'))}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
                        <X className="w-5 h-5 text-secondary" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-secondary uppercase">{t('loans.person')}</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                            <input
                                type="text"
                                value={formData.personName}
                                onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                                placeholder={type === 'lent' ? t('loans.personPlaceholderLent') : t('loans.personPlaceholderBorrowed')}
                                className="w-full bg-surface border border-outline rounded-xl pl-10 pr-4 py-3 text-main placeholder:text-secondary/50 focus:border-primary focus:outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-secondary uppercase">{t('loans.amount')}</label>
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


                    {/* Advanced Mode Toggle */}
                    <div className="flex items-center justify-between py-2">
                        <button
                            type="button"
                            onClick={() => setIsAdvanced(!isAdvanced)}
                            className="text-sm font-medium text-primary flex items-center gap-2 hover:text-primary-hover transition-colors"
                        >
                            <Calculator className="w-4 h-4" />
                            {isAdvanced ? t('loans.simpleMode') : t('loans.advancedMode')}
                        </button>
                    </div>

                    {isAdvanced && (
                        <div className="space-y-4 p-4 bg-surface-container-high rounded-xl animate-fade-in">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-secondary uppercase">{t('loans.installments')}</label>
                                    <input
                                        type="number"
                                        value={formData.installments}
                                        onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
                                        className="w-full bg-surface border border-outline rounded-xl px-4 py-3 text-main focus:border-primary focus:outline-none"
                                        min="1"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-secondary uppercase">{t('loans.interestRate')} (%)</label>
                                    <div className="relative">
                                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                                        <input
                                            type="number"
                                            value={formData.interestRate}
                                            onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                                            className="w-full bg-surface border border-outline rounded-xl pl-9 pr-4 py-3 text-main focus:border-primary focus:outline-none"
                                            min="0"
                                            step="0.1"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-secondary uppercase">{t('loans.interestType')}</label>
                                <div className="flex p-1 bg-surface border border-outline rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, interestType: 'simple' })}
                                        className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${formData.interestType === 'simple'
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-secondary hover:text-main'
                                            }`}
                                    >
                                        {t('loans.simple')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, interestType: 'effective_annual' })}
                                        className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${formData.interestType === 'effective_annual'
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-secondary hover:text-main'
                                            }`}
                                    >
                                        {t('loans.effectiveAnnual')}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-secondary uppercase">{t('loans.paymentFrequency')}</label>
                                    <select
                                        value={formData.paymentFrequency}
                                        onChange={(e) => setFormData({ ...formData, paymentFrequency: e.target.value })}
                                        className="w-full bg-surface border border-outline rounded-xl px-4 py-3 text-main focus:border-primary focus:outline-none"
                                    >
                                        <option value="monthly">{t('loans.monthly')}</option>
                                        <option value="biweekly">{t('loans.biweekly')}</option>
                                        <option value="weekly">{t('loans.weekly')}</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-secondary uppercase">
                                        {isAdvanced ? t('loans.firstPaymentDate') : t('loans.dueDate')}
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                                        <input
                                            type="date"
                                            value={formData.dueDate}
                                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                            className="w-full bg-surface border border-outline rounded-xl pl-9 pr-4 py-3 text-main focus:border-primary focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {paymentSchedule.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-secondary uppercase">{t('loans.paymentSchedule')}</h3>
                                    <div className="max-h-32 overflow-y-auto border border-outline rounded-xl p-3 bg-surface">
                                        {paymentSchedule.map((date, index) => (
                                            <div key={index} className="flex justify-between text-xs py-1 border-b border-outline/50 last:border-b-0">
                                                <span className="text-main">{t('loans.installment')} {index + 1}</span>
                                                <span className="text-secondary">{date.toLocaleDateString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Summary */}
                            <div className="pt-2 border-t border-outline/50 space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-secondary">{t('loans.totalToPay')}</span>
                                    <span className="font-bold text-main">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalWithInterest)}
                                    </span>
                                </div>
                                {formData.installments > 1 && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-secondary">{t('loans.monthlyPayment')}</span>
                                        <span className="text-primary">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(monthlyPayment)} / {t('loans.month')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-secondary uppercase">{t('loans.date')}</label>
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
                        {!isAdvanced && (
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-secondary uppercase">{t('loans.dueDate')}</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                                    <input
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        className="w-full bg-surface border border-outline rounded-xl pl-9 pr-4 py-3 text-main focus:border-primary focus:outline-none"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-secondary uppercase">{t('loans.notes')}</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder={t('loans.notesPlaceholder')}
                            className="w-full bg-surface border border-outline rounded-xl px-4 py-3 text-main placeholder:text-secondary/50 focus:border-primary focus:outline-none resize-none h-20"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !formData.personName || !formData.amount}
                        className="w-full bg-primary hover:bg-primary-container text-on-primary py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : t('loans.save')}
                    </button>
                </form>
            </div >
        </div >
    );
}

// Payment Modal
function PaymentModal({ onClose, onSave, type }) {
    const { t } = useTranslation();
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [destination, setDestination] = useState('none'); // 'income', 'savings', 'none'
    const [source, setSource] = useState('none'); // 'savings', 'expense', 'none'
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount) return;
        setLoading(true);
        try {
            await onSave({
                amount: parseFloat(amount),
                date,
                notes,
                destination: type === 'lent' ? destination : undefined,
                source: type === 'borrowed' ? source : undefined
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface-container border border-outline rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between p-4 border-b border-outline">
                    <h2 className="text-lg font-semibold text-main">{t('loans.registerPayment')}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-surface-container-high rounded-full">
                        <X className="w-5 h-5 text-secondary" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-secondary uppercase">{t('loans.amount')}</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0"
                                className="w-full bg-surface border border-outline rounded-xl pl-10 pr-4 py-3 text-main focus:border-primary focus:outline-none"
                                min="0"
                                step="0.01"
                                required
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-secondary uppercase">{t('loans.date')}</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full bg-surface border border-outline rounded-xl px-4 py-3 text-main focus:border-primary focus:outline-none"
                        />
                    </div>

                    {/* Destination Selector (For Lent Loans) */}
                    {type === 'lent' && (
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-secondary uppercase">{t('loans.destination')}</label>
                            <select
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                                className="w-full bg-surface border border-outline rounded-xl px-4 py-3 text-main focus:border-primary focus:outline-none"
                            >
                                <option value="none">{t('loans.destNone')}</option>
                                <option value="income">{t('loans.destIncome')}</option>
                                <option value="savings">{t('loans.destSavings')}</option>
                            </select>
                            <p className="text-[10px] text-secondary">
                                {destination === 'income' && t('loans.destIncomeDesc')}
                                {destination === 'savings' && t('loans.destSavingsDesc')}
                                {destination === 'none' && t('loans.destNoneDesc')}
                            </p>
                        </div>
                    )}

                    {/* Source Selector (For Borrowed Loans) */}
                    {type === 'borrowed' && (
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-secondary uppercase">{t('loans.payFrom')}</label>
                            <select
                                value={source}
                                onChange={(e) => setSource(e.target.value)}
                                className="w-full bg-surface border border-outline rounded-xl px-4 py-3 text-main focus:border-primary focus:outline-none"
                            >
                                <option value="none">{t('loans.sourceNone')}</option>
                                <option value="expense">{t('loans.sourceExpense')}</option>
                                <option value="savings">{t('loans.sourceSavings')}</option>
                            </select>
                            <p className="text-[10px] text-secondary">
                                {source === 'expense' && t('loans.sourceExpenseDesc')}
                                {source === 'savings' && t('loans.sourceSavingsDesc')}
                                {source === 'none' && t('loans.sourceNoneDesc')}
                            </p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !amount}
                        className="w-full bg-primary hover:bg-primary-container text-on-primary py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : t('loans.save')}
                    </button>
                </form>
            </div>
        </div>
    );
}
