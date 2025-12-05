import React, { useState, useEffect } from 'react';
import { X, Shield, List, Plus, Trash2, Edit2, Check, RefreshCw, Users, Copy, LogIn, Languages, Palette, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import CustomSelect from '../Inputs/CustomSelect';
import { APP_VERSION } from '../../config';

export default function SettingsModal({
    isOpen,
    onClose,
    categories,
    handleAddCategory,
    handleDeleteCategory,
    handleEditCategory,
    handleAddTemplateCategories,
    user,
    refreshUser,
    household,
    updateHouseholdSettings
}) {
    const { t, i18n } = useTranslation();
    const { theme, setTheme, mode, setMode, logo, setLogo } = useTheme();
    const [activeTab, setActiveTab] = useState('general');
    const [newCategory, setNewCategory] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('slate');
    const [currency, setCurrency] = useState(user?.currency || 'USD');

    const changeLanguage = async (lang) => {
        i18n.changeLanguage(lang);
        try {
            await fetch('/api/auth/update-language', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ language: lang })
            });
        } catch (error) {
            console.error('Error updating language:', error);
        }
    };

    // 2FA State
    const [is2FAEnabled, setIs2FAEnabled] = useState(user?.isTwoFactorEnabled || false);
    const [qrCode, setQrCode] = useState('');
    const [twoFactorSecret, setTwoFactorSecret] = useState('');
    const [token, setToken] = useState('');
    const [showSetup, setShowSetup] = useState(false);

    // Household State
    const [members, setMembers] = useState([]);
    const [inviteCode, setInviteCode] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [inviteExpires, setInviteExpires] = useState(null);
    const [renameStatus, setRenameStatus] = useState(''); // '', 'saving', 'saved'

    const handleRename = async (name) => {
        if (!name || name === user?.Households?.find(h => h.HouseholdMember.isDefault)?.name) return;

        setRenameStatus('saving');
        try {
            const res = await fetch('/api/households/rename', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ name })
            });
            if (res.ok) {
                if (refreshUser) refreshUser();
                setRenameStatus('saved');
                setTimeout(() => setRenameStatus(''), 2000);
            } else {
                console.error('Rename failed');
                setRenameStatus('');
            }
        } catch (err) {
            console.error(err);
            setRenameStatus('');
        }
    };

    useEffect(() => {
        if (isOpen && activeTab === 'household') {
            fetchMembers();
        }
    }, [isOpen, activeTab]);

    const fetchMembers = async () => {
        try {
            const res = await fetch('/api/households/members', {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMembers(data);
            }
        } catch (error) {
            console.error("Error fetching members:", error);
        }
    };

    const handleCreateInvite = async () => {
        try {
            const res = await fetch('/api/households/invite', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setInviteCode(data.code);
                setInviteExpires(new Date(data.expiresAt));
            } else {
                const err = await res.json();
                alert(err.message);
            }
        } catch (error) {
            console.error("Error creating invite:", error);
        }
    };

    const handleJoinHousehold = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/households/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ code: joinCode })
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                setJoinCode('');
                if (refreshUser) refreshUser();
                onClose();
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error("Error joining household:", error);
        }
    };

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState('');

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            setDeleteError(t('settings.deleteErrorPassword'));
            return;
        }

        try {
            const res = await fetch('/api/auth/me', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ password: deletePassword })
            });

            const data = await res.json();

            if (res.ok) {
                // Clear local data and redirect
                localStorage.clear();
                const { db } = await import('../../db');
                await db.delete();
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (let registration of registrations) {
                        await registration.unregister();
                    }
                }
                window.location.href = '/login';
            } else {
                setDeleteError(data.message || t('settings.deleteErrorGeneric'));
            }
        } catch (error) {
            console.error('Delete account error:', error);
            setDeleteError(t('settings.connectionError'));
        }
    };

    if (!isOpen) return null;

    const CURRENCIES = [
        { code: 'USD', label: t('currencies.USD'), locale: 'en-US' },
        { code: 'EUR', label: t('currencies.EUR'), locale: 'de-DE' },
        { code: 'COP', label: t('currencies.COP'), locale: 'es-CO' },
        { code: 'MXN', label: t('currencies.MXN'), locale: 'es-MX' },
        { code: 'ARS', label: t('currencies.ARS'), locale: 'es-AR' },
        { code: 'HNL', label: t('currencies.HNL'), locale: 'es-HN' },
    ];

    // ... (rest of existing functions: handleCurrencyChange, 2FA handlers, category handlers)
    const handleCurrencyChange = async (newCurrency) => {
        setCurrency(newCurrency);
        try {
            const res = await fetch('/api/auth/currency', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ currency: newCurrency })
            });
            if (res.ok) {
                if (refreshUser) refreshUser();
            }
        } catch (error) {
            console.error("Error updating currency:", error);
        }
    };

    const handleEnable2FA = async () => {
        try {
            const res = await fetch('/api/auth/2fa/enable', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setQrCode(data.qrCode);
                setTwoFactorSecret(data.secret);
                setShowSetup(true);
            }
        } catch (error) {
            console.error("Error enabling 2FA:", error);
        }
    };

    const handleDisable2FA = async () => {
        if (!confirm(t('settings.confirmDisable2FA'))) return;
        try {
            const res = await fetch('/api/auth/2fa/disable', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (res.ok) {
                setIs2FAEnabled(false);
                if (refreshUser) refreshUser();
            }
        } catch (error) {
            console.error("Error disabling 2FA:", error);
        }
    };

    const handleVerify2FA = async () => {
        try {
            const res = await fetch('/api/auth/2fa/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ token, secret: twoFactorSecret })
            });

            if (res.ok) {
                setIs2FAEnabled(true);
                setShowSetup(false);
                setToken('');
                if (refreshUser) refreshUser();
                alert(t('settings.2faActivated'));
            } else {
                alert(t('settings.incorrectCode'));
            }
        } catch (error) {
            console.error("Error verifying 2FA:", error);
        }
    };

    const onAddCategory = (e) => {
        e.preventDefault();
        handleAddCategory(newCategory);
        setNewCategory('');
    };

    const startEdit = (cat) => {
        setEditingId(cat.id);
        setEditName(cat.name);
        setEditColor(cat.color);
    };

    const saveEdit = () => {
        handleEditCategory({ id: editingId, name: editName, color: editColor });
        setEditingId(null);
    };

    const COLORS = [
        { name: 'slate', hex: '#64748b' },
        { name: 'red', hex: '#ef4444' },
        { name: 'orange', hex: '#f97316' },
        { name: 'amber', hex: '#f59e0b' },
        { name: 'yellow', hex: '#eab308' },
        { name: 'lime', hex: '#84cc16' },
        { name: 'green', hex: '#22c55e' },
        { name: 'emerald', hex: '#10b981' },
        { name: 'teal', hex: '#14b8a6' },
        { name: 'cyan', hex: '#06b6d4' },
        { name: 'sky', hex: '#0ea5e9' },
        { name: 'blue', hex: '#3b82f6' },
        { name: 'indigo', hex: '#6366f1' },
        { name: 'violet', hex: '#8b5cf6' },
        { name: 'purple', hex: '#a855f7' },
        { name: 'fuchsia', hex: '#d946ef' },
        { name: 'pink', hex: '#ec4899' },
        { name: 'rose', hex: '#f43f5e' }
    ];

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl relative">

                {/* Delete Confirmation Modal Overlay */}
                {showDeleteConfirm && (
                    <div className="absolute inset-0 bg-main/90 backdrop-blur-sm z-50 flex items-center justify-center p-6 rounded-2xl">
                        <div className="bg-card border border-rose-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-6">
                            <div className="flex items-center gap-4 text-error">
                                <div className="bg-error/10 p-3 rounded-full">
                                    <Trash2 className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-bold text-main">{t('settings.deleteAccountConfirmTitle')}</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-rose-950/30 border border-rose-500/20 p-4 rounded-xl">
                                    <p className="text-rose-200 text-sm font-medium">
                                        {t('settings.deleteAccountConfirmDesc')}
                                    </p>
                                    <ul className="list-disc list-inside text-rose-300/70 text-xs mt-2 space-y-1">
                                        <li>{t('settings.deleteAccountWarning1')}</li>
                                        <li>{t('settings.deleteAccountWarning2')}</li>
                                        <li>{t('settings.deleteAccountWarning3')}</li>
                                    </ul>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-secondary">{t('settings.enterPasswordConfirm')}</label>
                                    <input
                                        type="password"
                                        value={deletePassword}
                                        onChange={(e) => {
                                            setDeletePassword(e.target.value);
                                            setDeleteError('');
                                        }}
                                        className="w-full bg-main border border-border rounded-xl px-4 py-3 text-main focus:border-rose-500 focus:outline-none"
                                        placeholder={t('settings.currentPasswordPlaceholder')}
                                    />
                                    {deleteError && <p className="text-error text-sm">{deleteError}</p>}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setDeletePassword('');
                                        setDeleteError('');
                                    }}
                                    className="flex-1 py-3 text-secondary hover:text-main font-medium transition-colors"
                                >
                                    {t('settings.cancel')}
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-main rounded-xl font-bold shadow-lg shadow-rose-900/20 transition-all hover:scale-[1.02]"
                                >
                                    {t('settings.confirmDelete')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-main">{t('settings.title')}</h2>
                    <button onClick={onClose} className="text-secondary hover:text-main transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border overflow-x-auto no-scrollbar px-2">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`flex-1 min-w-fit px-4 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'general'
                            ? 'text-primary border-b-2 border-primary bg-primary/5'
                            : 'text-secondary hover:text-main'
                            }`}
                    >
                        <RefreshCw className="h-4 w-4" />
                        {t('settings.general')}
                    </button>
                    <button
                        onClick={() => setActiveTab('appearance')}
                        className={`flex-1 min-w-fit px-4 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'appearance'
                            ? 'text-primary border-b-2 border-primary bg-primary/5'
                            : 'text-secondary hover:text-main'
                            }`}
                    >
                        <Palette className="h-4 w-4" />
                        {t('settings.appearance')}
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`flex-1 min-w-fit px-4 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'categories'
                            ? 'text-primary border-b-2 border-primary bg-primary/5'
                            : 'text-secondary hover:text-main'
                            }`}
                    >
                        <List className="h-4 w-4" />
                        {t('settings.categories')}
                    </button>
                    <button
                        onClick={() => setActiveTab('household')}
                        className={`flex-1 min-w-fit px-4 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'household'
                            ? 'text-primary border-b-2 border-primary bg-primary/5'
                            : 'text-secondary hover:text-main'
                            }`}
                    >
                        <Users className="h-4 w-4" />
                        {t('settings.household')}
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`flex-1 min-w-fit px-4 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'security'
                            ? 'text-primary border-b-2 border-primary bg-primary/5'
                            : 'text-secondary hover:text-main'
                            }`}
                    >
                        <Shield className="h-4 w-4" />
                        {t('settings.security')}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'general' && (
                        <div className="space-y-8">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-secondary">{t('settings.currency')}</label>
                                <div className="relative">
                                    <CustomSelect
                                        value={currency}
                                        onChange={handleCurrencyChange}
                                        options={CURRENCIES.map(c => ({ value: c.code, label: c.label }))}
                                        placeholder={t('settings.currency')}
                                    />
                                </div>
                                <p className="text-xs text-secondary/70 mt-2">
                                    {t('settings.currencyDesc')}
                                </p>
                            </div>

                            <div className="pt-4 border-t border-border">
                                <p className="text-xs text-secondary/50 text-center">
                                    v{APP_VERSION}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-secondary">{t('settings.language')}</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => changeLanguage('en')}
                                        className={`p-3 rounded-xl border text-left transition-all ${i18n.language === 'en'
                                            ? 'bg-primary/20 border-primary text-main'
                                            : 'bg-main border-border text-secondary hover:border-secondary'
                                            }`}
                                    >
                                        <div className="font-bold flex items-center gap-2">🇺🇸 English</div>
                                    </button>
                                    <button
                                        onClick={() => changeLanguage('es')}
                                        className={`p-3 rounded-xl border text-left transition-all ${i18n.language === 'es'
                                            ? 'bg-primary/20 border-primary text-main'
                                            : 'bg-main border-border text-secondary hover:border-secondary'
                                            }`}
                                    >
                                        <div className="font-bold flex items-center gap-2">🇪🇸 Español</div>
                                    </button>
                                </div>
                            </div>

                            {/* Auto Savings Section */}
                            <div className="pt-8 border-t border-border">
                                <h3 className="text-sm font-bold text-secondary uppercase mb-4">{t('settings.autoSavings')}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-secondary">{t('settings.goalType')}</label>
                                        <div className="relative">
                                            <CustomSelect
                                                value={household?.savingsGoalType || 'NONE'}
                                                onChange={(val) => updateHouseholdSettings({ savingsGoalType: val })}
                                                options={[
                                                    { value: 'NONE', label: t('settings.goalTypeNone') },
                                                    { value: 'PERCENT', label: t('settings.goalTypePercent') },
                                                    { value: 'FIXED', label: t('settings.goalTypeFixed') }
                                                ]}
                                                placeholder={t('settings.goalType')}
                                            />
                                        </div>
                                    </div>

                                    {household?.savingsGoalType !== 'NONE' && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
                                            <label className="text-xs font-medium text-secondary">
                                                {household?.savingsGoalType === 'PERCENT' ? t('settings.savingsGoalValuePercent') : t('settings.savingsGoalValueFixed')}
                                            </label>
                                            <input
                                                type="number"
                                                value={household?.savingsGoalValue || ''}
                                                onChange={(e) => updateHouseholdSettings({ savingsGoalValue: parseFloat(e.target.value) })}
                                                placeholder={household?.savingsGoalType === 'PERCENT' ? t('settings.savingsGoalPercentPlaceholder') : t('settings.savingsGoalFixedPlaceholder')}
                                                className="w-full bg-main border border-border text-main rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all"
                                            />
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-secondary/70 mt-2">
                                    {t('settings.autoSavingsDesc')}
                                </p>
                            </div>

                            {/* Danger Zone */}
                            <div className="pt-8 border-t border-border">
                                <h3 className="text-error font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Trash2 className="h-4 w-4" />
                                    {t('settings.dangerZone')}
                                </h3>
                                <div className="bg-rose-950/10 border border-rose-900/30 rounded-xl p-4 flex items-center justify-between">
                                    <div>
                                        <h4 className="text-main font-medium">{t('settings.deleteAccount')}</h4>
                                        <p className="text-secondary text-xs mt-1">{t('settings.deleteAccountDesc')}</p>
                                    </div>
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="px-4 py-2 bg-error/10 hover:bg-error/20 text-error rounded-lg text-sm font-medium transition-colors border border-rose-500/20"
                                    >
                                        {t('settings.deleteAccountButton')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-secondary uppercase tracking-wider">Tema</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {[
                                        { id: 'cosmic', name: 'Cosmic Slate', icon: '/logo-cosmic.png', color: 'bg-surface' },
                                        { id: 'takito', name: 'Takito', icon: '/logo-shiba.png', color: 'bg-amber-950' },
                                        { id: 'cookie', name: 'Cookie', icon: '/logo-ragdoll.png', color: 'bg-sky-950' }
                                    ].map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setTheme(t.id)}
                                            className={`relative p-4 rounded-xl border transition-all flex flex-col items-center gap-3 group ${theme === t.id
                                                ? 'bg-primary/20 border-primary ring-2 ring-primary/20'
                                                : 'bg-main border-border hover:border-secondary'
                                                }`}
                                        >
                                            <div className={`w-12 h-12 rounded-full ${t.color} flex items-center justify-center overflow-hidden border-2 ${theme === t.id ? 'border-primary' : 'border-border'}`}>
                                                <img src={t.icon} alt={t.name} className="w-full h-full object-cover" />
                                            </div>
                                            <span className={`font-medium ${theme === t.id ? 'text-main' : 'text-secondary group-hover:text-main'}`}>
                                                {t.name}
                                            </span>
                                            {theme === t.id && (
                                                <div className="absolute top-3 right-3 bg-primary rounded-full p-1">
                                                    <Check className="h-3 w-3 text-main" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-border">
                                <h3 className="text-sm font-bold text-secondary uppercase tracking-wider">Modo</h3>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setMode('light')}
                                        className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border transition-all ${mode === 'light'
                                            ? 'bg-white text-slate-900 border-slate-200 shadow-lg'
                                            : 'bg-main border-border text-secondary hover:border-secondary'
                                            }`}
                                    >
                                        <Sun className="h-6 w-6" />
                                        <span className="font-bold">Light Mode</span>
                                    </button>
                                    <button
                                        onClick={() => setMode('dark')}
                                        className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border transition-all ${mode === 'dark'
                                            ? 'bg-surface-container text-main border-primary shadow-lg shadow-primary/10'
                                            : 'bg-main border-border text-secondary hover:border-secondary'
                                            }`}
                                    >
                                        <Moon className="h-6 w-6" />
                                        <span className="font-bold">Dark Mode</span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-border">
                                <h3 className="text-sm font-bold text-secondary uppercase tracking-wider">Logo / Mascota</h3>
                                <p className="text-xs text-secondary">El logo se usará como favicon y al instalar la PWA</p>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { id: 'cosmic', name: 'Cosmic', icon: '/logo-cosmic.png' },
                                        { id: 'takito', name: 'Takito', icon: '/logo-shiba.png' },
                                        { id: 'cookie', name: 'Cookie', icon: '/logo-ragdoll.png' }
                                    ].map((l) => (
                                        <button
                                            key={l.id}
                                            onClick={() => setLogo(l.id)}
                                            className={`relative p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${logo === l.id
                                                ? 'bg-primary/20 border-primary ring-2 ring-primary/20'
                                                : 'bg-main border-border hover:border-secondary'
                                                }`}
                                        >
                                            <div className={`w-14 h-14 rounded-full overflow-hidden border-2 ${logo === l.id ? 'border-primary' : 'border-border'}`}>
                                                <img src={l.icon} alt={l.name} className="w-full h-full object-cover" />
                                            </div>
                                            <span className={`text-sm font-medium ${logo === l.id ? 'text-main' : 'text-secondary'}`}>
                                                {l.name}
                                            </span>
                                            {logo === l.id && (
                                                <div className="absolute top-2 right-2 bg-primary rounded-full p-0.5">
                                                    <Check className="h-3 w-3 text-main" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'categories' && (
                        <div className="space-y-8">
                            {/* Add New */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-secondary uppercase tracking-wider">{t('settings.newCategory')}</h3>
                                <form onSubmit={onAddCategory} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        placeholder={t('settings.categoryNamePlaceholder')}
                                        className="flex-1 bg-main border border-border rounded-xl px-4 py-2 text-main focus:border-primary focus:outline-none"
                                    />
                                    <button
                                        type="submit"
                                        className="bg-primary hover:bg-primary-hover text-main p-2 rounded-xl transition-colors"
                                    >
                                        <Plus className="h-6 w-6" />
                                    </button>
                                </form>

                                <div className="pt-2 border-t border-border">
                                    <button
                                        onClick={() => {
                                            if (confirm(t('settings.confirmLoadTemplates'))) {
                                                handleAddTemplateCategories();
                                            }
                                        }}
                                        className="w-full py-3 bg-card hover:bg-main text-secondary rounded-xl flex items-center justify-center gap-2 transition-colors border border-border hover:border-secondary"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                        {t('settings.loadTemplates')}
                                    </button>
                                </div>
                            </div>

                            {/* List */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-secondary uppercase tracking-wider">{t('settings.yourCategories')}</h3>
                                <div className="space-y-2">
                                    {categories.map(cat => (
                                        <div key={cat.id} className="flex items-center justify-between bg-card border border-border p-3 rounded-xl group">
                                            {editingId === cat.id ? (
                                                <div className="flex-1 flex flex-col md:flex-row items-start md:items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="w-full md:w-auto flex-1 bg-main border border-border rounded-lg px-3 py-1 text-main text-sm focus:outline-none"
                                                        autoFocus
                                                    />
                                                    <div className="flex flex-wrap gap-1">
                                                        {COLORS.map(c => (
                                                            <button
                                                                key={c.name}
                                                                onClick={() => setEditColor(c.name)}
                                                                className={`w-6 h-6 rounded-full border-2 ${editColor === c.name ? 'border-white' : 'border-transparent'}`}
                                                                style={{ backgroundColor: c.hex }}
                                                            />
                                                        ))}
                                                    </div>
                                                    <button onClick={saveEdit} className="text-success hover:text-success p-1">
                                                        <Check className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className="text-secondary hover:text-main p-1">
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="w-4 h-4 rounded-full"
                                                            style={{ backgroundColor: COLORS.find(c => c.name === cat.color)?.hex || '#64748b' }}
                                                        />
                                                        <span className="text-main font-medium">{cat.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => startEdit(cat)}
                                                            className="text-secondary hover:text-primary p-1 transition-colors"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (confirm(t('settings.confirmDeleteCategory'))) {
                                                                    const result = await handleDeleteCategory(cat.id);
                                                                    if (result && !result.success) {
                                                                        alert(result.message || t('settings.deleteCategoryError'));
                                                                    }
                                                                }
                                                            }}
                                                            className="text-secondary hover:text-error p-1 transition-colors"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'household' && (
                        <div className="space-y-8">
                            {/* Rename Section */}
                            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-main p-2 rounded-lg">
                                            <Edit2 className="h-6 w-6 text-secondary" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-main">{t('settings.householdName')}</h3>
                                            <p className="text-sm text-secondary">{t('settings.householdNameDesc')}</p>
                                        </div>
                                    </div>
                                    {renameStatus === 'saving' && <span className="text-xs text-primary animate-pulse">{t('settings.saving')}</span>}
                                    {renameStatus === 'saved' && <span className="text-xs text-success font-bold flex items-center gap-1"><Check className="w-3 h-3" /> {t('settings.saved')}</span>}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder={t('settings.householdNamePlaceholder')}
                                        className="flex-1 bg-main border border-border rounded-xl px-4 py-2 text-main focus:border-primary focus:outline-none transition-all"
                                        defaultValue={user?.Households?.find(h => h.HouseholdMember.isDefault)?.name || ''}
                                        onBlur={(e) => handleRename(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.target.blur(); // Triggers onBlur
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Invite Section */}
                            <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/20 p-2 rounded-lg">
                                        <Users className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-main">{t('settings.inviteMembers')}</h3>
                                        <p className="text-sm text-secondary">{t('settings.inviteMembersDesc')}</p>
                                    </div>
                                </div>

                                {inviteCode ? (
                                    <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-xs text-secondary uppercase tracking-wider font-bold">{t('settings.inviteCode')}</p>
                                            <p className="text-2xl font-mono font-bold text-main tracking-widest">{inviteCode}</p>
                                            <p className="text-xs text-secondary">{t('settings.expires')} {inviteExpires?.toLocaleString()}</p>
                                        </div>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(inviteCode)}
                                            className="p-2 hover:bg-main rounded-lg text-secondary hover:text-main transition-colors"
                                        >
                                            <Copy className="h-5 w-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleCreateInvite}
                                        className="w-full py-3 bg-primary hover:bg-primary-hover text-main rounded-xl font-medium transition-colors"
                                    >
                                        {t('settings.generateInviteCode')}
                                    </button>
                                )}
                            </div>

                            {/* Join Section */}
                            <div className="space-y-4 pt-4 border-t border-border">
                                <h3 className="text-sm font-bold text-secondary uppercase tracking-wider">{t('settings.joinHousehold')}</h3>
                                <form onSubmit={handleJoinHousehold} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                        placeholder={t('settings.joinCodePlaceholder')}
                                        className="flex-1 bg-main border border-border rounded-xl px-4 py-2 text-main focus:border-primary focus:outline-none font-mono"
                                        maxLength={8}
                                    />
                                    <button
                                        type="submit"
                                        className="bg-surface-container hover:bg-surface-container-high text-main px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
                                    >
                                        <LogIn className="h-4 w-4" />
                                        {t('settings.join')}
                                    </button>
                                </form>
                            </div>

                            {/* Members List */}
                            <div className="space-y-4 pt-4 border-t border-outline">
                                <h3 className="text-sm font-bold text-secondary uppercase tracking-wider">{t('settings.householdMembers')}</h3>
                                <div className="space-y-2">
                                    {members.map(member => (
                                        <div key={member.id} className="flex items-center justify-between bg-surface border border-outline p-3 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-secondary font-bold">
                                                    {member.User?.username?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-main font-medium">{member.User?.username}</p>
                                                    <p className="text-xs text-slate-500">{member.role === 'owner' ? t('settings.roleOwner') : t('settings.roleMember')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-6 text-center py-8">
                            <div className="bg-surface inline-block p-6 rounded-full mb-4">
                                <Shield className="h-12 w-12 text-indigo-500" />
                            </div>
                            <h3 className="text-xl font-bold text-main">{t('settings.2faTitle')}</h3>
                            <p className="text-secondary max-w-md mx-auto">
                                {is2FAEnabled
                                    ? t('settings.2faEnabledDesc')
                                    : t('settings.2faDisabledDesc')}
                            </p>

                            {!showSetup ? (
                                <button
                                    onClick={is2FAEnabled ? handleDisable2FA : handleEnable2FA}
                                    className={`px-6 py-3 rounded-xl font-medium transition-colors ${is2FAEnabled
                                        ? 'bg-error/10 text-error hover:bg-error/20 border border-rose-500/50'
                                        : 'bg-primary hover:bg-primary-container text-main'
                                        }`}
                                >
                                    {is2FAEnabled ? t('settings.disable2FA') : t('settings.enable2FA')}
                                </button>
                            ) : (
                                <div className="bg-surface p-6 rounded-xl border border-outline max-w-sm mx-auto space-y-4">
                                    <div className="bg-white p-2 rounded-lg inline-block">
                                        <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                                    </div>
                                    <div className="text-left space-y-2">
                                        <p className="text-sm text-secondary">{t('settings.2faStep1')}</p>
                                        <p className="text-sm text-secondary">{t('settings.2faStep2')}</p>
                                    </div>
                                    <input
                                        type="text"
                                        value={token}
                                        onChange={(e) => setToken(e.target.value)}
                                        placeholder="000000"
                                        className="w-full bg-surface-container border border-outline rounded-lg px-4 py-2 text-center text-xl tracking-widest text-main focus:border-primary focus:outline-none"
                                        maxLength={6}
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowSetup(false)}
                                            className="flex-1 py-2 text-secondary hover:text-main transition-colors"
                                        >
                                            {t('settings.cancel')}
                                        </button>
                                        <button
                                            onClick={handleVerify2FA}
                                            className="flex-1 py-2 bg-primary hover:bg-primary-container text-main rounded-lg transition-colors"
                                        >
                                            {t('settings.verify')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-outline flex justify-between items-center bg-surface-container">
                    <button
                        onClick={async () => {
                            if (confirm(t('settings.confirmReset'))) {
                                localStorage.clear();
                                const { db } = await import('../../db');
                                await db.delete();
                                // Force unregister SW
                                if ('serviceWorker' in navigator) {
                                    const registrations = await navigator.serviceWorker.getRegistrations();
                                    for (let registration of registrations) {
                                        await registration.unregister();
                                    }
                                }
                                window.location.reload();
                            }
                        }}
                        className="text-xs text-error hover:text-error underline"
                    >
                        {t('settings.resetApp')}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-main rounded-lg transition-colors"
                    >
                        {t('settings.close')}
                    </button>
                </div>
            </div>
        </div>
    );
}
