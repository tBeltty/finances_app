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
        <div className="bg-surface-container backdrop-blur-xl p-6 rounded-2xl border border-outline mb-8 relative z-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Month Navigation & Title */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => changeMonth(-1)}
                        className="p-2 hover:bg-surface rounded-lg transition-colors text-on-surface-variant hover:text-on-surface"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    {filterMode === 'month' ? (
                        <h2 className="text-xl font-bold text-on-surface min-w-[200px] text-center">
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
                        className="p-2 hover:bg-surface rounded-lg transition-colors text-on-surface-variant hover:text-on-surface"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Controls Group */}
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Filter Mode Toggle */}
                    <div className="flex bg-surface rounded-lg p-1">
                        <button
                            onClick={() => setFilterMode('month')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filterMode === 'month'
                                ? 'bg-primary text-on-primary'
                                : 'text-on-surface-variant hover:text-on-surface'
                                }`}
                        >
                            {t('dashboard.month')}
                        </button>
                        <button
                            onClick={() => setFilterMode('day')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filterMode === 'day'
                                ? 'bg-primary text-on-primary'
                                : 'text-on-surface-variant hover:text-on-surface'
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
                            className="flex items-center gap-2 px-4 py-2 bg-surface-container hover:bg-surface text-on-surface border border-outline rounded-lg transition-colors text-sm font-medium"
                        >
                            <ArrowDownUp className="w-4 h-4" />
                            {sortMode === 'date' ? t('dashboard.sort.date') : sortMode === 'amount_desc' ? t('dashboard.sort.amountDesc') : t('dashboard.sort.amountAsc')}
                        </button>

                        {sortOpen && (
                            <div
                                className="absolute right-0 mt-2 w-48 bg-surface-container border border-outline rounded-xl shadow-xl overflow-hidden z-50"
                                onMouseEnter={handleMouseEnter}
                            >
                                <button onClick={() => { setSortMode('date'); setSortOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-surface ${sortMode === 'date' ? 'text-primary font-medium' : 'text-on-surface-variant'}`}>
                                    {t('dashboard.sort.default')}
                                </button>
                                <button onClick={() => { setSortMode('amount_desc'); setSortOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-surface ${sortMode === 'amount_desc' ? 'text-primary font-medium' : 'text-on-surface-variant'}`}>
                                    {t('dashboard.sort.amountDesc')}
                                </button>
                                <button onClick={() => { setSortMode('amount_asc'); setSortOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-surface ${sortMode === 'amount_asc' ? 'text-primary font-medium' : 'text-on-surface-variant'}`}>
                                    {t('dashboard.sort.amountAsc')}
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleRollover}
                        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-container text-on-primary rounded-lg transition-colors text-sm font-medium"
                    >
                        <RefreshCw className="w-4 h-4" />
                        {t('dashboard.importFixed')}
                    </button>

                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-success hover:opacity-80 text-main rounded-lg transition-colors text-sm font-medium"
                    >
                        <Download className="w-4 h-4" />
                        {t('dashboard.export')}
                    </button>
                </div>
            </div>
        </div>
    );
}
