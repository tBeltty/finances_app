import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Download, RefreshCw, Settings, ArrowDownUp } from 'lucide-react';
import DatePicker from '../../components/UI/DatePicker';

export default function Controls({
    selectedMonth,
    setSelectedMonth,
    handleRollover,
    handleExport,
    filterMode,
    setFilterMode,
    selectedDate,
    setSelectedDate,
    onOpenSettings,
    sortMode,
    setSortMode
}) {
    const { t, i18n } = useTranslation();
    const [sortOpen, setSortOpen] = React.useState(false);
    const timeoutRef = React.useRef(null);

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setSortOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setSortOpen(false);
        }, 300);
    };

    const changeMonth = (delta) => {
        const [month, year] = selectedMonth.split('-').map(Number);
        const date = new Date(year, month - 1 + delta, 1);
        const newMonth = String(date.getMonth() + 1).padStart(2, '0');
        const newYear = date.getFullYear();
        setSelectedMonth(`${newMonth}-${newYear}`);
    };

    const handleDateChange = (dateStr) => {
        setSelectedDate(dateStr);
        const [y, m] = dateStr.split('-');
        setSelectedMonth(`${m}-${y}`);
    };

    // Construct display text
    const [m, y] = selectedMonth.split('-');
    const monthDate = new Date(y, m - 1, 1);
    const monthName = monthDate.toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US', { month: 'long', year: 'numeric' });
    const monthNameCapitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    return (
        <div className="bg-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-800 mb-8 relative z-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Month Navigation & Title */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => changeMonth(-1)}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    {filterMode === 'month' ? (
                        <h2 className="text-xl font-bold text-white min-w-[200px] text-center">
                            {monthNameCapitalized}
                        </h2>
                    ) : (
                        <DatePicker
                            value={selectedDate}
                            onChange={handleDateChange}
                        />
                    )}

                    <button
                        onClick={() => changeMonth(1)}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Controls Group */}
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Filter Mode Toggle */}
                    <div className="flex bg-slate-800 rounded-lg p-1">
                        <button
                            onClick={() => setFilterMode('month')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filterMode === 'month'
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            {t('dashboard.month')}
                        </button>
                        <button
                            onClick={() => setFilterMode('day')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filterMode === 'day'
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            {t('dashboard.day')}
                        </button>
                    </div>

                    {/* Sort Dropdown */}
                    <div
                        className="relative"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <button
                            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            <ArrowDownUp className="w-4 h-4" />
                            {sortMode === 'date' ? t('dashboard.sort.date') : sortMode === 'amount_desc' ? t('dashboard.sort.amountDesc') : t('dashboard.sort.amountAsc')}
                        </button>

                        {sortOpen && (
                            <div
                                className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50"
                                onMouseEnter={handleMouseEnter}
                            >
                                <button onClick={() => { setSortMode('date'); setSortOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 ${sortMode === 'date' ? 'text-indigo-400 font-medium' : 'text-slate-300'}`}>
                                    {t('dashboard.sort.default')}
                                </button>
                                <button onClick={() => { setSortMode('amount_desc'); setSortOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 ${sortMode === 'amount_desc' ? 'text-indigo-400 font-medium' : 'text-slate-300'}`}>
                                    {t('dashboard.sort.amountDesc')}
                                </button>
                                <button onClick={() => { setSortMode('amount_asc'); setSortOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 ${sortMode === 'amount_asc' ? 'text-indigo-400 font-medium' : 'text-slate-300'}`}>
                                    {t('dashboard.sort.amountAsc')}
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleRollover}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                        <RefreshCw className="w-4 h-4" />
                        {t('dashboard.importFixed')}
                    </button>

                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                        <Download className="w-4 h-4" />
                        {t('dashboard.export')}
                    </button>
                </div>
            </div>
        </div>
    );
}
