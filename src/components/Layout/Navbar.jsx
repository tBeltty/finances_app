import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Wallet, Settings as SettingsIcon } from 'lucide-react';
import Settings from '../Settings/Settings';

export default function Navbar() {
    const { logout, user } = useAuth();
    const [showSettings, setShowSettings] = useState(false);

    return (
        <>
            <nav className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-500/10 p-2 rounded-xl">
                                <Wallet className="h-6 w-6 text-indigo-400" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                                Finances
                            </span>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-sm text-slate-400 hidden sm:block">
                                {user?.username}
                            </span>
                            <button
                                onClick={() => setShowSettings(true)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                title="Ajustes"
                            >
                                <SettingsIcon className="h-5 w-5" />
                            </button>
                            <button
                                onClick={logout}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline">Salir</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
            {showSettings && <Settings onClose={() => setShowSettings(false)} />}
        </>
    );
}
