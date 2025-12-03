import React, { useState, useEffect } from 'react';
import { Sparkles, DollarSign, Plus, ArrowRight, Check, Loader2, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Onboarding({ onComplete }) {
    const { user, refreshUser } = useAuth();
    const [step, setStep] = useState(1);
    const [income, setIncome] = useState('');
    const [initialSavings, setInitialSavings] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [fixedExpenses, setFixedExpenses] = useState([]);
    const [newExpense, setNewExpense] = useState({ name: '', amount: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const currencies = [
        { code: 'USD', label: 'Dólar Estadounidense ($)', locale: 'en-US' },
        { code: 'COP', label: 'Peso Colombiano ($)', locale: 'es-CO' },
        { code: 'EUR', label: 'Euro (€)', locale: 'es-ES' },
        { code: 'MXN', label: 'Peso Mexicano ($)', locale: 'es-MX' },
        { code: 'HNL', label: 'Lempira Hondureño (L)', locale: 'es-HN' }
    ];

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
                throw new Error('No se encontró un hogar por defecto.');
            }

            const householdHeaders = {
                ...headers,
                'X-Household-Id': defaultHousehold.id
            };

            // 4. Create Templates
            const templates = [
                { name: 'Servicios Públicos', color: 'blue' },
                { name: 'Gastos Hogar', color: 'green' },
                { name: 'Transporte', color: 'amber' },
                { name: 'Créditos', color: 'rose' },
                { name: 'Gastos Fijos', color: 'slate' }
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
                const fixedCategory = categories.find(c => c.name === 'Gastos Fijos');

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

            if (!onboardingRes.ok) throw new Error('Error completando onboarding');

            await refreshUser();
            onComplete();
        } catch (error) {
            console.error('Error completing onboarding:', error);
            setError(error.message || 'Ocurrió un error. Por favor intenta de nuevo.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
            <div className="max-w-2xl w-full">
                {step === 1 && (
                    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 p-10 text-center space-y-8">
                        <div className="flex justify-center">
                            <div className="bg-indigo-500/10 p-4 rounded-full">
                                <Sparkles className="h-12 w-12 text-indigo-400" />
                            </div>
                        </div>
                        <div className="space-y-4 px-4">
                            <h1 className="text-3xl font-bold text-white">¡Bienvenido a Finances!</h1>
                            <p className="text-slate-400 text-lg leading-relaxed">
                                Tu plataforma completa para finanzas personales y compartidas.
                            </p>
                            <div className="grid grid-cols-1 gap-3 text-left mt-6">
                                <div className="flex items-center gap-3 text-slate-300 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                                    <div className="bg-emerald-500/20 p-2 rounded-md">
                                        <Globe className="h-5 w-5 text-emerald-400" />
                                    </div>
                                    <span className="text-sm">Hogares Colaborativos</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-300 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                                    <div className="bg-amber-500/20 p-2 rounded-md">
                                        <DollarSign className="h-5 w-5 text-amber-400" />
                                    </div>
                                    <span className="text-sm">Metas de Ahorro</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-300 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                                    <div className="bg-rose-500/20 p-2 rounded-md">
                                        <Sparkles className="h-5 w-5 text-rose-400" />
                                    </div>
                                    <span className="text-sm">Seguridad Avanzada (2FA)</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setStep(2)}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-6 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            Comenzar
                            <ArrowRight className="h-5 w-5" />
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 p-10 space-y-8">
                        <div className="space-y-3 px-2">
                            <h2 className="text-2xl font-bold text-white">Paso 1: Moneda e Ingresos</h2>
                            <p className="text-slate-400 leading-relaxed">Configura tu moneda local y tus ingresos mensuales.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">Moneda</label>
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
                                <label className="text-sm font-medium text-slate-400">Ingreso Mensual</label>
                                <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 rounded-xl px-5 py-4">
                                    <DollarSign className="h-6 w-6 text-slate-400 flex-shrink-0" />
                                    <input
                                        type="number"
                                        value={income}
                                        onChange={(e) => setIncome(e.target.value)}
                                        placeholder="Ejemplo: 3000000"
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
                                Atrás
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep(3)}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-6 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                Continuar
                                <ArrowRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 p-10 space-y-8">
                        <div className="space-y-3 px-2">
                            <h2 className="text-2xl font-bold text-white">Paso 2: Ahorros Iniciales</h2>
                            <p className="text-slate-400 leading-relaxed">
                                Si ya tienes ahorros acumulados, puedes ingresarlos aquí para iniciar tu seguimiento.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">Saldo de Ahorros Actual</label>
                                <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 rounded-xl px-5 py-4">
                                    <DollarSign className="h-6 w-6 text-slate-400 flex-shrink-0" />
                                    <input
                                        type="number"
                                        value={initialSavings}
                                        onChange={(e) => setInitialSavings(e.target.value)}
                                        placeholder="Ejemplo: 5000000"
                                        className="flex-1 bg-transparent text-white text-xl font-bold focus:outline-none placeholder:text-slate-600"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 px-1">
                                    Este saldo se mostrará en tu widget de ahorros y podrás usarlo para pagar gastos.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-2">
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 px-6 rounded-xl font-medium transition-colors"
                            >
                                Atrás
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep(4)}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-6 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                Continuar
                                <ArrowRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 p-10 space-y-8">
                        <div className="space-y-3 px-2">
                            <h2 className="text-2xl font-bold text-white">Paso 3: Gastos Fijos (Opcional)</h2>
                            <p className="text-slate-400 leading-relaxed">
                                Añade tus gastos fijos mensuales como arriendo, servicios, etc.
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-5 py-3 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleAddExpense} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    value={newExpense.name}
                                    onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
                                    placeholder="Nombre (ej: Arriendo)"
                                    className="bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 text-white focus:border-indigo-500 focus:outline-none placeholder:text-slate-600"
                                />
                                <input
                                    type="number"
                                    value={newExpense.amount}
                                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    placeholder="Monto"
                                    className="bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 text-white focus:border-indigo-500 focus:outline-none placeholder:text-slate-600"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 px-6 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus className="h-5 w-5" />
                                Agregar Gasto
                            </button>
                        </form>

                        {fixedExpenses.length > 0 && (
                            <div className="space-y-3">
                                {fixedExpenses.map((expense, index) => (
                                    <div key={index} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-5 py-4">
                                        <div className="space-y-1">
                                            <p className="text-white font-medium">{expense.name}</p>
                                            <p className="text-slate-400 text-sm">
                                                {new Intl.NumberFormat('es-CO', {
                                                    style: 'currency',
                                                    currency: currency,
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0
                                                }).format(expense.amount)}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveExpense(index)}
                                            className="text-rose-400 hover:text-rose-300 transition-colors text-sm font-medium"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-4 pt-2">
                            <button
                                type="button"
                                onClick={() => setStep(3)}
                                disabled={loading}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 px-6 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Atrás
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
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-5 w-5" />
                                        Completar
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
