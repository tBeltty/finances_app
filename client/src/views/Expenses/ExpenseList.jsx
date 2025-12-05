import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, X, CheckCircle2, Edit3, DollarSign, Trash2, Edit2, ArrowRight, ChevronDown } from 'lucide-react';
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
    currency,
    categories = []
}) {
    const { t } = useTranslation();
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

    const renderCategoryGroup = (group, groupIndex) => (
        <div key={group.id} className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border overflow-hidden hover:border-secondary/50 transition-colors h-fit">
            {/* Header de Categoría */}
            <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/80">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className={`w-3 h-10 rounded-full flex-shrink-0 bg-${group.color || 'slate'}-500`}></div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-1">
                            <h3 className="font-bold text-main text-base leading-tight break-words">{group.name}</h3>
                            <button
                                onClick={() => setEditingCategory(group)}
                                className="p-2 hover:bg-main rounded text-secondary hover:text-primary transition-colors flex-shrink-0"
                                title={t('expenses.editCategory')}
                            >
                                <Edit2 size={16} />
                            </button>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-secondary flex-wrap">
                            <span className="bg-main/50 px-2 py-0.5 rounded text-secondary whitespace-nowrap">{t('expenses.itemsCount', { count: group.items.length })}</span>
                            {group.items.every(i => i.paid >= i.amount) && group.items.length > 0 && <span className="text-success flex items-center gap-1 whitespace-nowrap"><CheckCircle2 size={12} /> {t('expenses.paid')}</span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pl-6 sm:pl-0">
                    <div className="text-right">
                        <p className="text-xs text-secondary uppercase font-bold tracking-wider">{t('expenses.total')}</p>
                        <p className="font-bold text-main text-lg">{formatCurrency(group.items.reduce((s, i) => s + i.amount, 0))}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {group.items.some(i => i.paid < i.amount) && (
                            <button
                                onClick={() => handlePayCategory(group.id)}
                                className="p-2 hover:bg-success/10 text-secondary hover:text-success rounded-lg transition-colors"
                                title={t('expenses.payCategory')}
                            >
                                <CheckCircle2 size={20} />
                            </button>
                        )}
                        <div className="relative">
                            <button
                                onClick={() => handleDeleteClick(group.id)}
                                className="p-2 hover:bg-error/10 text-secondary hover:text-error rounded-lg transition-colors"
                                title={t('expenses.deleteCategory')}
                            >
                                <Trash2 size={20} />
                            </button>
                            {errorCatId === group.id && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-rose-500 text-main text-xs font-bold p-2 rounded-lg shadow-xl z-50 text-center animate-in fade-in slide-in-from-top-2">
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
                    <tbody className="text-sm divide-y divide-border/50">
                        {group.items.map((expense, expenseIndex) => {
                            const isEditing = editingExpenseId === expense.id;
                            const isFullyPaid = expense.paid >= expense.amount;

                            return (
                                <tr key={expense.id} className={`group hover:bg-main/30 transition-colors ${isEditing ? 'bg-primary/10' : ''} relative`}>
                                    {/* Columna Nombre */}
                                    <td className="p-4 w-1/3 min-w-[200px]">
                                        {isEditing ? (
                                            <div className="flex flex-col gap-2">
                                                <input
                                                    type="text"
                                                    value={editForm.name || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                    className="w-full border-b border-primary bg-transparent focus:outline-none font-semibold text-main py-1"
                                                    autoFocus
                                                    placeholder={t('expenses.name')}
                                                />
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{t('expenses.category')}</label>
                                                    <div className="relative">
                                                        <select
                                                            value={editForm.categoryId || group.id}
                                                            onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                                                            className="w-full appearance-none bg-card border border-border rounded-lg pl-3 pr-8 py-2 text-sm text-main focus:border-primary focus:outline-none cursor-pointer hover:bg-main transition-colors shadow-sm"
                                                        >
                                                            {categories.map(cat => (
                                                                <option key={cat.id} value={cat.id} className="bg-card text-main">
                                                                    {cat.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-secondary z-10">
                                                            <ChevronDown size={14} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                onClick={() => startEditing(expense)}
                                                className="cursor-pointer"
                                                title={t('expenses.clickEditName')}
                                            >
                                                <div className="font-semibold text-main flex items-center gap-2">
                                                    {expense.name}
                                                    <Edit3 size={12} className="opacity-0 group-hover:opacity-100 text-secondary" />
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleExpenseType(expense.id);
                                                    }}
                                                    className="text-[10px] text-secondary mt-0.5 uppercase tracking-wide hover:text-primary transition-colors cursor-pointer"
                                                    title={t('expenses.clickChangeType')}
                                                >
                                                    {expense.type} ↻
                                                </button>
                                            </div>
                                        )}
                                    </td>

                                    {/* Columna Fecha */}
                                    <td className="p-4 w-32 text-secondary text-xs whitespace-nowrap">
                                        {isEditing ? (
                                            <input
                                                type="date"
                                                value={editForm.date || ''}
                                                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                                className="w-full bg-main/50 border border-primary rounded px-2 py-1 text-main text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                            />
                                        ) : (
                                            <div
                                                onClick={() => startEditing(expense)}
                                                className="cursor-pointer hover:text-primary transition-colors"
                                                title={t('expenses.clickEditDate')}
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
                                                className="w-full text-right border-b border-primary bg-transparent focus:outline-none font-mono text-main font-medium"
                                            />
                                        ) : (
                                            <div
                                                onClick={() => startEditing(expense)}
                                                className="font-mono text-main font-medium cursor-pointer"
                                                title={t('expenses.clickEditAmount')}
                                            >
                                                {formatCurrency(expense.amount)}
                                            </div>
                                        )}
                                    </td>

                                    {/* Columna Input Pago */}
                                    <td className="p-4 w-1/4">
                                        <div className={`flex items-center gap-2 bg-main/50 border rounded-lg px-3 py-1.5 transition-all focus-within:ring-2 focus-within:ring-primary focus-within:border-primary ${isFullyPaid ? 'border-emerald-500/30 bg-success/10' : 'border-border'}`}>
                                            <span className="text-secondary text-xs">$</span>
                                            <input
                                                type="number"
                                                value={expense.paid === 0 ? '' : expense.paid}
                                                placeholder="0"
                                                onChange={(e) => handleUpdatePayment(expense.id, e.target.value)}
                                                className={`w-full bg-transparent text-right outline-none text-main font-medium placeholder:text-secondary ${isFullyPaid ? 'text-success font-bold' : ''}`}
                                            />
                                        </div>
                                    </td>

                                    {/* Columna Acciones */}
                                    <td className="p-4 text-right w-24">
                                        {isEditing ? (
                                            <div className="flex justify-end gap-1">
                                                <button onClick={saveEditing} className="p-1.5 bg-primary/20 text-primary rounded hover:bg-primary/30"><Save size={16} /></button>
                                                <button onClick={cancelEditing} className="p-1.5 text-secondary hover:text-main"><X size={16} /></button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                {!isFullyPaid ? (
                                                    <button
                                                        onClick={() => handlePayFull(expense.id)}
                                                        title={t('expenses.payFull')}
                                                        className="p-2 text-success hover:bg-success/10 rounded-lg transition-colors"
                                                    >
                                                        <DollarSign size={18} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleMarkUnpaid(expense.id)}
                                                        title={t('expenses.markUnpaid')}
                                                        className="p-2 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteExpense(expense.id)}
                                                    title={t('expenses.delete')}
                                                    className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors"
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
                            <tr><td colSpan="4" className="p-4 text-center text-secondary text-sm italic">{t('expenses.noExpenses')}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div >
    );

    const leftColumn = (groupedExpenses || []).filter((_, i) => i % 2 === 0);
    const rightColumn = (groupedExpenses || []).filter((_, i) => i % 2 !== 0);

    return (
        <div className="w-full">
            {/* Mobile View (Single Column) */}
            <div className="lg:hidden space-y-6">
                {(groupedExpenses || []).map((group, i) => renderCategoryGroup(group, i))}
            </div>

            {/* Desktop View (Masonry - 2 Columns) */}
            <div className="hidden lg:flex gap-6 items-start">
                <div className="w-1/2 space-y-6">
                    {leftColumn.map((group, i) => renderCategoryGroup(group, i * 2))}
                </div>
                <div className="w-1/2 space-y-6">
                    {rightColumn.map((group, i) => renderCategoryGroup(group, i * 2 + 1))}
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
