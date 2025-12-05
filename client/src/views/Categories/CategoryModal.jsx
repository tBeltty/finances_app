import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

export default function CategoryModal({
    categories,
    onClose,
    onAddCategory,
    onDeleteCategory
}) {
    const [newCategoryName, setNewCategoryName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;
        onAddCategory(newCategoryName);
        setNewCategoryName('');
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface-container rounded-2xl shadow-2xl w-full max-w-md border border-outline overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-outline flex justify-between items-center bg-surface-container">
                    <h3 className="font-bold text-lg text-main">Gestionar Categorías</h3>
                    <button onClick={onClose} className="text-secondary hover:text-main transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Lista de Categorías */}
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {categories.map(cat => (
                            <div key={cat.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl border border-outline/50 group hover:border-slate-600 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full bg-${cat.color}-500 shadow-[0_0_8px] shadow-${cat.color}-500/50`}></div>
                                    <span className="font-medium text-main">{cat.name}</span>
                                </div>
                                <button
                                    onClick={() => onDeleteCategory(cat.id)}
                                    className="text-slate-500 hover:text-error p-1.5 hover:bg-error/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    title="Eliminar"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Formulario Nueva Categoría */}
                    <form onSubmit={handleSubmit} className="pt-4 border-t border-outline">
                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Nueva Categoría</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="Nombre de la categoría..."
                                className="flex-1 bg-surface-container border border-slate-600 rounded-xl px-4 py-2 text-main placeholder:text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-indigo-500 transition-all"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={!newCategoryName.trim()}
                                className="bg-primary hover:bg-primary-container text-main p-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
