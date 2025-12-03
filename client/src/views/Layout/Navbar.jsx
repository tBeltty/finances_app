import React, { useState } from 'react';
import { LogOut, Menu, X, Wallet, Settings, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { useTranslation } from 'react-i18next';

export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { logout, user } = useAuth();
    const { openSettings } = useUI();
    const { t } = useTranslation();

    return (
        <nav className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-500/10 p-1.5 rounded-lg">
                            <img src="/logocookie.png?v=5" alt="Logo" className="w-6 h-6 object-contain" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                            tBelt Finances
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-6">
                        <div className="text-slate-400 text-sm">
                            {t('nav.hello')} <span className="text-slate-200 font-medium">{user?.username}</span>
                        </div>
                        <button
                            onClick={openSettings}
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors cursor-pointer mr-4"
                        >
                            <Settings className="w-4 h-4" />
                            <span className="text-sm font-medium">{t('nav.settings')}</span>
                        </button>
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm font-medium">{t('nav.logout')}</span>
                        </button>
                    </div>

                    <div className="md:hidden">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="text-slate-400 hover:text-slate-200 p-2"
                        >
                            {mobileMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-16 right-4 w-56 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden ring-1 ring-white/10">
                    <div className="p-2 border-b border-slate-800/50">
                        <div className="px-3 py-2 flex items-center gap-3 bg-slate-800/30 rounded-xl">
                            <div className="bg-slate-800 p-1.5 rounded-lg">
                                <User className="w-4 h-4 text-slate-400" />
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider leading-none mb-0.5">{t('nav.connectedAs')}</span>
                                <span className="text-xs font-semibold text-slate-200 truncate">{user?.username}</span>
                            </div>
                        </div>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                        <button
                            onClick={() => { openSettings(); setMobileMenuOpen(false); }}
                            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 flex items-center gap-3 transition-all group"
                        >
                            <div className="bg-slate-800 group-hover:bg-indigo-500/20 p-1.5 rounded-lg transition-colors">
                                <Settings className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" />
                            </div>
                            {t('nav.settings')}
                        </button>
                        <button
                            onClick={() => { logout(); setMobileMenuOpen(false); }}
                            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-3 transition-all group"
                        >
                            <div className="bg-rose-500/10 group-hover:bg-rose-500/20 p-1.5 rounded-lg transition-colors">
                                <LogOut className="w-4 h-4 text-rose-500 group-hover:text-rose-400" />
                            </div>
                            {t('nav.logout')}
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}
