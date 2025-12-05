import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp, DollarSign, Calendar } from 'lucide-react';

export default function AnalyticsView({ expenses, categories, currency, formatCurrency }) {
    const { t } = useTranslation();

    // 1. Expenses by Category (Donut)
    const categoryData = useMemo(() => {
        const grouped = {};
        expenses.forEach(exp => {
            const catId = exp.categoryId;
            if (!grouped[catId]) {
                const cat = categories.find(c => c.id == catId) || { name: t('analytics.noCategory'), color: 'slate' };
                grouped[catId] = { name: cat.name, value: 0, color: cat.color };
            }
            grouped[catId].value += exp.amount;
        });
        return Object.values(grouped).sort((a, b) => b.value - a.value);
    }, [expenses, categories]);

    // 2. Daily Spending (Bar)
    const dailyData = useMemo(() => {
        const grouped = {};
        // Sort expenses by date
        expenses.forEach(exp => {
            const day = new Date(exp.date).getDate();
            if (!grouped[day]) grouped[day] = 0;
            grouped[day] += exp.amount;
        });

        return Object.entries(grouped)
            .map(([day, amount]) => ({ day: parseInt(day), amount }))
            .sort((a, b) => a.day - b.day);
    }, [expenses]);

    // 3. KPIs
    const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const topCategory = categoryData.length > 0 ? categoryData[0] : null;
    const avgDaily = dailyData.length > 0 ? totalSpent / dailyData.length : 0;

    const COLORS = {
        slate: '#64748b', red: '#ef4444', orange: '#f97316', amber: '#f59e0b',
        yellow: '#eab308', lime: '#84cc16', green: '#22c55e', emerald: '#10b981',
        teal: '#14b8a6', cyan: '#06b6d4', sky: '#0ea5e9', blue: '#3b82f6',
        indigo: '#6366f1', violet: '#8b5cf6', purple: '#a855f7', fuchsia: '#d946ef',
        pink: '#ec4899', rose: '#f43f5e'
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-surface-container/95 backdrop-blur-xl border border-outline p-3 rounded-xl shadow-2xl z-50 min-w-[120px]">
                    <p className="text-on-surface font-bold mb-1 text-sm border-b border-outline pb-1">
                        {label ? `${t('analytics.day')} ${label}` : payload[0].name}
                    </p>
                    <div className="flex items-center gap-3">
                        <span className="text-on-surface-variant text-xs">{t('analytics.total')}:</span>
                        <span className="text-primary font-mono font-bold text-sm">
                            {formatCurrency(payload[0].value)}
                        </span>
                    </div>
                </div>
            );
        }
        return null;
    };

    const [activeIndex, setActiveIndex] = React.useState(-1);

    const onPieEnter = (_, index) => {
        setActiveIndex(index);
    };

    const onPieLeave = () => {
        setActiveIndex(-1);
    };

    const activeItem = activeIndex >= 0 ? categoryData[activeIndex] : null;

    if (expenses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-secondary">
                <TrendingUp className="w-12 h-12 mb-4 opacity-20" />
                <p>{t('analytics.insufficientData')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container border border-outline p-4 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-xs font-bold text-on-surface-variant uppercase">{t('analytics.topCategory')}</span>
                    </div>
                    <p className="text-lg font-bold text-on-surface truncate">{topCategory?.name || '-'}</p>
                    <p className="text-xs text-on-surface-variant">{topCategory ? formatCurrency(topCategory.value) : '-'}</p>
                </div>
                <div className="bg-surface-container border border-outline p-4 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="bg-success/10 p-2 rounded-lg">
                            <Calendar className="w-5 h-5 text-success" />
                        </div>
                        <span className="text-xs font-bold text-on-surface-variant uppercase">{t('analytics.dailyAverage')}</span>
                    </div>
                    <p className="text-lg font-bold text-on-surface">{formatCurrency(avgDaily)}</p>
                    <p className="text-xs text-on-surface-variant">{t('analytics.inSpendingDays')}</p>
                </div>
            </div>

            {/* Donut Chart */}
            <div className="bg-surface-container border border-outline p-6 rounded-3xl">
                <h3 className="text-sm font-bold text-on-surface-variant uppercase mb-6">{t('analytics.expensesByCategory')}</h3>
                <div className="h-64 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                                onMouseEnter={onPieEnter}
                                onMouseLeave={onPieLeave}
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[entry.color] || COLORS.slate}
                                        opacity={activeIndex === -1 || activeIndex === index ? 1 : 0.3}
                                        stroke={activeIndex === index ? '#fff' : 'none'}
                                        strokeWidth={2}
                                    />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-300">
                        <span className="text-xs text-on-surface-variant font-medium mb-1">
                            {activeItem ? activeItem.name : t('analytics.total')}
                        </span>
                        <span className={`text-xl font-bold ${activeItem ? 'text-primary' : 'text-on-surface'}`}>
                            {formatCurrency(activeItem ? activeItem.value : totalSpent)}
                        </span>
                        {activeItem && (
                            <span className="text-xs text-on-surface-variant mt-1">
                                {Math.round((activeItem.value / totalSpent) * 100)}%
                            </span>
                        )}
                    </div>
                </div>
                {/* Legend */}
                <div className="mt-6 grid grid-cols-2 gap-2">
                    {categoryData.slice(0, 6).map((cat, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[cat.color] || COLORS.slate }} />
                            <span className="text-on-surface-variant truncate flex-1">{cat.name}</span>
                            <span className="text-on-surface-variant">{Math.round((cat.value / totalSpent) * 100)}%</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-surface-container border border-outline p-6 rounded-3xl">
                <h3 className="text-sm font-bold text-on-surface-variant uppercase mb-6">{t('analytics.dailyTrend')}</h3>
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--outline))" opacity={0.3} vertical={false} />
                            <XAxis
                                dataKey="day"
                                tick={{ fill: 'rgb(var(--on-surface-variant))', fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgb(var(--outline))', opacity: 0.2 }} />
                            <Bar dataKey="amount" fill="rgb(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
