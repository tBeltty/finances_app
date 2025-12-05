import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight, Loader2 } from 'lucide-react';

export default function EmailVerification() {
    const { t } = useTranslation();
    const { token } = useParams();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const response = await fetch(`/api/auth/verify-email/${token}`);
                const data = await response.json();

                if (response.ok) {
                    setStatus('success');
                    setMessage(data.message);
                } else {
                    setStatus('error');
                    setMessage(data.message || t('auth.verifyEmailError'));
                }
            } catch (error) {
                setStatus('error');
                setMessage(t('auth.connectionError'));
            }
        };

        if (token) {
            verifyEmail();
        }
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface px-4">
            <div className="max-w-md w-full bg-surface-container backdrop-blur-xl p-8 rounded-2xl border border-outline shadow-2xl text-center">
                {status === 'verifying' && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="h-16 w-16 text-indigo-500 animate-spin mb-6" />
                        <h2 className="text-2xl font-bold text-main mb-2">{t('auth.verifying')}</h2>
                        <p className="text-secondary">{t('auth.validatingEmail')}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <div className="bg-success/10 p-4 rounded-full mb-6">
                            <CheckCircle2 className="h-16 w-16 text-success" />
                        </div>
                        <h2 className="text-2xl font-bold text-main mb-2">{t('auth.emailVerified')}</h2>
                        <p className="text-secondary mb-8">{message}</p>

                        <Link
                            to="/login"
                            className="w-full bg-primary hover:bg-primary-container text-main font-semibold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
                        >
                            {t('auth.login')}
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <div className="bg-error/10 p-4 rounded-full mb-6">
                            <XCircle className="h-16 w-16 text-rose-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-main mb-2">{t('auth.verificationError')}</h2>
                        <p className="text-secondary mb-8">{message}</p>

                        <Link
                            to="/login"
                            className="text-primary hover:text-primary font-medium transition-colors"
                        >
                            {t('auth.backToLogin')}
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
