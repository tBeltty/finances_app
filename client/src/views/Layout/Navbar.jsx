import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut, Menu, X, Wallet, Settings, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import NotificationCenter from '../../components/NotificationCenter';

export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { logout, user } = useAuth();
    const { openSettings, showLoans } = useUI();
    const { t } = useTranslation();
    const { logo } = useTheme();

    const getLogo = () => {
        switch (logo) {
            case 'takito': return '/logo-shiba.png';
            case 'cookie': return '/logo-ragdoll.png';
            default: return '/logo-cosmic.png';
        }
    };

    return (
        <nav className="bg-card/50 backdrop-blur-md border-b border-border sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center overflow-hidden">
                            <img src={getLogo()} alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xl font-bold text-primary">
                            {t('app.title')}
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-6">
                        <div className="flex items-center gap-1 mr-4 bg-surface-container rounded-xl p-1 border border-outline">
                            <NavLink
                                to="/"
                                className={({ isActive }) => `px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-primary-container text-on-primary-container shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                            >
                                {t('nav.expenses')}
                            </NavLink>
                            {showLoans && (
                                <NavLink
                                    to="/loans"
                                    className={({ isActive }) => `px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-primary-container text-on-primary-container shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                                >
                                    {t('nav.loans')}
                                </NavLink>
                            )}
                        </div>
                        <div className="text-secondary text-sm">
                            {t('nav.hello')} <span className="text-main font-medium">{user?.username}</span>
                        </div>
                        <NotificationCenter />
                        <button
                            onClick={openSettings}
                            className="flex items-center gap-2 text-secondary hover:text-main transition-colors cursor-pointer mr-4"
                        >
                            <Settings className="w-4 h-4" />
                            <span className="text-sm font-medium">{t('nav.settings')}</span>
                        </button>
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 text-secondary hover:text-rose-400 transition-colors cursor-pointer"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm font-medium">{t('nav.logout')}</span>
                        </button>
                    </div>

                    <div className="md:hidden flex items-center gap-2">
                        <NotificationCenter />
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="text-secondary hover:text-main p-2"
                        >
                            {mobileMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>
            </div>

            {mobileMenuOpen && (
                <div className="md:hidden absolute top-16 right-4 w-56 glass-menu border border-outline rounded-2xl shadow-2xl z-50 overflow-hidden ring-1 ring-white/10">
                    <div className="p-2 border-b border-border">
                        <div className="px-3 py-2 flex items-center gap-3 bg-surface-container-high rounded-xl">
                            <div className="bg-main p-1.5 rounded-lg">
                                <User className="w-4 h-4 text-secondary" />
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-[10px] text-secondary font-medium uppercase tracking-wider leading-none mb-0.5">{t('nav.connectedAs')}</span>
                                <span className="text-xs font-semibold text-main truncate">{user?.username}</span>
                            </div>
                        </div>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                        <NavLink
                            to="/"
                            onClick={() => setMobileMenuOpen(false)}
                            className={({ isActive }) => `w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-all ${isActive ? 'bg-primary-container text-on-primary-container' : 'text-secondary hover:text-main hover:bg-surface-container-high'}`}
                        >
                            <div className="p-1.5 rounded-lg flex items-center justify-center">
                                <Wallet className="w-4 h-4" />
                            </div>
                            {t('nav.expenses')}
                        </NavLink>
                        {showLoans && (
                            <NavLink
                                to="/loans"
                                onClick={() => setMobileMenuOpen(false)}
                                className={({ isActive }) => `w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-all ${isActive ? 'bg-primary-container text-on-primary-container' : 'text-secondary hover:text-main hover:bg-surface-container-high'}`}
                            >
                                <div className="p-1.5 rounded-lg flex items-center justify-center">
                                    <div className="w-4 h-4 flex items-center justify-center font-bold">$</div>
                                </div>
                                {t('nav.loans')}
                            </NavLink>
                        )}
                        <button
                            onClick={() => { openSettings(); setMobileMenuOpen(false); }}
                            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-secondary hover:text-main hover:bg-surface-container-high flex items-center gap-3 transition-all group"
                        >
                            <div className="bg-main group-hover:bg-primary/20 p-1.5 rounded-lg transition-colors">
                                <Settings className="w-4 h-4 text-primary group-hover:text-primary-hover" />
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
