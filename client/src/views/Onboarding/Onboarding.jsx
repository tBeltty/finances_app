import React, { useState, useEffect } from 'react';
import { Sparkles, DollarSign, Plus, ArrowRight, Check, Loader2, Globe, Languages, Palette, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import CustomSelect from '../../components/Inputs/CustomSelect';

export default function Onboarding({ onComplete }) {
    const { user, refreshUser } = useAuth();
    const { theme, setTheme, mode, setMode, logo, setLogo } = useTheme();
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
    const [uiMode, setUiMode] = useState(3); // 1=Dropdowns, 2=Cards, 3=Builder

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
        if (step === 6 && fixedExpenses.length === 0) {
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
        <div className="min-h-screen bg-surface flex items-center justify-center p-6">
            <div className="max-w-2xl w-full">
                {/* Step 0: Language Selection */}
                {step === 0 && (
                    <div className="bg-surface-container backdrop-blur-xl rounded-2xl border border-outline p-10 text-center space-y-8">
                        <div className="flex justify-center">
                            <div className="bg-primary/10 p-4 rounded-full">
                                <Languages className="h-12 w-12 text-primary" />
                            </div>
                        </div>
                        <div className="space-y-4 px-4">
                            <h1 className="text-3xl font-bold text-main">{t('onboarding.languageSelect')}</h1>
                            <p className="text-secondary text-lg leading-relaxed">
                                {t('onboarding.languageSelectSubtitle')}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => handleLanguageSelect(lang.code)}
                                    className={`flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-medium transition-all border ${i18n.language === lang.code
                                        ? 'bg-primary/20 border-primary text-main shadow-lg shadow-primary/20'
                                        : 'bg-surface-container border-outline text-secondary hover:border-primary hover:text-main'
                                        }`}
                                >
                                    <span className="text-2xl">{lang.icon}</span>
                                    <span className="text-lg">{lang.label}</span>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setStep(1)}
                            className="w-full bg-primary hover:bg-primary-container text-main py-3 px-6 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 mt-8"
                        >
                            {t('common.next')}
                            <ArrowRight className="h-5 w-5" />
                        </button>
                    </div>
                )}

                {/* Step 1: Welcome */}
                {step === 1 && (
                    <div className="bg-surface-container backdrop-blur-xl rounded-2xl border border-outline p-10 text-center space-y-8">
                        <div className="flex justify-center">
                            <div className="bg-primary/10 p-4 rounded-full">
                                <Sparkles className="h-12 w-12 text-primary" />
                            </div>
                        </div>
                        <div className="space-y-4 px-4">
                            <h1 className="text-3xl font-bold text-main">{t('onboarding.welcome')}</h1>
                            <p className="text-secondary text-lg leading-relaxed">
                                {t('onboarding.subtitle')}
                            </p>
                            <div className="mt-6 text-center max-w-lg mx-auto">
                                <p className="text-secondary text-sm leading-relaxed">
                                    {t('onboarding.features.households')} • {t('onboarding.features.savings')} • {t('onboarding.features.security')}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep(0)}
                                className="flex-1 bg-surface-container hover:bg-surface-container-high text-main py-3 px-6 rounded-xl font-medium transition-colors"
                            >
                                {t('common.back')}
                            </button>
                            <div className="relative flex-1">
                                <button
                                    onClick={() => setStep(2)}
                                    className="w-full bg-primary hover:bg-primary-container text-main py-3 px-6 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    {t('onboarding.getStarted')}
                                    <ArrowRight className="h-5 w-5" />
                                </button>
                                {showStartSuggestion && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-40 animate-in fade-in slide-in-from-bottom-2 z-50">
                                        <div className="bg-primary text-main text-sm font-bold py-2 px-4 rounded-xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 relative">
                                            <span>{t('onboarding.suggestion.letsStart')}</span>
                                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rotate-45"></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Theme Selection - 3 UI Modes */}
                {step === 2 && (
                    <div className="bg-surface-container backdrop-blur-xl rounded-2xl border border-outline p-6 text-center space-y-5 max-w-2xl mx-auto">
                        <div className="flex justify-center">
                            <div className="bg-primary/10 p-3 rounded-full">
                                <Palette className="h-10 w-10 text-primary" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold text-main">Elige tu Estilo</h1>
                            <p className="text-secondary text-sm">Prueba diferentes modos de selección</p>
                        </div>

                        {/* UI Mode Toggle */}
                        <div className="flex justify-center gap-1 bg-surface/50 p-1 rounded-lg border border-outline/50 w-fit mx-auto">
                            {[
                                { id: 1, label: 'Dropdowns' },
                                { id: 2, label: 'Cards' },
                                { id: 3, label: 'Builder' }
                            ].map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => setUiMode(m.id)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${uiMode === m.id
                                        ? 'bg-primary text-main shadow-sm'
                                        : 'text-secondary hover:text-main'
                                        }`}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>

                        {/* MODE 1: Dropdowns */}
                        {uiMode === 1 && (
                            <div className="space-y-3 text-left max-w-xs mx-auto">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-secondary uppercase">Tema</label>
                                    <div className="relative">
                                        <select
                                            value={theme}
                                            onChange={(e) => setTheme(e.target.value)}
                                            className="w-full bg-surface border border-outline rounded-xl px-4 py-2.5 text-main text-sm appearance-none cursor-pointer focus:border-primary focus:outline-none"
                                        >
                                            <option value="cosmic">🔮 Cosmic Slate</option>
                                            <option value="takito">🔥 Warm Amber</option>
                                            <option value="cookie">🌊 Ocean Blue</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary text-xs">▼</div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-secondary uppercase">Modo</label>
                                    <div className="relative">
                                        <select
                                            value={mode}
                                            onChange={(e) => setMode(e.target.value)}
                                            className="w-full bg-surface border border-outline rounded-xl px-4 py-2.5 text-main text-sm appearance-none cursor-pointer focus:border-primary focus:outline-none"
                                        >
                                            <option value="light">☀️ Light Mode</option>
                                            <option value="dark">🌙 Dark Mode</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary text-xs">▼</div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-secondary uppercase">Mascota</label>
                                    <div className="relative">
                                        <select
                                            value={logo}
                                            onChange={(e) => setLogo(e.target.value)}
                                            className="w-full bg-surface border border-outline rounded-xl px-4 py-2.5 text-main text-sm appearance-none cursor-pointer focus:border-primary focus:outline-none"
                                        >
                                            <option value="cosmic">💎 Finances Basic</option>
                                            <option value="takito">🐕 Takito</option>
                                            <option value="cookie">🐱 Cookie</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary text-xs">▼</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* MODE 2: Cards */}
                        {uiMode === 2 && (
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'cosmic', name: 'Cosmic', colors: ['#334155', '#6366f1', '#818cf8'] },
                                    { id: 'takito', name: 'Amber', colors: ['#78350f', '#f59e0b', '#fbbf24'] },
                                    { id: 'cookie', name: 'Ocean', colors: ['#0c4a6e', '#0ea5e9', '#38bdf8'] }
                                ].map((t) => (
                                    <div
                                        key={t.id}
                                        className={`relative rounded-xl border transition-all overflow-hidden ${theme === t.id
                                            ? 'border-primary ring-2 ring-primary/20'
                                            : 'border-outline hover:border-primary/50'
                                            }`}
                                    >
                                        <button onClick={() => setTheme(t.id)} className="w-full h-12 flex">
                                            {t.colors.map((color, i) => (
                                                <div key={i} className="flex-1" style={{ backgroundColor: color }} />
                                            ))}
                                        </button>
                                        <div className="p-2 bg-surface-container space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-xs text-main">{t.name}</span>
                                                {theme === t.id && (
                                                    <div className="flex gap-0.5 bg-surface/50 p-0.5 rounded">
                                                        <button onClick={() => setMode('light')} className={`p-0.5 rounded ${mode === 'light' ? 'bg-white text-slate-900' : 'text-secondary'}`}>
                                                            <Sun className="h-3 w-3" />
                                                        </button>
                                                        <button onClick={() => setMode('dark')} className={`p-0.5 rounded ${mode === 'dark' ? 'bg-surface text-main' : 'text-secondary'}`}>
                                                            <Moon className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            {theme === t.id && (
                                                <div className="flex justify-center gap-1 pt-1 border-t border-outline/50">
                                                    {[
                                                        { id: 'cosmic', icon: '/logo-cosmic.png' },
                                                        { id: 'takito', icon: '/logo-shiba.png' },
                                                        { id: 'cookie', icon: '/logo-ragdoll.png' }
                                                    ].map((m) => (
                                                        <button key={m.id} onClick={() => setLogo(m.id)} className={`w-6 h-6 rounded-full overflow-hidden border-2 transition-all ${logo === m.id ? 'border-primary scale-110' : 'border-outline opacity-50 hover:opacity-100'}`}>
                                                            <img src={m.icon} alt="" className="w-full h-full object-cover" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {theme === t.id && (
                                            <div className="absolute top-1 right-1 bg-primary rounded-full p-0.5">
                                                <Check className="h-2 w-2 text-main" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* MODE 3: Builder */}
                        {uiMode === 3 && (
                            <div className="bg-surface rounded-xl border border-outline p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Preview */}
                                    <div className="rounded-xl border border-outline overflow-hidden">
                                        <div className="h-7 flex items-center justify-between px-2" style={{ backgroundColor: theme === 'cosmic' ? '#334155' : theme === 'takito' ? '#78350f' : '#0c4a6e' }}>
                                            <div className="flex items-center gap-1.5">
                                                <img src={logo === 'cosmic' ? '/logo-cosmic.png' : logo === 'takito' ? '/logo-shiba.png' : '/logo-ragdoll.png'} className="w-4 h-4 rounded-full" alt="" />
                                                <span className="text-[10px] text-white font-medium">tBelt Finanzas</span>
                                            </div>
                                            <div className="flex gap-0.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-white/30"></div>
                                                <div className="w-1.5 h-1.5 rounded-full bg-white/30"></div>
                                            </div>
                                        </div>
                                        <div className="p-3 space-y-1.5" style={{ backgroundColor: mode === 'dark' ? (theme === 'cosmic' ? '#0f172a' : theme === 'takito' ? '#0c0a09' : '#082f49') : (theme === 'cosmic' ? '#f8fafc' : theme === 'takito' ? '#fffbeb' : '#f0f9ff') }}>
                                            <div className="h-5 rounded-lg" style={{ backgroundColor: theme === 'cosmic' ? '#6366f1' : theme === 'takito' ? '#f59e0b' : '#0ea5e9', width: '60%' }}></div>
                                            <div className="h-3 rounded opacity-30" style={{ backgroundColor: mode === 'dark' ? '#fff' : '#000', width: '80%' }}></div>
                                            <div className="h-3 rounded opacity-20" style={{ backgroundColor: mode === 'dark' ? '#fff' : '#000', width: '65%' }}></div>
                                        </div>
                                    </div>
                                    {/* Controls */}
                                    <div className="space-y-3 text-left">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-secondary uppercase">Tema</label>
                                            <div className="flex gap-2">
                                                {[{ id: 'cosmic', color: '#6366f1' }, { id: 'takito', color: '#f59e0b' }, { id: 'cookie', color: '#0ea5e9' }].map((t) => (
                                                    <button key={t.id} onClick={() => setTheme(t.id)} className={`w-9 h-9 rounded-lg border-2 transition-all ${theme === t.id ? 'border-primary scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: t.color }} />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-secondary uppercase">Modo</label>
                                            <div className="flex gap-2">
                                                <button onClick={() => setMode('light')} className={`flex-1 flex items-center justify-center py-1.5 rounded-lg border transition-all ${mode === 'light' ? 'bg-white text-slate-900 border-slate-200' : 'bg-surface border-outline text-secondary'}`}>
                                                    <Sun className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => setMode('dark')} className={`flex-1 flex items-center justify-center py-1.5 rounded-lg border transition-all ${mode === 'dark' ? 'bg-surface-container text-main border-primary' : 'bg-surface border-outline text-secondary'}`}>
                                                    <Moon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-secondary uppercase">Mascota</label>
                                            <div className="flex gap-2">
                                                {[{ id: 'cosmic', icon: '/logo-cosmic.png' }, { id: 'takito', icon: '/logo-shiba.png' }, { id: 'cookie', icon: '/logo-ragdoll.png' }].map((l) => (
                                                    <button key={l.id} onClick={() => setLogo(l.id)} className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all ${logo === l.id ? 'border-primary scale-110 shadow-lg' : 'border-outline hover:scale-105'}`}>
                                                        <img src={l.icon} alt="" className="w-full h-full object-cover" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setStep(1)} className="flex-1 bg-surface-container hover:bg-surface-container-high text-main py-2.5 px-4 rounded-xl font-medium transition-colors text-sm">
                                {t('common.back')}
                            </button>
                            <button onClick={() => setStep(3)} className="flex-1 bg-primary hover:bg-primary-container text-main py-2.5 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm">
                                {t('common.next')}
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Currency & Income */}
                {step === 3 && (
                    <div className="bg-surface-container backdrop-blur-xl rounded-2xl border border-outline p-10 space-y-8">
                        <div className="space-y-3 px-2">
                            <h2 className="text-2xl font-bold text-main">{t('onboarding.steps.currency')}</h2>
                            <p className="text-secondary leading-relaxed">{t('onboarding.currencySelect')}</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-secondary">{t('onboarding.steps.currency')}</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {currencies.map((c) => (
                                        <button
                                            key={c.code}
                                            onClick={() => setCurrency(c.code)}
                                            className={`p-3 rounded-xl border text-left transition-all ${currency === c.code
                                                ? 'bg-primary/20 border-primary text-main'
                                                : 'bg-surface border-outline text-secondary hover:border-outline'
                                                }`}
                                        >
                                            <div className="font-bold">{c.code}</div>
                                            <div className="text-xs opacity-70">{c.label}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>



                            <div className="space-y-2">
                                <label className="text-sm font-medium text-secondary">{t('onboarding.monthlyIncome')}</label>
                                <div className="flex items-center gap-4 bg-surface border border-outline rounded-xl px-5 py-4">
                                    <span className="text-secondary text-xl font-bold w-6 text-center">{getCurrencySymbol(currency)}</span>
                                    <input
                                        type="number"
                                        value={income}
                                        onChange={(e) => setIncome(e.target.value)}
                                        placeholder={t('onboarding.incomePlaceholder')}
                                        className="flex-1 bg-transparent text-main text-xl font-bold focus:outline-none placeholder:text-slate-600"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-2">
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                className="flex-1 bg-surface-container hover:bg-surface-container-high text-main py-3 px-6 rounded-xl font-medium transition-colors"
                            >
                                {t('common.back')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep(5)}
                                className="flex-1 bg-primary hover:bg-primary-container text-main py-3 px-6 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                {t('common.next')}
                                <ArrowRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Initial Savings */}
                {step === 4 && (
                    <div className="bg-surface-container backdrop-blur-xl rounded-2xl border border-outline p-10 space-y-8">
                        <div className="space-y-3 px-2">
                            <h2 className="text-2xl font-bold text-main">{t('onboarding.steps.savings')}</h2>
                            <p className="text-secondary leading-relaxed">
                                {t('onboarding.savingsDesc')}
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-secondary">{t('onboarding.savingsInput')}</label>
                                <div className="flex items-center gap-4 bg-surface border border-outline rounded-xl px-5 py-4">
                                    <span className="text-secondary text-xl font-bold w-6 text-center">{getCurrencySymbol(currency)}</span>
                                    <input
                                        type="number"
                                        value={initialSavings}
                                        onChange={(e) => setInitialSavings(e.target.value)}
                                        placeholder={t('onboarding.savingsPlaceholder')}
                                        className="flex-1 bg-transparent text-main text-xl font-bold focus:outline-none placeholder:text-slate-600"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-2">
                            <button
                                type="button"
                                onClick={() => setStep(3)}
                                className="flex-1 bg-surface-container hover:bg-surface-container-high text-main py-3 px-6 rounded-xl font-medium transition-colors"
                            >
                                {t('common.back')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep(4)}
                                className="flex-1 bg-primary hover:bg-primary-container text-main py-3 px-6 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                {t('common.next')}
                                <ArrowRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 5: Auto Savings */}
                {step === 5 && (
                    <div className="bg-surface-container backdrop-blur-xl rounded-2xl border border-outline p-10 space-y-8">
                        <div className="space-y-3 px-2">
                            <h2 className="text-2xl font-bold text-main">{t('onboarding.autoSavingsTitle')}</h2>
                            <p className="text-secondary leading-relaxed">
                                {t('onboarding.autoSavingsDesc')}
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-secondary">{t('settings.goalType')}</label>
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
                                    <label className="text-sm font-medium text-secondary">
                                        {autoSavingsType === 'PERCENT' ? t('settings.savingsGoalValuePercent') : t('settings.savingsGoalValueFixed')}
                                    </label>
                                    <div className="flex items-center gap-4 bg-surface border border-outline rounded-xl px-5 py-4">
                                        {autoSavingsType === 'FIXED' && (
                                            <span className="text-secondary text-xl font-bold w-6 text-center">{getCurrencySymbol(currency)}</span>
                                        )}
                                        <input
                                            type="number"
                                            value={autoSavingsValue}
                                            onChange={(e) => setAutoSavingsValue(e.target.value)}
                                            placeholder={autoSavingsType === 'PERCENT' ? t('settings.savingsGoalPercentPlaceholder') : t('settings.savingsGoalFixedPlaceholder')}
                                            className="flex-1 bg-transparent text-main text-xl font-bold focus:outline-none placeholder:text-slate-600"
                                        />
                                        {autoSavingsType === 'PERCENT' && (
                                            <span className="text-secondary text-xl font-bold">%</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4 pt-2">
                            <button
                                type="button"
                                onClick={() => setStep(4)}
                                className="flex-1 bg-surface-container hover:bg-surface-container-high text-main py-3 px-6 rounded-xl font-medium transition-colors"
                            >
                                {t('common.back')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep(6)}
                                className="flex-1 bg-primary hover:bg-primary-container text-main py-3 px-6 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                {t('common.next')}
                                <ArrowRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 6: Fixed Expenses */}
                {step === 6 && (
                    <div className="bg-surface-container backdrop-blur-xl rounded-2xl border border-outline p-10 space-y-8">
                        <div className="space-y-3 px-2">
                            <h2 className="text-2xl font-bold text-main">{t('onboarding.steps.fixedExpenses')}</h2>
                            <p className="text-secondary leading-relaxed">
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
                                    className="w-full bg-surface border border-outline rounded-xl px-5 py-3 text-main focus:border-primary focus:outline-none placeholder:text-slate-600"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="number"
                                    value={newExpense.amount}
                                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    placeholder={t('onboarding.expenseAmountPlaceholder')}
                                    className="bg-surface border border-outline rounded-xl px-5 py-3 text-main focus:border-primary focus:outline-none placeholder:text-slate-600"
                                />
                                <button
                                    type="submit"
                                    className="bg-surface-container hover:bg-surface-container-high text-main py-3 px-6 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus className="h-5 w-5" />
                                    {t('expenses.addExpense')}
                                </button>
                            </div>
                        </form>

                        <div className="pt-2 border-t border-outline">
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
                                    className="w-full py-3 bg-surface-container hover:bg-surface-container text-primary hover:text-primary rounded-xl font-medium transition-colors flex items-center justify-center gap-2 border border-dashed border-outline hover:border-primary/50"
                                >
                                    <Sparkles className="h-4 w-4" />
                                    {t('onboarding.loadDefaultExpenses')}
                                </button>
                                {showSuggestion && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 animate-in fade-in slide-in-from-bottom-2 z-50">
                                        <div className="bg-primary text-main text-sm font-medium py-2 px-4 rounded-xl shadow-xl shadow-primary/20 flex items-center gap-2 relative">
                                            <Sparkles className="h-4 w-4 flex-shrink-0 text-indigo-200" />
                                            <span>{t('onboarding.suggestion.loadDefaults')}</span>
                                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rotate-45"></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {fixedExpenses.length > 0 && (
                            <div className="space-y-3">
                                {fixedExpenses.map((expense, index) => (
                                    <div key={index} className="flex items-center justify-between bg-surface border border-outline rounded-xl px-5 py-4">
                                        <div className="space-y-1">
                                            <p className="text-main font-medium">{expense.name}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-500 text-sm font-medium">{getCurrencySymbol(currency)}</span>
                                                <input
                                                    type="number"
                                                    value={expense.amount}
                                                    onChange={(e) => handleUpdateExpense(index, 'amount', e.target.value)}
                                                    className="bg-transparent text-main text-sm font-medium focus:outline-none w-24 border-b border-transparent focus:border-primary transition-colors placeholder:text-slate-600"
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
                                onClick={() => setStep(5)}
                                disabled={loading}
                                className="flex-1 bg-surface-container hover:bg-surface-container-high text-main py-3 px-6 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t('common.back')}
                            </button>
                            <button
                                type="button"
                                onClick={handleComplete}
                                disabled={loading}
                                className="flex-1 bg-success hover:opacity-80 text-main py-3 px-6 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
