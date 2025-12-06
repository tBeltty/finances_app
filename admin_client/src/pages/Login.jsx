import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Terminal, ShieldAlert } from 'lucide-react';

export default function Login() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [twoFactorToken, setTwoFactorToken] = useState('');
    const [show2FA, setShow2FA] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await login(identifier, password, twoFactorToken);
            if (res && res.require2FA) {
                setShow2FA(true);
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Connection Error');
        }
    };

    return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-4 transition-colors duration-300">
            <div className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-xl border border-outline/20">
                <div className="flex flex-col items-center gap-4 mb-8">
                    <div className="p-3 rounded-xl animate-fade-in">
                        <img src="/adminlogo.png" alt="Admin Logo" className="w-16 h-16 object-contain" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-main">Administrative Access</h1>
                    <p className="text-sm text-secondary">Authorized Personnel Only</p>
                </div>

                {error && (
                    <div className="bg-error/10 border border-error/20 text-error p-4 rounded-lg mb-6 text-sm font-medium flex items-center gap-2">
                        <ShieldAlert size={16} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {!show2FA ? (
                        <>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-secondary ml-1">Identity</label>
                                <input
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="w-full bg-surface-container/50 border border-outline rounded-lg px-4 py-3 text-main placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    placeholder="Username or Email"
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-secondary ml-1">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-surface-container/50 border border-outline rounded-lg px-4 py-3 text-main placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4 animate-fade-in">
                            <label className="text-center block text-sm font-medium text-main">Enter 2FA Code</label>
                            <input
                                type="text"
                                value={twoFactorToken}
                                onChange={(e) => setTwoFactorToken(e.target.value)}
                                className="w-full text-center text-3xl font-mono tracking-[0.5em] bg-surface-container/50 border border-outline rounded-lg py-4 text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="000000"
                                autoFocus
                                maxLength={6}
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary-container hover:text-on-primary-container text-on-primary font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg shadow-primary/25"
                    >
                        {show2FA ? 'Verify Identity' : 'Secure Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}
