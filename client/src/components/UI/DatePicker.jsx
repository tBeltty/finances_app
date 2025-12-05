import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export default function DatePicker({ value, onChange, className = '' }) {
    const { t, i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());
    const containerRef = useRef(null);

    useEffect(() => {
        if (value) {
            setViewDate(new Date(value));
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const daysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const firstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const handleDayClick = (day) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        // Adjust for timezone offset to ensure YYYY-MM-DD matches local date
        const offset = newDate.getTimezoneOffset();
        const localDate = new Date(newDate.getTime() - (offset * 60 * 1000));
        onChange(localDate.toISOString().split('T')[0]);
        setIsOpen(false);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return t('components.selectDate');
        const [y, m, d] = dateStr.split('-');
        return new Date(y, m - 1, d).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const monthName = viewDate.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' });
    const days = Array.from({ length: daysInMonth(viewDate) }, (_, i) => i + 1);
    const startDay = firstDayOfMonth(viewDate); // 0 = Sunday

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 w-full bg-surface border border-outline rounded-xl px-4 py-3 text-main cursor-pointer hover:border-primary transition-colors"
            >
                <CalendarIcon className="h-5 w-5 text-secondary" />
                <span className="text-sm font-medium">{formatDate(value)}</span>
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-surface-container border border-outline rounded-xl shadow-2xl z-50 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={handlePrevMonth} className="p-1 text-secondary hover:text-main hover:bg-surface-container rounded">
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <span className="text-main font-bold capitalize">{monthName}</span>
                        <button onClick={handleNextMonth} className="p-1 text-secondary hover:text-main hover:bg-surface-container rounded">
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                        {(t('common.daysShort', { returnObjects: true }) || []).map(d => (
                            <div key={d} className="text-xs font-medium text-slate-500">{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: startDay }).map((_, i) => (
                            <div key={`empty-${i}`} />
                        ))}
                        {days.map(day => {
                            const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const isSelected = value === dateStr;
                            const isToday = dateStr === new Date().toISOString().split('T')[0];

                            return (
                                <button
                                    key={day}
                                    onClick={() => handleDayClick(day)}
                                    className={`
                                        h-8 w-8 rounded-lg text-sm font-medium flex items-center justify-center transition-colors
                                        ${isSelected ? 'bg-primary text-main' : 'text-main hover:bg-surface-container'}
                                        ${isToday && !isSelected ? 'border border-primary/50 text-primary' : ''}
                                    `}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
