import React, { useState } from 'react';
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(username, password, token2fa);

        if (result.require2FA) {
            setShow2FA(true);
        } else if (!result.success) {
            setError(result.message || result.error || 'Error al iniciar sesión');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
            <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl p-8 rounded-2xl border border-slate-800 shadow-2xl">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">Bienvenido</h2>
                    <p className="text-slate-400">Inicia sesión para continuar</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm text-center">
                        <p>{error}</p>
                        {error.includes('verificar tu email') && (
                            <button
                                onClick={async () => {
                                    try {
                                        const email = prompt("Ingresa tu email para reenviar la verificación:");
                                        if (!email) return;

                                        const res = await fetch('/api/auth/resend-verification', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ email })
                                        });
                                        const data = await res.json();
                                        alert(data.message);
                                    } catch (e) {
                                        alert('Error al reenviar correo');
                                    }
                                }}
                                className="mt-2 text-indigo-400 hover:text-indigo-300 underline text-xs font-medium"
                            >
                                Reenviar correo de verificación
                            </button>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {!show2FA ? (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300 ml-1">Usuario</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                        placeholder="Tu nombre de usuario"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300 ml-1">Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end mt-1">
                                    <Link to="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                                        ¿Olvidaste tu contraseña?
                                    </Link>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 ml-1">Código 2FA</label>
                            <div className="relative">
                                <ShieldCheck className="absolute left-4 top-3.5 h-5 w-5 text-indigo-500" />
                                <input
                                    type="text"
                                    value={token2fa}
                                    onChange={(e) => setToken2fa(e.target.value)}
                                    className="w-full bg-slate-950 border border-indigo-500/50 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                    placeholder="123456"
                                    autoFocus
                                    required
                                />
                            </div>
                            <p className="text-xs text-slate-500 text-center mt-2">Ingresa el código de tu aplicación autenticadora</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
                    >
                        {show2FA ? 'Verificar' : 'Iniciar Sesión'}
                        <ArrowRight className="h-5 w-5" />
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-slate-400 text-sm">
                        ¿No tienes cuenta?{' '}
                        <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                            Regístrate
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
