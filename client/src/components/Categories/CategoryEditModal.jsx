import React, { useState } from 'react';
import { X, Save, Palette } from 'lucide-react';

const COLORS = [
    { name: 'slate', label: 'Gris', hex: '#64748b' },
    { name: 'red', label: 'Rojo', hex: '#ef4444' },
    { name: 'orange', label: 'Naranja', hex: '#f97316' },
    { name: 'amber', label: 'Ámbar', hex: '#f59e0b' },
    { name: 'yellow', label: 'Amarillo', hex: '#eab308' },
    { name: 'lime', label: 'Lima', hex: '#84cc16' },
    { name: 'green', label: 'Verde', hex: '#22c55e' },
    { name: 'emerald', label: 'Esmeralda', hex: '#10b981' },
    { name: 'teal', label: 'Verde azulado', hex: '#14b8a6' },
    { name: 'cyan', label: 'Cian', hex: '#06b6d4' },
    { name: 'sky', label: 'Cielo', hex: '#0ea5e9' },
    { name: 'blue', label: 'Azul', hex: '#3b82f6' },
    { name: 'indigo', label: 'Índigo', hex: '#6366f1' },
    { name: 'violet', label: 'Violeta', hex: '#8b5cf6' },
    { name: 'purple', label: 'Púrpura', hex: '#a855f7' },
    { name: 'fuchsia', label: 'Fucsia', hex: '#d946ef' },
    { name: 'pink', label: 'Rosa', hex: '#ec4899' },
    { name: 'rose', label: 'Rosa oscuro', hex: '#f43f5e' }
];

export default function CategoryEditModal({ category, onClose, onSave }) {
    const [name, setName] = useState(category.name);
    const [color, setColor] = useState(category.color || 'slate');

    const handleSave = () => {
        if (name.trim()) {
            onSave({ ...category, name: name.trim(), color });
            onClose();
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-slate-800 shadow-2xl">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-500/10 p-2 rounded-lg">
                            <Palette className="h-5 w-5 text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Editar Categoría</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Name Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Nombre</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ej: Vivienda, Transporte..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:outline-none placeholder:text-slate-600"
                            autoFocus
                        />
                    </div>

                    {/* Color Picker */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-400">Color</label>
                        <div className="grid grid-cols-6 gap-2">
                            {COLORS.map((c) => (
                                <button
                                    key={c.name}
                                    type="button"
                                    onClick={() => setColor(c.name)}
                                    style={{ backgroundColor: c.hex }}
                                    className={`h-10 rounded-lg transition-all ${color === c.name
                                        ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110'
                                        : 'hover:scale-105 opacity-70 hover:opacity-100'
                                        }`}
                                    title={c.label}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                        <p className="text-xs text-slate-400 mb-2">Vista previa:</p>
                        <div className="flex items-center gap-3">
                            <div
                                className="w-3 h-10 rounded-full"
                                style={{ backgroundColor: COLORS.find(c => c.name === color)?.hex || '#64748b' }}
                            ></div>
                            <span className="text-white font-semibold">{name || 'Nueva Categoría'}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!name.trim()}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="h-5 w-5" />
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
}
