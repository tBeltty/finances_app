import React, { useEffect, useState } from 'react';
import { Server, Cpu, HardDrive, AlertTriangle, Activity, TrendingUp } from 'lucide-react';
import api from '../api/axios';

export default function SystemMonitor() {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const fetchHealth = async () => {
        try {
            const { data } = await api.get('/admin/system-health');
            setHealth(data);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Failed to fetch system health', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(fetchHealth, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="p-8 text-center text-secondary">Loading System Metrics...</div>;
    if (!health) return <div className="p-8 text-center text-error">System Monitor Offline</div>;

    const { resources, metrics, alerts } = health;

    // Helper for color based on usage
    const getUsageColor = (pct) => {
        if (pct > 90) return 'bg-error text-error';
        if (pct > 75) return 'bg-warning text-warning';
        return 'bg-success text-success';
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-lg font-bold text-main">Infrastructure Health</h2>
                    <p className="text-xs text-secondary">
                        Server: Ubuntu VPS • Node.js Runtime • Last update: {lastUpdated.toLocaleTimeString()}
                    </p>
                </div>
                <div className="flex gap-2">
                    <StatusBadge label="API" status="online" />
                    <StatusBadge label="Database" status="online" />
                </div>
            </div>

            {/* Alerts Banner */}
            {alerts.length > 0 && (
                <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 space-y-2">
                    {alerts.map((alert, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-warning font-medium">
                            <AlertTriangle size={16} />
                            {alert.message}
                        </div>
                    ))}
                </div>
            )}

            {/* Resources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Memory */}
                <ResourceCard
                    icon={<HardDrive size={20} />}
                    title="Memory Usage"
                    value={`${resources.memory.usagePercentage}%`}
                    subtext={`${(resources.memory.free / 1024 / 1024 / 1024).toFixed(1)}GB Free / ${(resources.memory.total / 1024 / 1024 / 1024).toFixed(1)}GB Total`}
                    progress={resources.memory.usagePercentage}
                />

                {/* CPU */}
                <ResourceCard
                    icon={<Cpu size={20} />}
                    title="CPU Load (1m)"
                    value={resources.cpu.loadAvg[0].toFixed(2)}
                    subtext={`5m: ${resources.cpu.loadAvg[1].toFixed(2)} • 15m: ${resources.cpu.loadAvg[2].toFixed(2)}`}
                    progress={Math.min(resources.cpu.loadAvg[0] * 50, 100)} // Rough estimate for 2-core visual
                />

                {/* Uptime */}
                <ResourceCard
                    icon={<Server size={20} />}
                    title="System Uptime"
                    value={`${(resources.uptime / 3600).toFixed(1)}h`}
                    subtext="Continuous Service"
                    progress={100}
                    color="primary"
                />
            </div>

            {/* Business Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MetricRow
                    label="New Users (24h)"
                    value={metrics.newUsers24h}
                    icon={<TrendingUp size={16} />}
                    trend={metrics.newUsers24h > 10 ? 'high' : 'normal'}
                />
                <MetricRow
                    label="Failed Logins (Security)"
                    value={metrics.failedLogins24h}
                    icon={<AlertTriangle size={16} />}
                    trend={metrics.failedLogins24h > 5 ? 'critical' : 'normal'}
                />
            </div>
        </div>
    );
}

function ResourceCard({ icon, title, value, subtext, progress, color }) {
    const isHigh = !color && progress > 80;
    const barColor = color ? 'bg-primary' : (isHigh ? 'bg-warning' : 'bg-success');
    const iconColor = color ? 'text-primary' : (isHigh ? 'text-warning' : 'text-success');

    return (
        <div className="glass-panel p-5 rounded-xl border border-white/5">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="text-secondary text-xs uppercase tracking-wider font-semibold mb-1">{title}</div>
                    <div className="text-2xl font-bold text-main">{value}</div>
                </div>
                <div className={`p-2 rounded-lg bg-surface-container ${iconColor}`}>
                    {icon}
                </div>
            </div>

            <div className="w-full bg-surface-container-high rounded-full h-2 mb-2">
                <div className={`h-2 rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${progress}%` }}></div>
            </div>
            <div className="text-xs text-secondary font-mono">{subtext}</div>
        </div>
    );
}

function MetricRow({ label, value, icon, trend }) {
    const color = trend === 'critical' ? 'text-error' : (trend === 'high' ? 'text-primary' : 'text-secondary');
    return (
        <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container/30 border border-white/5">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-surface ${color}`}>
                    {icon}
                </div>
                <span className="text-sm font-medium text-main">{label}</span>
            </div>
            <span className={`text-xl font-bold ${color}`}>{value}</span>
        </div>
    );
}

function StatusBadge({ label, status }) {
    return (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-success/10 rounded text-xs font-medium text-success border border-success/20">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
            {label}
        </div>
    );
}
