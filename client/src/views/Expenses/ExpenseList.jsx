import React, { useState } from 'react';
import { Save, X, CheckCircle2, Edit3, DollarSign, Trash2, Edit2 } from 'lucide-react';
import CategoryEditModal from '../../components/Categories/CategoryEditModal';

export default function ExpenseList({
    groupedExpenses,
    handlePayCategory,
    handleUpdatePayment,
    handlePayFull,
    handleDeleteExpense,
    handleDeleteCategory,
    updateExpense,
    handleToggleExpenseType,
    handleMarkUnpaid,
    handleEditCategory,
    formatCurrency,
    currency
}) {
    const [editingExpenseId, setEditingExpenseId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [editingCategory, setEditingCategory] = useState(null);

    const startEditing = (expense) => {
        setEditingExpenseId(expense.id);
        setEditForm({ ...expense });
    };

    const saveEditing = () => {
        updateExpense({ ...editForm, amount: parseFloat(editForm.amount) || 0 });
        setEditingExpenseId(null);
    };

    const cancelEditing = () => {
        setEditingExpenseId(null);
        setEditForm({});
    };

    const [errorMsg, setErrorMsg] = useState(null);
    const [errorCatId, setErrorCatId] = useState(null);

    const handleDeleteClick = async (catId) => {
        const result = await handleDeleteCategory(catId);
        if (!result.success) {
            setErrorCatId(catId);
            setErrorMsg(result.message);
            setTimeout(() => {
                setErrorCatId(null);
                setErrorMsg(null);
            }, 3000);
        }
    };

    const renderCategoryGroup = (group) => (
        <div key={group.id} className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 overflow-hidden hover:border-slate-600 transition-colors h-fit">
            {/* Header de Categoría */}
            <div className="p-4 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/80">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className={`w-3 h-10 rounded-full flex-shrink-0 bg-${group.color || 'slate'}-500`}></div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-1">
                            <h3 className="font-bold text-slate-200 text-base leading-tight break-words">{group.name}</h3>
                            <button
                                onClick={() => setEditingCategory(group)}
                                className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-indigo-400 transition-colors flex-shrink-0"
                                title="Editar categoría"
                            >
                                <Edit2 size={16} />
                            </button>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 flex-wrap">
                            <span className="bg-slate-700/50 px-2 py-0.5 rounded text-slate-300 whitespace-nowrap">{group.items.length} gastos</span>
                            {group.items.every(i => i.paid >= i.amount) && group.items.length > 0 && <span className="text-emerald-400 flex items-center gap-1 whitespace-nowrap"><CheckCircle2 size={12} /> Pagado</span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pl-6 sm:pl-0">
                    <div className="text-right">
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total</p>
                        <p className="font-bold text-slate-200 text-lg">{formatCurrency(group.items.reduce((s, i) => s + i.amount, 0))}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {group.items.some(i => i.paid < i.amount) && (
                            <button
                                onClick={() => handlePayCategory(group.id)}
                                className="p-2 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 rounded-lg transition-colors"
                                title="Pagar toda la categoría"
                            >
                                <CheckCircle2 size={20} />
                            </button>
                        )}
                        <div className="relative">
                            <button
                                onClick={() => handleDeleteClick(group.id)}
                                className="p-2 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                                title="Eliminar categoría"
                            >
                                <Trash2 size={20} />
                            </button>
                            {errorCatId === group.id && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-rose-500 text-white text-xs font-bold p-2 rounded-lg shadow-xl z-50 text-center animate-in fade-in slide-in-from-top-2">
                                    {errorMsg}
                                    <div className="absolute -top-1 right-3 w-2 h-2 bg-rose-500 rotate-45"></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabla de Items */}
            <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                    <tbody className="text-sm divide-y divide-slate-700/50">
                        {group.items.map((expense) => {
                            const isEditing = editingExpenseId === expense.id;
                            const isFullyPaid = expense.paid >= expense.amount;

                            return (
                                <tr key={expense.id} className={`group hover:bg-slate-700/30 transition-colors ${isEditing ? 'bg-indigo-500/10' : ''}`}>
                                    {/* Columna Nombre */}
                                    <td className="p-4 w-1/3">
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editForm.name || ''}
                                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                className="w-full border-b border-indigo-500 bg-transparent focus:outline-none font-semibold text-slate-200"
                                                autoFocus
                                            />
                                        ) : (
                                            <div
                                                onClick={() => startEditing(expense)}
                                                className="cursor-pointer"
                                                title="Clic para editar nombre"
                                            >
                                                <div className="font-semibold text-slate-200 flex items-center gap-2">
                                                    {expense.name}
                                                    <Edit3 size={12} className="opacity-0 group-hover:opacity-100 text-slate-400" />
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleExpenseType(expense.id);
                                                    }}
                                                    className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wide hover:text-indigo-400 transition-colors cursor-pointer"
                                                    title="Clic para cambiar tipo"
                                                >
                                                    {expense.type} ↻
                                                </button>
                                            </div>
                                        )}
                                    </td>

                                    {/* Columna Fecha */}
                                    <td className="p-4 w-32 text-slate-400 text-xs whitespace-nowrap">
                                        {isEditing ? (
                                            <input
                                                type="date"
                                                value={editForm.date || ''}
                                                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                                className="w-full bg-slate-900/50 border border-indigo-500 rounded px-2 py-1 text-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            />
                                        ) : (
                                            <div
                                                onClick={() => startEditing(expense)}
                                                className="cursor-pointer hover:text-indigo-400 transition-colors"
                                                title="Clic para editar fecha"
                                            >
                                                {expense.date ? (() => {
                                                    const [year, month, day] = expense.date.split('-');
                                                    return `${day}/${month}/${year.slice(-2)}`;
                                                })() : '-'}
                                            </div>
                                        )}
                                    </td>

                                    {/* Columna Valor Presupuestado */}
                                    <td className="p-4 text-right w-1/4">
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                value={editForm.amount || ''}
                                                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                                                className="w-full text-right border-b border-indigo-500 bg-transparent focus:outline-none font-mono text-slate-300 font-medium"
                                            />
                                        ) : (
                                            <div
                                                onClick={() => startEditing(expense)}
                                                className="font-mono text-slate-300 font-medium cursor-pointer"
                                                title="Clic para editar valor"
                                            >
                                                {formatCurrency(expense.amount)}
                                            </div>
                                        )}
                                    </td>

                                    {/* Columna Input Pago */}
                                    <td className="p-4 w-1/4">
                                        <div className={`flex items-center gap-2 bg-slate-900/50 border rounded-lg px-3 py-1.5 transition-all focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 ${isFullyPaid ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-slate-600'}`}>
                                            <span className="text-slate-500 text-xs">$</span>
                                            <input
                                                type="number"
                                                value={expense.paid === 0 ? '' : expense.paid}
                                                placeholder="0"
                                                onChange={(e) => handleUpdatePayment(expense.id, e.target.value)}
                                                className={`w-full bg-transparent text-right outline-none text-slate-200 font-medium placeholder:text-slate-600 ${isFullyPaid ? 'text-emerald-400 font-bold' : ''}`}
                                            />
                                        </div>
                                    </td>

                                    {/* Columna Acciones */}
                                    <td className="p-4 text-right w-24">
                                        {isEditing ? (
                                            <div className="flex justify-end gap-1">
                                                <button onClick={saveEditing} className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded hover:bg-indigo-500/30"><Save size={16} /></button>
                                                <button onClick={cancelEditing} className="p-1.5 text-slate-400 hover:text-slate-200"><X size={16} /></button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                {!isFullyPaid ? (
                                                    <button
                                                        onClick={() => handlePayFull(expense.id)}
                                                        title="Pagar Total"
                                                        className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                                    >
                                                        <DollarSign size={18} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleMarkUnpaid(expense.id)}
                                                        title="Marcar como no pagado"
                                                        className="p-2 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteExpense(expense.id)}
                                                    title="Eliminar"
                                                    className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {group.items.length === 0 && (
                            <tr><td colSpan="4" className="p-4 text-center text-slate-500 text-sm italic">Sin gastos en esta categoría</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const leftColumn = (groupedExpenses || []).filter((_, i) => i % 2 === 0);
    const rightColumn = (groupedExpenses || []).filter((_, i) => i % 2 !== 0);

    return (
        <div className="w-full">
            {/* Mobile View (Single Column) */}
            <div className="lg:hidden space-y-6">
                {(groupedExpenses || []).map(renderCategoryGroup)}
            </div>

            {/* Desktop View (Masonry - 2 Columns) */}
            <div className="hidden lg:flex gap-6 items-start">
                <div className="w-1/2 space-y-6">
                    {leftColumn.map(renderCategoryGroup)}
                </div>
                <div className="w-1/2 space-y-6">
                    {rightColumn.map(renderCategoryGroup)}
                </div>
            </div>

            {editingCategory && (
                <CategoryEditModal
                    category={editingCategory}
                    onClose={() => setEditingCategory(null)}
                    onSave={handleEditCategory}
                />
            )}
        </div>
    );
}
