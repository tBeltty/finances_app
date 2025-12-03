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
            <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                    <h3 className="font-bold text-lg text-slate-200">Gestionar Categorías</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Lista de Categorías */}
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {categories.map(cat => (
                            <div key={cat.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl border border-slate-700/50 group hover:border-slate-600 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full bg-${cat.color}-500 shadow-[0_0_8px] shadow-${cat.color}-500/50`}></div>
                                    <span className="font-medium text-slate-300">{cat.name}</span>
                                </div>
                                <button
                                    onClick={() => onDeleteCategory(cat.id)}
                                    className="text-slate-500 hover:text-rose-400 p-1.5 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    title="Eliminar"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Formulario Nueva Categoría */}
                    <form onSubmit={handleSubmit} className="pt-4 border-t border-slate-700">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nueva Categoría</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="Nombre de la categoría..."
                                className="flex-1 bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={!newCategoryName.trim()}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
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
