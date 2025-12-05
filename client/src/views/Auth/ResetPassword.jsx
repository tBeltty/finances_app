import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export default function ResetPassword() {
    const { t } = useTranslation();
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();


        if (password !== confirmPassword) {
            setStatus('error');
            setMessage(t('auth.passwordsDoNotMatch'));
            return;
        }

        setStatus('loading');
        setMessage('');

        try {
            const response = await fetch(`/api/auth/reset-password/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                setMessage(data.message);
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setStatus('error');
                setMessage(data.message || t('auth.resetError'));
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
                    <h2 className="text-2xl font-bold text-main mb-2">{t('auth.newPassword')}</h2>
                    <p className="text-secondary text-sm">{t('auth.newPasswordDesc')}</p>
                </div>

                {status === 'success' ? (
                    <div className="text-center animate-in fade-in zoom-in duration-300">
                        <div className="bg-success/10 p-4 rounded-full mb-6 inline-block">
                            <CheckCircle2 className="h-12 w-12 text-success" />
                        </div>
                        <h3 className="text-xl font-semibold text-main mb-2">{t('auth.passwordUpdated')}</h3>
                        <p className="text-secondary mb-8">{t('auth.passwordUpdatedDesc')}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {status === 'error' && (
                            <div className="bg-error/10 border border-rose-500/20 text-error p-4 rounded-xl text-sm text-center">
                                {message}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-main ml-1">{t('auth.newPassword')}</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-surface border border-outline rounded-xl py-3 pl-12 pr-4 text-main placeholder-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-indigo-500 transition-all"
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-main ml-1">{t('auth.confirmPassword')}</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-surface border border-outline rounded-xl py-3 pl-12 pr-4 text-main placeholder-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-indigo-500 transition-all"
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                    />
                                </div>
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
                                    {t('auth.resetPassword')}
                                    <ArrowRight className="h-5 w-5" />
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
