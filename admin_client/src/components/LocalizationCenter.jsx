import React, { useState, useEffect } from 'react';
import { Globe, Save, Search, RefreshCw, Check, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import Swal from 'sweetalert2';

export default function LocalizationCenter() {
    const [translations, setTranslations] = useState([]); // List of { key, en, es }
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('all'); // all, missing-es
    const [search, setSearch] = useState('');

    // Mock data loader - In production this would sync keys dynamically
    // For now, we will just manage what's in DB or allow adding new keys.
    // A better approach for the MVP is: 
    // 1. Fetch EN translations (from file or DB?) -> DB is empty initially.
    // 2. Ideally, we need a "Seed" button to populate DB from JSONs if empty.

    // Simplification for User: manual key entry or basic list management.
    // Let's implement a simple "Key Manager" where they can add keys and values.

    const [keyList, setKeyList] = useState([]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            // In a real scenario, we'd fetch all keys. 
            // Here we might just fetch what we have stored.
            const enRes = await api.get('/translations/en/translation');
            const esRes = await api.get('/translations/es/translation');

            const enData = enRes.data || {};
            const esData = esRes.data || {};

            const keys = new Set([...Object.keys(enData), ...Object.keys(esData)]);
            const list = Array.from(keys).map(key => ({
                key,
                en: enData[key] || '',
                es: esData[key] || ''
            }));
            setKeyList(list);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const handleSave = async (lang, key, value) => {
        try {
            await api.post('/translations', { lang, key, value, namespace: 'translation' });
            // Optimistic update
            setKeyList(prev => prev.map(item => item.key === key ? { ...item, [lang]: value } : item));

            const toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 1500,
                timerProgressBar: true,
                background: '#1e293b',
                color: '#fff'
            });
            toast.fire({ icon: 'success', title: 'Saved' });

        } catch (err) {
            Swal.fire('Error', 'Failed to save translation', 'error');
        }
    };

    const [categoryFilter, setCategoryFilter] = useState('all');
    const [page, setPage] = useState(1);
    const itemsPerPage = 50;

    // Helper: Extract unique categories (e.g., 'nav' from 'nav.home')
    const categories = Array.from(new Set(keyList.map(item => item.key.split('.')[0]))).sort();

    const filteredList = keyList.filter(item => {
        const matchesSearch = item.key.toLowerCase().includes(search.toLowerCase()) ||
            item.en.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'missing-es' ? !item.es : true;

        let matchesCategory = true;
        if (categoryFilter !== 'all') {
            matchesCategory = item.key.startsWith(categoryFilter + '.');
        }

        return matchesSearch && matchesFilter && matchesCategory;
    });

    const totalPages = Math.ceil(filteredList.length / itemsPerPage);
    const paginatedList = filteredList.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    // Reset page on filter change
    useEffect(() => { setPage(1); }, [search, filter, categoryFilter]);

    const completion = keyList.length > 0
        ? Math.round((keyList.filter(i => i.es).length / keyList.length) * 100)
        : 0;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-xl flex items-center gap-4">
                    <div className="p-3 bg-primary/20 rounded-full text-primary"><Globe size={24} /></div>
                    <div>
                        <div className="text-secondary text-sm font-bold uppercase">Spanish Coverage</div>
                        <div className="text-3xl font-bold text-main">{completion}%</div>
                    </div>
                </div>
                <div className="glass-panel p-6 rounded-xl flex items-center gap-4">
                    <div className="p-3 bg-success/20 rounded-full text-success"><Check size={24} /></div>
                    <div>
                        <div className="text-secondary text-sm font-bold uppercase">Total Strings</div>
                        <div className="text-3xl font-bold text-main">{keyList.length}</div>
                    </div>
                </div>
            </div>

            <div className="glass-panel p-6 rounded-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h3 className="text-lg font-bold text-main flex items-center gap-2">
                        <RefreshCw size={18} className="cursor-pointer hover:rotate-180 transition-all" onClick={fetchAll} />
                        Localization Editor
                    </h3>
                    <div className="flex flex-wrap gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:flex-none">
                            <Search className="absolute left-3 top-2.5 text-secondary" size={16} />
                            <input
                                type="text"
                                placeholder="Search keys..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full md:w-64 bg-surface border border-outline/20 rounded-lg pl-10 pr-4 py-2 text-sm text-main focus:ring-2 focus:ring-primary outline-none"
                            />
                        </div>
                        <select
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
                            className="bg-surface border border-outline/20 rounded-lg px-4 py-2 text-sm text-main focus:ring-2 focus:ring-primary outline-none"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                            ))}
                        </select>
                        <select
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            className="bg-surface border border-outline/20 rounded-lg px-4 py-2 text-sm text-main focus:ring-2 focus:ring-primary outline-none"
                        >
                            <option value="all">All Status</option>
                            <option value="missing-es">Missing Spanish</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-outline/20">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-surface-container/50">
                            <tr>
                                <th className="p-4 table-header w-1/4">Key</th>
                                <th className="p-4 table-header w-1/3">English (Ref)</th>
                                <th className="p-4 table-header w-1/3">Spanish (Target)</th>
                                <th className="p-4 table-header w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline/10">
                            {paginatedList.map((item) => (
                                <tr key={item.key} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-mono text-xs text-secondary break-all">{item.key}</td>
                                    <td className="p-4 text-sm text-main">{item.en}</td>
                                    <td className="p-4">
                                        <textarea
                                            defaultValue={item.es}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    e.target.blur();
                                                }
                                            }}
                                            onBlur={(e) => {
                                                if (e.target.value !== item.es) handleSave('es', item.key, e.target.value);
                                            }}
                                            className="w-full bg-surface-container border border-outline/20 rounded px-3 py-2 text-sm text-main focus:ring-1 focus:ring-primary outline-none resize-y min-h-[40px]"
                                            rows={1}
                                        />
                                    </td>
                                    <td className="p-4 text-center">
                                        {item.es && <Check size={16} className="text-success inline" />}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="mt-4 flex justify-between items-center text-xs text-secondary">
                    <div>
                        Showing {Math.min((page - 1) * itemsPerPage + 1, filteredList.length)} - {Math.min(page * itemsPerPage, filteredList.length)} of {filteredList.length}
                    </div>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-3 py-1 rounded bg-surface-container border border-outline/20 disabled:opacity-50 hover:bg-surface-container-high transition-colors"
                        >
                            Previous
                        </button>
                        <span className="self-center">Page {page} of {totalPages || 1}</span>
                        <button
                            disabled={page === totalPages || totalPages === 0}
                            onClick={() => setPage(p => p + 1)}
                            className="px-3 py-1 rounded bg-surface-container border border-outline/20 disabled:opacity-50 hover:bg-surface-container-high transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
