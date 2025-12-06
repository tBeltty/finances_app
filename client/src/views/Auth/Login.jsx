import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [token2fa, setToken2fa] = useState('');
    const [show2FA, setShow2FA] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const { t } = useTranslation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(username, password, token2fa);

        if (result.require2FA) {
            setShow2FA(true);
        } else if (!result.success) {
            setError(result.message || result.error || t('auth.loginError'));
        }
    };

    React.useEffect(() => {
        const securityLogout = localStorage.getItem('security_logout');
        if (securityLogout) {
            import('sweetalert2').then((Swal) => {
                Swal.default.fire({
                    title: 'Sesión Cerrada',
                    text: 'Por motivos de seguridad, tu sesión ha sido cerrada. Por favor, inicia sesión nuevamente.',
                    icon: 'info',
                    confirmButtonColor: '#3b82f6',
                    background: '#1e293b',
                    color: '#f8fafc'
                });
            });
            localStorage.removeItem('security_logout');
        }
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface px-4">
            <div className="max-w-md w-full bg-surface-container backdrop-blur-xl p-8 rounded-2xl border border-outline shadow-2xl">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-main mb-2">{t('auth.welcome')}</h2>
                    <p className="text-secondary">{t('auth.loginSubtitle')}</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm text-center">
                        <p>{error}</p>
                        {error.includes('verificar tu email') && (
                            <button
                                onClick={async () => {
                                    try {
                                        const email = prompt(t('auth.promptEmail'));
                                        if (!email) return;

                                        const res = await fetch('/api/auth/resend-verification', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ email })
                                        });
                                        const data = await res.json();
                                        alert(data.message);
                                    } catch (e) {
                                        alert(t('auth.resendError'));
                                    }
                                }}
                                className="mt-2 text-primary hover:text-primary underline text-xs font-medium"
                            >
                                {t('auth.resendVerification')}
                            </button>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {!show2FA ? (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-main ml-1">{t('auth.username')}</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-surface border border-outline rounded-xl py-3 pl-12 pr-4 text-main placeholder-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-indigo-500 transition-all"
                                        placeholder={t('auth.usernamePlaceholder')}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-main ml-1">{t('auth.password')}</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-surface border border-outline rounded-xl py-3 pl-12 pr-4 text-main placeholder-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-indigo-500 transition-all"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end mt-1">
                                    <Link to="/forgot-password" className="text-xs text-primary hover:text-primary transition-colors">
                                        {t('auth.forgotPassword')}
                                    </Link>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-main ml-1">{t('auth.code2FA')}</label>
                            <div className="relative">
                                <ShieldCheck className="absolute left-4 top-3.5 h-5 w-5 text-indigo-500" />
                                <input
                                    type="text"
                                    value={token2fa}
                                    onChange={(e) => setToken2fa(e.target.value)}
                                    className="w-full bg-surface border border-primary/50 rounded-xl py-3 pl-12 pr-4 text-main placeholder-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-indigo-500 transition-all"
                                    placeholder="123456"
                                    autoFocus
                                    required
                                />
                            </div>
                            <p className="text-xs text-slate-500 text-center mt-2">{t('auth.code2FADesc')}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary-container text-main font-semibold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
                    >
                        {show2FA ? t('auth.verify') : t('auth.login')}
                        <ArrowRight className="h-5 w-5" />
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-secondary text-sm">
                        {t('auth.noAccount')}{' '}
                        <Link to="/register" className="text-primary hover:text-primary font-medium transition-colors">
                            {t('auth.register')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
