import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Calculator, TrendingDown, Calendar, DollarSign } from 'lucide-react';

/**
 * Debt Projection Tool Modal
 * Shows how extra payments affect payoff date and interest saved.
 */
export default function DebtProjection({ loan, onClose, formatCurrency }) {
    const { t } = useTranslation();
    const [extraPayment, setExtraPayment] = useState(0);

    // Calculate current payoff info
    const currentPayoff = useMemo(() => {
        const principal = parseFloat(loan.amount);
        const rate = parseFloat(loan.interestRate || 0);
        const installments = parseInt(loan.installments) || 1;
        const paid = (loan.payments || []).reduce((sum, p) => sum + parseFloat(p.amount), 0);

        let totalToPay = 0;
        let monthlyPayment = 0;

        if (loan.interestType === 'effective_annual' && installments > 1) {
            const annualRateDecimal = rate / 100;
            const monthlyRate = Math.pow(1 + annualRateDecimal, 1 / 12) - 1;
            monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, installments)) / (Math.pow(1 + monthlyRate, installments) - 1);
            totalToPay = monthlyPayment * installments;
        } else {
            const interest = principal * (rate / 100);
            totalToPay = principal + interest;
            monthlyPayment = totalToPay / installments;
        }

        const remaining = totalToPay - paid;
        const remainingMonths = Math.ceil(remaining / monthlyPayment);
        const totalInterest = totalToPay - principal;

        return {
            remaining,
            remainingMonths,
            monthlyPayment,
            totalInterest,
            totalToPay
        };
    }, [loan]);

    // Calculate projection with extra payment
    const projection = useMemo(() => {
        if (extraPayment <= 0) return null;

        const remaining = currentPayoff.remaining;
        const newMonthlyPayment = currentPayoff.monthlyPayment + parseFloat(extraPayment);
        const newRemainingMonths = Math.ceil(remaining / newMonthlyPayment);
        const monthsSaved = currentPayoff.remainingMonths - newRemainingMonths;

        // Estimate interest saved (simplified)
        const monthlyInterestRate = (parseFloat(loan.interestRate || 0) / 100) / 12;
        const interestSaved = monthsSaved * remaining * monthlyInterestRate * 0.5; // Rough estimate

        return {
            newRemainingMonths,
            monthsSaved,
            interestSaved: Math.max(0, interestSaved)
        };
    }, [extraPayment, currentPayoff, loan.interestRate]);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface-container border border-outline rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between p-4 border-b border-outline">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Calculator className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-lg font-semibold text-main">{t('loans.projection.title')}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
                        <X className="w-5 h-5 text-secondary" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Current Status */}
                    <div className="bg-surface rounded-xl p-4 space-y-2">
                        <h3 className="text-sm font-medium text-secondary uppercase">{t('loans.projection.currentStatus')}</h3>
                        <div className="flex justify-between">
                            <span className="text-secondary">{t('loans.projection.remaining')}</span>
                            <span className="font-bold text-main">{formatCurrency(currentPayoff.remaining)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-secondary">{t('loans.projection.monthlyPayment')}</span>
                            <span className="text-main">{formatCurrency(currentPayoff.monthlyPayment)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-secondary">{t('loans.projection.remainingMonths')}</span>
                            <span className="text-main">{currentPayoff.remainingMonths} {t('loans.projection.months')}</span>
                        </div>
                    </div>

                    {/* Extra Payment Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary uppercase">{t('loans.projection.extraPayment')}</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                            <input
                                type="number"
                                value={extraPayment || ''}
                                onChange={(e) => setExtraPayment(parseFloat(e.target.value) || 0)}
                                placeholder="0"
                                className="w-full bg-surface border border-outline rounded-xl pl-10 pr-4 py-3 text-main placeholder:text-secondary/50 focus:border-primary focus:outline-none"
                                min="0"
                                step="10"
                            />
                        </div>
                        <p className="text-xs text-secondary">{t('loans.projection.extraPaymentDesc')}</p>
                    </div>

                    {/* Projection Results */}
                    {projection && projection.monthsSaved > 0 && (
                        <div className="bg-success/10 border border-success/20 rounded-xl p-4 space-y-2 animate-fade-in">
                            <div className="flex items-center gap-2 text-success">
                                <TrendingDown className="w-5 h-5" />
                                <h3 className="font-medium">{t('loans.projection.savings')}</h3>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-secondary">{t('loans.projection.newPayoff')}</span>
                                <span className="font-bold text-success">{projection.newRemainingMonths} {t('loans.projection.months')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-secondary">{t('loans.projection.timeSaved')}</span>
                                <span className="font-bold text-success">{projection.monthsSaved} {t('loans.projection.months')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-secondary">{t('loans.projection.interestSaved')}</span>
                                <span className="font-bold text-success">~{formatCurrency(projection.interestSaved)}</span>
                            </div>
                        </div>
                    )}

                    {projection && projection.monthsSaved <= 0 && (
                        <div className="bg-secondary/10 border border-outline rounded-xl p-4 text-center text-secondary text-sm">
                            {t('loans.projection.noImpact')}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-outline">
                    <button
                        onClick={onClose}
                        className="w-full bg-surface hover:bg-surface-container-high text-main py-3 rounded-xl font-medium transition-colors border border-outline"
                    >
                        {t('common.close')}
                    </button>
                </div>
            </div>
        </div>
    );
}
