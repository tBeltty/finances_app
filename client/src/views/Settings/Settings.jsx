import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, ShieldCheck, X } from 'lucide-react';

export default function Settings({ onClose }) {
    const { user } = useAuth();
    const [qrCode, setQrCode] = useState(null);
    const [secret, setSecret] = useState(null);
    const [token, setToken] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        setError('');
        setMessage('');
        try {
            const res = await fetch('/api/auth/2fa/generate', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'Error generando 2FA');
            }

            const data = await res.json();
            setQrCode(data.qr);
            setSecret(data.secret);
        } catch (err) {
            console.error(err);
            setError(err.message);
        }
    };

    const handleVerify = async () => {
        setError('');
        setMessage('');
        try {
            const res = await fetch('/api/auth/2fa/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ token })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error verificando código');

            setMessage(data.message);
            if (data.success) {
                setQrCode(null);
                setSecret(null);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDisable = async () => {
        setError('');
        setMessage('');
        try {
            const res = await fetch('/api/auth/2fa/disable', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error desactivando 2FA');
            setMessage(data.message);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-slate-800 shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Shield className="h-5 w-5 text-indigo-400" />
                        Seguridad
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}
                    {message && (
                        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg text-sm text-center">
                            {message}
                        </div>
                    )}

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-white">Autenticación de Dos Factores (2FA)</h3>
                        <p className="text-slate-400 text-sm">
                            Añade una capa extra de seguridad a tu cuenta usando una aplicación como Google Authenticator.
                        </p>

                        <div className="flex gap-3">
                            {!user?.isTwoFactorEnabled && (
                                <button
                                    onClick={handleGenerate}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Activar 2FA
                                </button>
                            )}
                            {user?.isTwoFactorEnabled && (
                                <button
                                    onClick={handleDisable}
                                    className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Desactivar 2FA
                                </button>
                            )}
                        </div>

                        {user?.isTwoFactorEnabled && (
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm text-center flex items-center justify-center gap-2">
                                <ShieldCheck className="h-4 w-4" />
                                2FA está activo
                            </div>
                        )}
                    </div>

                    {qrCode && (
                        <div className="bg-white p-4 rounded-xl flex flex-col items-center space-y-4">
                            <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                            <div className="text-center">
                                <p className="text-slate-900 text-sm font-medium mb-1">Escanea el código QR</p>
                                <p className="text-slate-500 text-xs break-all">Secret: {secret}</p>
                            </div>

                            <div className="w-full space-y-2">
                                <input
                                    type="text"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder="Ingresa el código de 6 dígitos"
                                    className="w-full bg-slate-100 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <button
                                    onClick={handleVerify}
                                    className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800"
                                >
                                    Verificar y Activar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
