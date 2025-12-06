import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Wallet, UserPlus, Loader2 } from 'lucide-react';

export default function Register({ onSwitchToLogin }) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [isValidatingEmail, setIsValidatingEmail] = useState(false);
    const { register, validateEmail } = useAuth();
    const { t } = useTranslation();

    const handleEmailBlur = async () => {
        if (!email) {
            setEmailError('');
            return;
        }
        // Basic regex check first to avoid API call if obviously invalid
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setEmailError('Formato de email inválido');
            return;
        }

        setIsValidatingEmail(true);
        const result = await validateEmail(email);
        if (!result.valid) {
            setEmailError(result.message);
        } else {
            setEmailError('');
        }
        setIsValidatingEmail(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (emailError) return;

        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            setError(t('auth.passwordsDoNotMatch'));
            return;
        }

        setLoading(true);
        const result = await register(username, password, email);
        if (result.success) {
            setSuccess(result.message || t('auth.accountCreated'));
            setTimeout(() => {
                onSwitchToLogin();
            }, 3000);
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-surface-container backdrop-blur-md border border-outline p-8 rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-300">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-success/10 p-3 rounded-xl mb-4">
                        <Wallet className="w-10 h-10 text-success" />
                    </div>
                    <h1 className="text-2xl font-bold text-main">{t('auth.createAccount')}</h1>
                    <p className="text-secondary text-sm mt-1">{t('auth.registerSubtitle')}</p>
                </div>

                {error && (
                    <div className="bg-error/10 border border-rose-500/20 text-error p-3 rounded-xl text-sm mb-6 text-center">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-success/10 border border-success/20 text-success p-3 rounded-xl text-sm mb-6 text-center">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">{t('auth.username')}</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-surface-container border border-slate-600 rounded-xl px-4 py-3 text-main placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-success/50 focus:border-success transition-all"
                            placeholder={t('auth.chooseUsername')}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">{t('auth.email')}</label>
                        <div className="relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (emailError) setEmailError('');
                                }}
                                onBlur={handleEmailBlur}
                                className={`w-full bg-surface-container border ${emailError ? 'border-error focus:border-error focus:ring-error/50' : 'border-slate-600 focus:border-success focus:ring-success/50'} rounded-xl px-4 py-3 text-main placeholder:text-secondary focus:outline-none focus:ring-2 transition-all`}
                                placeholder="tu@email.com"
                                required
                            />
                            {isValidatingEmail && (
                                <div className="absolute right-3 top-3.5">
                                    <Loader2 className="w-5 h-5 animate-spin text-secondary" />
                                </div>
                            )}
                        </div>
                        {emailError && (
                            <p className="text-error text-xs mt-1 ml-1">{emailError}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">{t('auth.password')}</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-surface-container border border-slate-600 rounded-xl px-4 py-3 text-main placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-success/50 focus:border-success transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">{t('auth.confirmPassword')}</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-surface-container border border-slate-600 rounded-xl px-4 py-3 text-main placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-success/50 focus:border-success transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || isValidatingEmail || !!emailError}
                        className="w-full bg-success hover:opacity-80 text-main font-bold py-3 rounded-xl shadow-lg shadow-success/20 hover:shadow-success/40 transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{t('auth.register')} <UserPlus className="w-5 h-5" /></>}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-secondary text-sm">
                        {t('auth.haveAccount')}{' '}
                        <button onClick={onSwitchToLogin} className="text-success hover:text-success font-medium transition-colors">
                            {t('auth.login')}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
