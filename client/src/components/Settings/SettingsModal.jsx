import React, { useState, useEffect } from 'react';
import { X, Shield, List, Plus, Trash2, Edit2, Check, RefreshCw, Users, Copy, LogIn } from 'lucide-react';

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
    const [activeTab, setActiveTab] = useState('general');
    const [newCategory, setNewCategory] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('slate');
    const [currency, setCurrency] = useState(user?.currency || 'USD');

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
            setDeleteError('Ingresa tu contraseña para confirmar');
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
                setDeleteError(data.message || 'Error al eliminar cuenta');
            }
        } catch (error) {
            console.error('Delete account error:', error);
            setDeleteError('Error de conexión');
        }
    };

    if (!isOpen) return null;

    const CURRENCIES = [
        { code: 'USD', label: 'Dólar Estadounidense ($)', locale: 'en-US' },
        { code: 'EUR', label: 'Euro (€)', locale: 'de-DE' },
        { code: 'COP', label: 'Peso Colombiano ($)', locale: 'es-CO' },
        { code: 'MXN', label: 'Peso Mexicano ($)', locale: 'es-MX' },
        { code: 'HNL', label: 'Lempira Hondureño (L)', locale: 'es-HN' },
    ];

    // ... (rest of existing functions: handleCurrencyChange, 2FA handlers, category handlers)
    const handleCurrencyChange = async (e) => {
        const newCurrency = e.target.value;
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
        if (!confirm('¿Estás seguro de que deseas desactivar la autenticación de dos factores?')) return;
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
                alert('2FA activado correctamente');
            } else {
                alert('Código incorrecto');
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
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl relative">

                {/* Delete Confirmation Modal Overlay */}
                {showDeleteConfirm && (
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-6 rounded-2xl">
                        <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-6">
                            <div className="flex items-center gap-4 text-rose-500">
                                <div className="bg-rose-500/10 p-3 rounded-full">
                                    <Trash2 className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-bold text-white">¿Eliminar Cuenta?</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-rose-950/30 border border-rose-500/20 p-4 rounded-xl">
                                    <p className="text-rose-200 text-sm font-medium">
                                        Esta acción es permanente e irreversible.
                                    </p>
                                    <ul className="list-disc list-inside text-rose-300/70 text-xs mt-2 space-y-1">
                                        <li>Se borrarán todos tus gastos e ingresos.</li>
                                        <li>Se eliminarán tus categorías y ahorros.</li>
                                        <li>Perderás acceso a tus hogares compartidos.</li>
                                    </ul>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-slate-400">Ingresa tu contraseña para confirmar:</label>
                                    <input
                                        type="password"
                                        value={deletePassword}
                                        onChange={(e) => {
                                            setDeletePassword(e.target.value);
                                            setDeleteError('');
                                        }}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-rose-500 focus:outline-none"
                                        placeholder="Tu contraseña actual"
                                    />
                                    {deleteError && <p className="text-rose-500 text-sm">{deleteError}</p>}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setDeletePassword('');
                                        setDeleteError('');
                                    }}
                                    className="flex-1 py-3 text-slate-400 hover:text-white font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-900/20 transition-all hover:scale-[1.02]"
                                >
                                    Sí, Eliminar Todo
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <h2 className="text-xl font-bold text-white">Ajustes</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-800 overflow-x-auto no-scrollbar px-2">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`flex-1 min-w-fit px-4 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'general'
                            ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5'
                            : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        <RefreshCw className="h-4 w-4" />
                        General
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`flex-1 min-w-fit px-4 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'categories'
                            ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5'
                            : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        <List className="h-4 w-4" />
                        Categorías
                    </button>
                    <button
                        onClick={() => setActiveTab('household')}
                        className={`flex-1 min-w-fit px-4 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'household'
                            ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5'
                            : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        <Users className="h-4 w-4" />
                        Hogar
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`flex-1 min-w-fit px-4 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'security'
                            ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5'
                            : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        <Shield className="h-4 w-4" />
                        Seguridad
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'general' && (
                        <div className="space-y-8">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">Moneda Principal</label>
                                <div className="relative">
                                    <select
                                        value={currency}
                                        onChange={handleCurrencyChange}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white appearance-none focus:border-indigo-500 focus:outline-none cursor-pointer"
                                    >
                                        {CURRENCIES.map((curr) => (
                                            <option key={curr.code} value={curr.code}>
                                                {curr.label}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    Esto cambiará el símbolo de moneda y el formato de números en toda la aplicación.
                                </p>
                            </div>

                            {/* Auto Savings Section */}
                            <div className="pt-8 border-t border-slate-800">
                                <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Ahorro Automático</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-400">Tipo de Meta</label>
                                        <div className="relative">
                                            <select
                                                value={household?.savingsGoalType || 'NONE'}
                                                onChange={(e) => updateHouseholdSettings({ savingsGoalType: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                                            >
                                                <option value="NONE">Desactivado</option>
                                                <option value="PERCENT">Porcentaje (%)</option>
                                                <option value="FIXED">Monto Fijo</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    {household?.savingsGoalType !== 'NONE' && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
                                            <label className="text-xs font-medium text-slate-400">
                                                {household?.savingsGoalType === 'PERCENT' ? 'Porcentaje a Ahorrar (%)' : 'Monto a Ahorrar'}
                                            </label>
                                            <input
                                                type="number"
                                                value={household?.savingsGoalValue || ''}
                                                onChange={(e) => updateHouseholdSettings({ savingsGoalValue: parseFloat(e.target.value) })}
                                                placeholder={household?.savingsGoalType === 'PERCENT' ? 'Ej: 10' : 'Ej: 200'}
                                                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    Al guardar tu ingreso mensual, se te preguntará si deseas mover esta cantidad a tus ahorros automáticamente.
                                </p>
                            </div>

                            {/* Danger Zone */}
                            <div className="pt-8 border-t border-slate-800">
                                <h3 className="text-rose-500 font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Trash2 className="h-4 w-4" />
                                    Zona de Peligro
                                </h3>
                                <div className="bg-rose-950/10 border border-rose-900/30 rounded-xl p-4 flex items-center justify-between">
                                    <div>
                                        <h4 className="text-white font-medium">Eliminar Cuenta</h4>
                                        <p className="text-slate-400 text-xs mt-1">Borrar permanentemente tu cuenta y todos sus datos.</p>
                                    </div>
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg text-sm font-medium transition-colors border border-rose-500/20"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'categories' && (
                        <div className="space-y-8">
                            {/* Add New */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Nueva Categoría</h3>
                                <form onSubmit={onAddCategory} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        placeholder="Nombre de la categoría..."
                                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                                    />
                                    <button
                                        type="submit"
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl transition-colors"
                                    >
                                        <Plus className="h-6 w-6" />
                                    </button>
                                </form>

                                <div className="pt-2 border-t border-slate-800">
                                    <button
                                        onClick={() => {
                                            if (confirm('¿Deseas cargar las categorías por defecto? (Servicios, Hogar, Transporte, etc.)')) {
                                                handleAddTemplateCategories();
                                            }
                                        }}
                                        className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-700 hover:border-slate-600"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                        Cargar Plantillas (Templates)
                                    </button>
                                </div>
                            </div>

                            {/* List */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Tus Categorías</h3>
                                <div className="space-y-2">
                                    {categories.map(cat => (
                                        <div key={cat.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 p-3 rounded-xl group">
                                            {editingId === cat.id ? (
                                                <div className="flex-1 flex flex-col md:flex-row items-start md:items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="w-full md:w-auto flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-white text-sm focus:outline-none"
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
                                                    <button onClick={saveEdit} className="text-emerald-400 hover:text-emerald-300 p-1">
                                                        <Check className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-300 p-1">
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
                                                        <span className="text-slate-200 font-medium">{cat.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => startEdit(cat)}
                                                            className="text-slate-400 hover:text-indigo-400 p-1 transition-colors"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (confirm('¿Eliminar esta categoría?')) {
                                                                    const result = await handleDeleteCategory(cat.id);
                                                                    if (result && !result.success) {
                                                                        alert(result.message || 'Error al eliminar');
                                                                    }
                                                                }
                                                            }}
                                                            className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
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
                            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-800 p-2 rounded-lg">
                                            <Edit2 className="h-6 w-6 text-slate-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">Nombre del Hogar</h3>
                                            <p className="text-sm text-slate-400">Personaliza el nombre de tu espacio compartido.</p>
                                        </div>
                                    </div>
                                    {renameStatus === 'saving' && <span className="text-xs text-indigo-400 animate-pulse">Guardando...</span>}
                                    {renameStatus === 'saved' && <span className="text-xs text-emerald-400 font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Guardado</span>}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Ej: Familia Pérez"
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:border-indigo-500 focus:outline-none transition-all"
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
                            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-indigo-500/20 p-2 rounded-lg">
                                        <Users className="h-6 w-6 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Invitar Miembros</h3>
                                        <p className="text-sm text-slate-400">Genera un código para invitar a otros a tu hogar.</p>
                                    </div>
                                </div>

                                {inviteCode ? (
                                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Código de Invitación</p>
                                            <p className="text-2xl font-mono font-bold text-white tracking-widest">{inviteCode}</p>
                                            <p className="text-xs text-slate-500">Expira: {inviteExpires?.toLocaleString()}</p>
                                        </div>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(inviteCode)}
                                            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                                        >
                                            <Copy className="h-5 w-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleCreateInvite}
                                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors"
                                    >
                                        Generar Código de Invitación
                                    </button>
                                )}
                            </div>

                            {/* Join Section */}
                            <div className="space-y-4 pt-4 border-t border-slate-800">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Unirse a otro Hogar</h3>
                                <form onSubmit={handleJoinHousehold} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                        placeholder="Ingresa el código de invitación..."
                                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:border-indigo-500 focus:outline-none font-mono"
                                        maxLength={8}
                                    />
                                    <button
                                        type="submit"
                                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
                                    >
                                        <LogIn className="h-4 w-4" />
                                        Unirse
                                    </button>
                                </form>
                            </div>

                            {/* Members List */}
                            <div className="space-y-4 pt-4 border-t border-slate-800">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Miembros del Hogar</h3>
                                <div className="space-y-2">
                                    {members.map(member => (
                                        <div key={member.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 p-3 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold">
                                                    {member.User?.username?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{member.User?.username}</p>
                                                    <p className="text-xs text-slate-500">{member.role === 'owner' ? 'Propietario' : 'Miembro'}</p>
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
                            <div className="bg-slate-950 inline-block p-6 rounded-full mb-4">
                                <Shield className="h-12 w-12 text-indigo-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Autenticación de Dos Factores (2FA)</h3>
                            <p className="text-slate-400 max-w-md mx-auto">
                                {is2FAEnabled
                                    ? "Tu cuenta está protegida con autenticación de dos factores."
                                    : "Añade una capa extra de seguridad a tu cuenta requiriendo un código de tu aplicación autenticadora al iniciar sesión."}
                            </p>

                            {!showSetup ? (
                                <button
                                    onClick={is2FAEnabled ? handleDisable2FA : handleEnable2FA}
                                    className={`px-6 py-3 rounded-xl font-medium transition-colors ${is2FAEnabled
                                        ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/50'
                                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                        }`}
                                >
                                    {is2FAEnabled ? 'Desactivar 2FA' : 'Activar 2FA'}
                                </button>
                            ) : (
                                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 max-w-sm mx-auto space-y-4">
                                    <div className="bg-white p-2 rounded-lg inline-block">
                                        <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                                    </div>
                                    <div className="text-left space-y-2">
                                        <p className="text-sm text-slate-400">1. Escanea el código QR con tu app autenticadora (Google Authenticator, Authy, etc).</p>
                                        <p className="text-sm text-slate-400">2. Ingresa el código de 6 dígitos que genera la app:</p>
                                    </div>
                                    <input
                                        type="text"
                                        value={token}
                                        onChange={(e) => setToken(e.target.value)}
                                        placeholder="000000"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-center text-xl tracking-widest text-white focus:border-indigo-500 focus:outline-none"
                                        maxLength={6}
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowSetup(false)}
                                            className="flex-1 py-2 text-slate-400 hover:text-white transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleVerify2FA}
                                            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                                        >
                                            Verificar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <button
                        onClick={async () => {
                            if (confirm('¿Estás seguro? Esto borrará los datos locales y recargará la página. (Tus datos en el servidor están seguros)')) {
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
                        className="text-xs text-rose-500 hover:text-rose-400 underline"
                    >
                        Reset App / Borrar Cache
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
