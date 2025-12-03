import React, { useState, useEffect } from 'react';
import { Sparkles, DollarSign, Plus, ArrowRight, Check, Loader2, Globe, Languages } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import CustomSelect from '../../components/Inputs/CustomSelect';

export default function Onboarding({ onComplete }) {
    const { user, refreshUser } = useAuth();
    const { t, i18n } = useTranslation();
    const [step, setStep] = useState(0); // Start at 0 for Language Selection
    const [income, setIncome] = useState('');
    const [initialSavings, setInitialSavings] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [fixedExpenses, setFixedExpenses] = useState([]);
    const [newExpense, setNewExpense] = useState({ name: '', amount: '', type: 'Fijo' });
    const [autoSavingsType, setAutoSavingsType] = useState('NONE');
    const [autoSavingsValue, setAutoSavingsValue] = useState('');
    const [showSuggestion, setShowSuggestion] = useState(false);
    const [showStartSuggestion, setShowStartSuggestion] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const getCurrencySymbol = (code) => {
        switch (code) {
            case 'EUR': return '€';
            case 'HNL': return 'L';
            case 'GBP': return '£';
            default: return '$';
        }
    };

    const currencies = [
        { code: 'USD', label: t('currencies.USD'), locale: 'en-US' },
        { code: 'COP', label: t('currencies.COP'), locale: 'es-CO' },
        { code: 'EUR', label: t('currencies.EUR'), locale: 'es-ES' },
        { code: 'MXN', label: t('currencies.MXN'), locale: 'es-MX' },
        { code: 'ARS', label: t('currencies.ARS'), locale: 'es-AR' },
        { code: 'HNL', label: t('currencies.HNL'), locale: 'es-HN' }
    ];

    const languages = [
        { code: 'en', label: 'English', icon: '🇺🇸' },
        { code: 'es', label: 'Español', icon: '🇪🇸' }
    ];

    const handleLanguageSelect = async (langCode) => {
        i18n.changeLanguage(langCode);
        try {
            const token = localStorage.getItem('token');
            await fetch('/api/auth/update-language', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ language: langCode })
            });
        } catch (error) {
            console.error('Error updating language:', error);
        }
        // Removed auto-advance: setStep(1);
    };

    useEffect(() => {
        if (step === 5 && fixedExpenses.length === 0) {
            const timer = setTimeout(() => {
                setShowSuggestion(true);
            }, 1000); // Delay slightly for effect

            const hideTimer = setTimeout(() => {
                setShowSuggestion(false);
            }, 8000); // Hide after 8 seconds

            return () => {
                clearTimeout(timer);
                clearTimeout(hideTimer);
            };
        } else {
            setShowSuggestion(false);
        }
    }, [step, fixedExpenses.length]);

    useEffect(() => {
        if (step === 1) {
            const timer = setTimeout(() => {
                setShowStartSuggestion(true);
            }, 1500);
            return () => clearTimeout(timer);
        } else {
            setShowStartSuggestion(false);
        }
    }, [step]);

    const handleAddExpense = (e) => {
        e.preventDefault();
        if (newExpense.name && newExpense.amount) {
            setFixedExpenses([...fixedExpenses, { ...newExpense, amount: parseFloat(newExpense.amount) }]);
            setNewExpense({ name: '', amount: '' });
        }
    };

    const handleRemoveExpense = (index) => {
        setFixedExpenses(fixedExpenses.filter((_, i) => i !== index));
    };

    const handleUpdateExpense = (index, field, value) => {
        const updatedExpenses = [...fixedExpenses];
        updatedExpenses[index] = { ...updatedExpenses[index], [field]: value };
        setFixedExpenses(updatedExpenses);
    };

    const handleComplete = async () => {
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            // 1. Update Currency
            await fetch('/api/auth/update-currency', {
                method: 'PUT',
                headers,
                body: JSON.stringify({ currency })
            });

            // 2. Update Income
            if (income) {
                await fetch('/api/auth/update-income', {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({ income: parseFloat(income) })
                });
            }

            // 3. Get User to find Default Household
            const userRes = await fetch('/api/auth/me', { headers });
            const userData = await userRes.json();
            const defaultHousehold = userData.Households.find(h => h.HouseholdMember.isDefault) || userData.Households[0];

            if (!defaultHousehold) {
                throw new Error(t('common.error'));
            }

            const householdHeaders = {
                ...headers,
                'X-Household-Id': defaultHousehold.id
            };

            // 3.5 Update Auto Savings Settings
            if (autoSavingsType !== 'NONE') {
                await fetch('/api/households/settings', {
                    method: 'PUT',
                    headers: householdHeaders,
                    body: JSON.stringify({
                        savingsGoalType: autoSavingsType,
                        savingsGoalValue: parseFloat(autoSavingsValue) || 0
                    })
                });
            }

            // 4. Create Templates
            const templates = [
                { name: t('defaultCategories.utilities'), color: 'blue' },
                { name: t('defaultCategories.home'), color: 'green' },
                { name: t('defaultCategories.transport'), color: 'amber' },
                { name: t('defaultCategories.credits'), color: 'rose' },
                { name: t('defaultCategories.fixedExpenses'), color: 'slate' }
            ];

            for (const template of templates) {
                try {
                    await fetch('/api/categories', {
                        method: 'POST',
                        headers: householdHeaders,
                        body: JSON.stringify(template)
                    });
                } catch (e) {
                    console.error('Error creating template category:', e);
                }
            }

            // 5. Set Initial Savings
            if (initialSavings) {
                await fetch('/api/savings', {
                    method: 'POST',
                    headers: householdHeaders,
                    body: JSON.stringify({ amount: parseFloat(initialSavings), operation: 'set' })
                });
            }

            // 6. Create Fixed Expenses
            if (fixedExpenses.length > 0) {
                const today = new Date().toISOString().split('T')[0];
                const currentMonth = `${String(new Date().getMonth() + 1).padStart(2, '0')}-${new Date().getFullYear()}`;

                // Fetch categories to find "Gastos Fijos"
                const catRes = await fetch('/api/categories', { headers: householdHeaders });
                const categories = await catRes.json();
                const fixedCategory = categories.find(c => c.name === t('defaultCategories.fixedExpenses'));

                if (fixedCategory) {
                    for (const expense of fixedExpenses) {
                        await fetch('/api/expenses', {
                            method: 'POST',
                            headers: householdHeaders,
                            body: JSON.stringify({
                                name: expense.name,
                                amount: expense.amount,
                                type: 'Fijo',
                                categoryId: fixedCategory.id,
                                month: currentMonth,
                                date: today
                            })
                        });
                    }
                }
            }

            // 7. Complete Onboarding
            const onboardingRes = await fetch('/api/auth/onboarding/complete', {
                method: 'POST',
                headers
            });

            if (!onboardingRes.ok) throw new Error('Error completing onboarding');

            await refreshUser();
            onComplete();
        } catch (error) {
            console.error('Error completing onboarding:', error);
            setError(error.message || t('common.error'));
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
            <div className="max-w-2xl w-full">
                {/* Step 0: Language Selection */}
                {step === 0 && (
                    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 p-10 text-center space-y-8">
                        <div className="flex justify-center">
                            <div className="bg-indigo-500/10 p-4 rounded-full">
                                <Languages className="h-12 w-12 text-indigo-400" />
                            </div>
                        </div>
                        <div className="space-y-4 px-4">
                            <h1 className="text-3xl font-bold text-white">{t('onboarding.languageSelect')}</h1>
                            <p className="text-slate-400 text-lg leading-relaxed">
                                {t('onboarding.languageSelectSubtitle')}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => handleLanguageSelect(lang.code)}
                                    className={`flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-medium transition-all border ${i18n.language === lang.code
                                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-indigo-500 hover:text-white'
                                        }`}
                                >
                                    <span className="text-2xl">{lang.icon}</span>
                                    <span className="text-lg">{lang.label}</span>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setStep(1)}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-6 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 mt-8"
                        >
                            {t('common.next')}
                            <ArrowRight className="h-5 w-5" />
                        </button>
                    </div>
                )}

                {/* Step 1: Welcome */}
                {step === 1 && (
                    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 p-10 text-center space-y-8">
                        <div className="flex justify-center">
                            <div className="bg-indigo-500/10 p-4 rounded-full">
                                <Sparkles className="h-12 w-12 text-indigo-400" />
                            </div>
                        </div>
                        <div className="space-y-4 px-4">
                            <h1 className="text-3xl font-bold text-white">{t('onboarding.welcome')}</h1>
                            <p className="text-slate-400 text-lg leading-relaxed">
                                {t('onboarding.subtitle')}
                            </p>
                            <div className="mt-6 text-center max-w-lg mx-auto">
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    {t('onboarding.features.households')} • {t('onboarding.features.savings')} • {t('onboarding.features.security')}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep(0)}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 px-6 rounded-xl font-medium transition-colors"
                            >
                                {t('common.back')}
                            </button>
                            <div className="relative flex-1">
                                <button
                                    onClick={() => setStep(2)}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-6 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    {t('onboarding.getStarted')}
                                    <ArrowRight className="h-5 w-5" />
                                </button>
                                {showStartSuggestion && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-40 animate-in fade-in slide-in-from-bottom-2 z-50">
                                        <div className="bg-indigo-600 text-white text-sm font-bold py-2 px-4 rounded-xl shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 relative">
                                            <span>{t('onboarding.suggestion.letsStart')}</span>
                                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-indigo-600 rotate-45"></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Currency & Income */}
                {step === 2 && (
                    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 p-10 space-y-8">
                        <div className="space-y-3 px-2">
                            <h2 className="text-2xl font-bold text-white">{t('onboarding.steps.currency')}</h2>
                            <p className="text-slate-400 leading-relaxed">{t('onboarding.currencySelect')}</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">{t('onboarding.steps.currency')}</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {currencies.map((c) => (
                                        <button
                                            key={c.code}
                                            onClick={() => setCurrency(c.code)}
                                            className={`p-3 rounded-xl border text-left transition-all ${currency === c.code
                                                ? 'bg-indigo-600/20 border-indigo-500 text-white'
                                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                                                }`}
                                        >
                                            <div className="font-bold">{c.code}</div>
                                            <div className="text-xs opacity-70">{c.label}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>



                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">{t('onboarding.monthlyIncome')}</label>
                                <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 rounded-xl px-5 py-4">
                                    <span className="text-slate-400 text-xl font-bold w-6 text-center">{getCurrencySymbol(currency)}</span>
                                    <input
                                        type="number"
                                        value={income}
                                        onChange={(e) => setIncome(e.target.value)}
                                        placeholder={t('onboarding.incomePlaceholder')}
                                        className="flex-1 bg-transparent text-white text-xl font-bold focus:outline-none placeholder:text-slate-600"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-2">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 px-6 rounded-xl font-medium transition-colors"
                            >
                                {t('common.back')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep(3)}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-6 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                {t('common.next')}
                                <ArrowRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Initial Savings */}
                {step === 3 && (
                    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 p-10 space-y-8">
                        <div className="space-y-3 px-2">
                            <h2 className="text-2xl font-bold text-white">{t('onboarding.steps.savings')}</h2>
                            <p className="text-slate-400 leading-relaxed">
                                {t('onboarding.savingsDesc')}
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">{t('onboarding.savingsInput')}</label>
                                <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 rounded-xl px-5 py-4">
                                    <span className="text-slate-400 text-xl font-bold w-6 text-center">{getCurrencySymbol(currency)}</span>
                                    <input
                                        type="number"
                                        value={initialSavings}
                                        onChange={(e) => setInitialSavings(e.target.value)}
                                        placeholder={t('onboarding.savingsPlaceholder')}
                                        className="flex-1 bg-transparent text-white text-xl font-bold focus:outline-none placeholder:text-slate-600"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-2">
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 px-6 rounded-xl font-medium transition-colors"
                            >
                                {t('common.back')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep(4)}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-6 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                {t('common.next')}
                                <ArrowRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Auto Savings */}
                {step === 4 && (
                    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 p-10 space-y-8">
                        <div className="space-y-3 px-2">
                            <h2 className="text-2xl font-bold text-white">{t('onboarding.autoSavingsTitle')}</h2>
                            <p className="text-slate-400 leading-relaxed">
                                {t('onboarding.autoSavingsDesc')}
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">{t('settings.goalType')}</label>
                                <div className="relative">
                                    <CustomSelect
                                        value={autoSavingsType}
                                        onChange={setAutoSavingsType}
                                        options={[
                                            { value: 'NONE', label: t('settings.goalTypeNone') },
                                            { value: 'PERCENT', label: t('settings.goalTypePercent') },
                                            { value: 'FIXED', label: t('settings.goalTypeFixed') }
                                        ]}
                                        placeholder={t('settings.goalType')}
                                    />
                                </div>
                            </div>

                            {autoSavingsType !== 'NONE' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
                                    <label className="text-sm font-medium text-slate-400">
                                        {autoSavingsType === 'PERCENT' ? t('settings.savingsGoalValuePercent') : t('settings.savingsGoalValueFixed')}
                                    </label>
                                    <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 rounded-xl px-5 py-4">
                                        {autoSavingsType === 'FIXED' && (
                                            <span className="text-slate-400 text-xl font-bold w-6 text-center">{getCurrencySymbol(currency)}</span>
                                        )}
                                        <input
                                            type="number"
                                            value={autoSavingsValue}
                                            onChange={(e) => setAutoSavingsValue(e.target.value)}
                                            placeholder={autoSavingsType === 'PERCENT' ? t('settings.savingsGoalPercentPlaceholder') : t('settings.savingsGoalFixedPlaceholder')}
                                            className="flex-1 bg-transparent text-white text-xl font-bold focus:outline-none placeholder:text-slate-600"
                                        />
                                        {autoSavingsType === 'PERCENT' && (
                                            <span className="text-slate-400 text-xl font-bold">%</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4 pt-2">
                            <button
                                type="button"
                                onClick={() => setStep(3)}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 px-6 rounded-xl font-medium transition-colors"
                            >
                                {t('common.back')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep(5)}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-6 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                {t('common.next')}
                                <ArrowRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 5: Fixed Expenses */}
                {step === 5 && (
                    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 p-10 space-y-8">
                        <div className="space-y-3 px-2">
                            <h2 className="text-2xl font-bold text-white">{t('onboarding.steps.fixedExpenses')}</h2>
                            <p className="text-slate-400 leading-relaxed">
                                {t('onboarding.fixedExpensesDesc')}
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-5 py-3 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleAddExpense} className="space-y-4">
                            <div className="md:col-span-3">
                                <input
                                    type="text"
                                    value={newExpense.name}
                                    onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
                                    placeholder={t('onboarding.expenseNamePlaceholder')}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 text-white focus:border-indigo-500 focus:outline-none placeholder:text-slate-600"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="number"
                                    value={newExpense.amount}
                                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    placeholder={t('onboarding.expenseAmountPlaceholder')}
                                    className="bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 text-white focus:border-indigo-500 focus:outline-none placeholder:text-slate-600"
                                />
                                <button
                                    type="submit"
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 px-6 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus className="h-5 w-5" />
                                    {t('expenses.addExpense')}
                                </button>
                            </div>
                        </form>

                        <div className="pt-2 border-t border-slate-800">
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const defaults = [
                                            { name: t('defaultExpenses.rent'), amount: 0, type: 'Fijo' },
                                            { name: t('defaultExpenses.utilities'), amount: 0, type: 'Fijo' },
                                            { name: t('defaultExpenses.internet'), amount: 0, type: 'Fijo' },
                                            { name: t('defaultExpenses.phone'), amount: 0, type: 'Fijo' },
                                            { name: t('defaultExpenses.transport'), amount: 0, type: 'Fijo' },
                                            { name: t('defaultExpenses.food'), amount: 0, type: 'Variable' }
                                        ];
                                        // Avoid duplicates
                                        const newDefaults = defaults.filter(d => !fixedExpenses.some(e => e.name === d.name));
                                        if (newDefaults.length > 0) {
                                            setFixedExpenses([...fixedExpenses, ...newDefaults]);
                                            // Optional: Show toast or feedback
                                        }
                                    }}
                                    className="w-full py-3 bg-slate-800/50 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 border border-dashed border-slate-700 hover:border-indigo-500/50"
                                >
                                    <Sparkles className="h-4 w-4" />
                                    {t('onboarding.loadDefaultExpenses')}
                                </button>
                                {showSuggestion && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 animate-in fade-in slide-in-from-bottom-2 z-50">
                                        <div className="bg-indigo-600 text-white text-sm font-medium py-2 px-4 rounded-xl shadow-xl shadow-indigo-500/20 flex items-center gap-2 relative">
                                            <Sparkles className="h-4 w-4 flex-shrink-0 text-indigo-200" />
                                            <span>{t('onboarding.suggestion.loadDefaults')}</span>
                                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-indigo-600 rotate-45"></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {fixedExpenses.length > 0 && (
                            <div className="space-y-3">
                                {fixedExpenses.map((expense, index) => (
                                    <div key={index} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-5 py-4">
                                        <div className="space-y-1">
                                            <p className="text-white font-medium">{expense.name}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-500 text-sm font-medium">{getCurrencySymbol(currency)}</span>
                                                <input
                                                    type="number"
                                                    value={expense.amount}
                                                    onChange={(e) => handleUpdateExpense(index, 'amount', e.target.value)}
                                                    className="bg-transparent text-slate-300 text-sm font-medium focus:outline-none w-24 border-b border-transparent focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveExpense(index)}
                                            className="text-rose-400 hover:text-rose-300 transition-colors text-sm font-medium"
                                        >
                                            {t('common.delete')}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-4 pt-2">
                            <button
                                type="button"
                                onClick={() => setStep(4)}
                                disabled={loading}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 px-6 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t('common.back')}
                            </button>
                            <button
                                type="button"
                                onClick={handleComplete}
                                disabled={loading}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 px-6 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        {t('common.loading')}
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-5 w-5" />
                                        {t('common.finish')}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}
