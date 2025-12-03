import React from 'react';
import { X } from 'lucide-react';
import ExpenseForm from '../../views/Expenses/ExpenseForm';

export default function QuickAddModal({
    isOpen,
    onClose,
    newExpense,
    setNewExpense,
    categories,
    handleAddExpense,
    addTemplateCategories,
    handleAddCategory,
    currency
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors z-10"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="p-6">
                    <h2 className="text-xl font-bold text-white mb-6">Agregar Gasto Rápido</h2>
                    <ExpenseForm
                        newExpense={newExpense}
                        setNewExpense={setNewExpense}
                        categories={categories}
                        handleAddExpense={(e) => {
                            handleAddExpense(e);
                            onClose(); // Close modal after adding
                        }}
                        addTemplateCategories={addTemplateCategories}
                        handleAddCategory={handleAddCategory}
                        currency={currency}
                    />
                </div>
            </div>
        </div>
    );
}
