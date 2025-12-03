import React, { useState } from 'react';
import { Plus, ChevronDown, Sparkles, Check, X } from 'lucide-react';
import CustomSelect from '../../components/Inputs/CustomSelect';

export default function ExpenseForm({
    newExpense,
    setNewExpense,
    categories,
    handleAddExpense,
    addTemplateCategories,
    handleAddCategory,
    currency
}) {
    const [showQuickCategory, setShowQuickCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState('slate');

    const handleCategoryChange = (value) => {
        if (value === 'NEW') {
            setShowQuickCategory(true);
        } else {
            setNewExpense({ ...newExpense, categoryId: value });
        }
    };

    const saveNewCategory = async () => {
        if (!newCategoryName.trim()) return;
        if (handleAddCategory) {
            const newCat = await handleAddCategory(newCategoryName);
            if (newCat) {
                setNewExpense({ ...newExpense, categoryId: newCat.id });
                setShowQuickCategory(false);
                setNewCategoryName('');
            }
        }
    };

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                    <div className="bg-indigo-500/10 p-1.5 rounded-lg">
                        <Plus className="w-5 h-5 text-indigo-400" />
                    </div>
                    Nuevo Gasto
                </h2>
            </div>

            <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Descripción</label>
                    <input
                        type="text"
                        placeholder="Ej: Mercado, Gasolina..."
                        value={newExpense.name}
                        onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
                        className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-2.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Valor</label>
                    <div className="relative">
                        <input
                            type="number"
                            placeholder="0"
                            value={newExpense.amount}
                            onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                            className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-2.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tipo</label>
                    <div className="relative">
                        <select
                            value={newExpense.type}
                            onChange={(e) => setNewExpense({ ...newExpense, type: e.target.value })}
                            className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-2.5 text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all cursor-pointer"
                        >
                            <option value="Variable">Variable</option>
                            <option value="Fijo">Fijo</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none w-4 h-4" />
                    </div>
                </div>

                <div className="relative">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Categoría</label>

                    {showQuickCategory ? (
                        <div className="absolute top-0 left-0 w-full z-20 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-2 flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                            <input
                                type="text"
                                autoFocus
                                placeholder="Nueva Categoría"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        saveNewCategory();
                                    }
                                }}
                            />
                            <button
                                type="button"
                                onClick={saveNewCategory}
                                className="bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
                            >
                                <Check className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowQuickCategory(false)}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 p-2 rounded-lg transition-colors border border-slate-700"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <CustomSelect
                            value={newExpense.categoryId}
                            onChange={handleCategoryChange}
                            options={[
                                ...(categories || []).map(cat => ({ value: cat.id, label: cat.name })),
                                { value: 'NEW', label: '+ Nueva Categoría', icon: Plus }
                            ]}
                            placeholder="Seleccionar..."
                        />
                    )}
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Fecha</label>
                    <input
                        type="date"
                        value={newExpense.date}
                        onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                        disabled={!newExpense.isPaid}
                        className={`w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all ${!newExpense.isPaid ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                </div>

                <div className="flex items-end gap-2">
                    <label className="flex items-center gap-3 w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-2.5 cursor-pointer hover:bg-slate-800/50 transition-colors">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${newExpense.isPaid ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'}`}>
                            {newExpense.isPaid && <Sparkles className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <input
                            type="checkbox"
                            checked={newExpense.isPaid}
                            onChange={(e) => setNewExpense({ ...newExpense, isPaid: e.target.checked, payWithSavings: false })}
                            className="hidden"
                        />
                        <span className={`text-sm font-medium ${newExpense.isPaid ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {newExpense.isPaid ? 'Pagado' : 'Pendiente'}
                        </span>
                    </label>

                    {newExpense.isPaid && (
                        <label className="flex items-center gap-2 bg-slate-900/50 border border-slate-600 rounded-xl px-3 py-2.5 cursor-pointer hover:bg-slate-800/50 transition-colors" title="Pagar con Ahorros">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${newExpense.payWithSavings ? 'bg-indigo-500 border-indigo-500' : 'border-slate-500'}`}>
                                {newExpense.payWithSavings && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <input
                                type="checkbox"
                                checked={newExpense.payWithSavings || false}
                                onChange={(e) => setNewExpense({ ...newExpense, payWithSavings: e.target.checked })}
                                className="hidden"
                            />
                            <span className={`text-xs font-bold ${newExpense.payWithSavings ? 'text-indigo-400' : 'text-slate-400'}`}>
                                Ahorros
                            </span>
                        </label>
                    )}
                </div>

                <div className="md:col-span-2 lg:col-span-4">
                    <button
                        type="submit"
                        disabled={!newExpense.name || !newExpense.amount}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transform active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Agregar Gasto
                    </button>
                </div>
            </form>
        </div>
    );
}
