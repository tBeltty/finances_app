import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight, Loader2 } from 'lucide-react';

export default function EmailVerification() {
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
                    setMessage(data.message || 'Error al verificar email');
                }
            } catch (error) {
                setStatus('error');
                setMessage('Error de conexión. Intenta nuevamente.');
            }
        };

        if (token) {
            verifyEmail();
        }
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
            <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl p-8 rounded-2xl border border-slate-800 shadow-2xl text-center">
                {status === 'verifying' && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="h-16 w-16 text-indigo-500 animate-spin mb-6" />
                        <h2 className="text-2xl font-bold text-white mb-2">Verificando...</h2>
                        <p className="text-slate-400">Estamos validando tu dirección de email</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <div className="bg-emerald-500/10 p-4 rounded-full mb-6">
                            <CheckCircle2 className="h-16 w-16 text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">¡Email Verificado!</h2>
                        <p className="text-slate-400 mb-8">{message}</p>

                        <Link
                            to="/login"
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
                        >
                            Iniciar Sesión
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <div className="bg-rose-500/10 p-4 rounded-full mb-6">
                            <XCircle className="h-16 w-16 text-rose-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Error de Verificación</h2>
                        <p className="text-slate-400 mb-8">{message}</p>

                        <Link
                            to="/login"
                            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                        >
                            Volver al inicio de sesión
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
