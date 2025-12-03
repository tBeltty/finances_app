import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Save, Palette } from 'lucide-react';

export default function CategoryEditModal({ category, onClose, onSave }) {
    const { t } = useTranslation();
    const [name, setName] = useState(category.name);
    const [color, setColor] = useState(category.color || 'slate');
    const [isSaving, setIsSaving] = useState(false);

    const COLORS = [
        { name: 'slate', label: t('common.colors.slate'), hex: '#64748b' },
        { name: 'red', label: t('common.colors.red'), hex: '#ef4444' },
        { name: 'orange', label: t('common.colors.orange'), hex: '#f97316' },
        { name: 'amber', label: t('common.colors.amber'), hex: '#f59e0b' },
        { name: 'yellow', label: t('common.colors.yellow'), hex: '#eab308' },
        { name: 'lime', label: t('common.colors.lime'), hex: '#84cc16' },
        { name: 'green', label: t('common.colors.green'), hex: '#22c55e' },
        { name: 'emerald', label: t('common.colors.emerald'), hex: '#10b981' },
        { name: 'teal', label: t('common.colors.teal'), hex: '#14b8a6' },
        { name: 'cyan', label: t('common.colors.cyan'), hex: '#06b6d4' },
        { name: 'sky', label: t('common.colors.sky'), hex: '#0ea5e9' },
        { name: 'blue', label: t('common.colors.blue'), hex: '#3b82f6' },
        { name: 'indigo', label: t('common.colors.indigo'), hex: '#6366f1' },
        { name: 'violet', label: t('common.colors.violet'), hex: '#8b5cf6' },
        { name: 'purple', label: t('common.colors.purple'), hex: '#a855f7' },
        { name: 'fuchsia', label: t('common.colors.fuchsia'), hex: '#d946ef' },
        { name: 'pink', label: t('common.colors.pink'), hex: '#ec4899' },
        { name: 'rose', label: t('common.colors.rose'), hex: '#f43f5e' }
    ];

    const handleSave = async () => {
        if (name.trim()) {
            setIsSaving(true);
            try {
                const result = await onSave({ ...category, name: name.trim(), color });
                if (result && result.success) {
                    onClose();
                } else {
                    console.error("Failed to save category:", result);
                    alert(`Error al guardar: ${result?.message || 'Intente nuevamente'}`);
                }
            } catch (error) {
                console.error("Error saving category:", error);
                alert("Error inesperado al guardar.");
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-slate-800 shadow-2xl my-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-500/10 p-2 rounded-lg">
                            <Palette className="h-5 w-5 text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white">{t('expenses.editCategoryTitle')}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                        disabled={isSaving}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Name Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">{t('expenses.name')}</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={t('expenses.categoryNamePlaceholder')}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:outline-none placeholder:text-slate-600"
                            autoFocus
                            disabled={isSaving}
                        />
                    </div>

                    {/* Color Picker */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-400">{t('expenses.color')}</label>
                        <div className="grid grid-cols-6 gap-2">
                            {COLORS.map((c) => (
                                <button
                                    key={c.name}
                                    type="button"
                                    onClick={() => setColor(c.name)}
                                    disabled={isSaving}
                                    style={{ backgroundColor: c.hex }}
                                    className={`h-10 rounded-lg transition-all ${color === c.name
                                        ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110'
                                        : 'hover:scale-105 opacity-70 hover:opacity-100'
                                        } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title={c.label}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                        <p className="text-xs text-slate-400 mb-2">{t('expenses.preview')}</p>
                        <div className="flex items-center gap-3">
                            <div
                                className="w-3 h-10 rounded-full"
                                style={{ backgroundColor: COLORS.find(c => c.name === color)?.hex || '#64748b' }}
                            ></div>
                            <span className="text-white font-semibold">{name || t('expenses.newCategory')}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!name.trim() || isSaving}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <Save className="h-5 w-5" />
                        )}
                        {isSaving ? 'Guardando...' : t('common.save')}
                    </button>
                </div>
            </div>
        </div>
    );
}
