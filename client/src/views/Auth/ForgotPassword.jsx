import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                setMessage(data.message);
            } else {
                setStatus('error');
                setMessage(data.message || t('auth.resetRequestError'));
            }
        } catch (error) {
            setStatus('error');
            setMessage(t('auth.connectionError'));
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface px-4">
            <div className="max-w-md w-full bg-surface-container backdrop-blur-xl p-8 rounded-2xl border border-outline shadow-2xl">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-main mb-2">{t('auth.recoverPassword')}</h2>
                    <p className="text-secondary text-sm">{t('auth.recoverPasswordDesc')}</p>
                </div>

                {status === 'success' ? (
                    <div className="text-center animate-in fade-in zoom-in duration-300">
                        <div className="bg-success/10 p-4 rounded-full mb-6 inline-block">
                            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-main mb-2">{t('auth.emailSent')}</h3>
                        <p className="text-secondary mb-8">{message}</p>

                        <Link
                            to="/login"
                            className="w-full bg-surface-container hover:bg-surface-container-high text-main font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            {t('auth.backToLoginShort')}
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {status === 'error' && (
                            <div className="bg-error/10 border border-rose-500/20 text-error p-4 rounded-xl text-sm text-center">
                                {message}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-main ml-1">{t('auth.email')}</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-surface border border-outline rounded-xl py-3 pl-12 pr-4 text-main placeholder-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-indigo-500 transition-all"
                                    placeholder="tu@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full bg-primary hover:bg-primary-container text-main font-semibold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {status === 'loading' ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    {t('auth.sendInstructions')}
                                    <ArrowRight className="h-5 w-5" />
                                </>
                            )}
                        </button>

                        <div className="text-center">
                            <Link to="/login" className="text-secondary hover:text-main text-sm transition-colors flex items-center justify-center gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                {t('auth.backToLogin')}
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
