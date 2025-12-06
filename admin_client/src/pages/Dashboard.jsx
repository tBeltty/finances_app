import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Activity, Users, FileWarning, Database, Trash2, LogOut, Server } from 'lucide-react';
import Swal from 'sweetalert2';
import UserProfileModal from '../components/UserProfileModal';
import SystemMonitor from '../components/SystemMonitor';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import NotificationCenter from '../components/NotificationCenter';
import NotificationSender from '../components/NotificationSender';
import LocalizationCenter from '../components/LocalizationCenter';

export default function Dashboard() {
    const { logout, user } = useAuth();
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [activeTab, setActiveTab] = useState('analytics'); // Default to analytics for "wow" factor
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]); // For bulk actions
    const [auditLogs, setAuditLogs] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchStats();
        fetchUsers();
    }, []);

    const fetchStats = async () => {
        try {
            const { data } = await api.get('/admin/stats');
            setStats(data);
        } catch (err) { console.error(err); }
    };

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const scope = activeTab === 'deleted' ? '?scope=deleted' : '';
            const { data } = await api.get(`/admin/users${scope}`);
            setUsers(data);
            setSelectedIds([]); // Clear selection on refresh
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        try {
            const { data } = await api.get('/admin/audit-logs');
            setAuditLogs(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        if (activeTab === 'users' || activeTab === 'deleted') fetchUsers();
        if (activeTab === 'logs') fetchLogs();
    }, [activeTab]);

    const handlePromote = async (id, email) => {
        const result = await Swal.fire({
            title: 'Grant Admin Privileges?',
            text: `User: ${email} - They will have full system access.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5', // Indigo-600
            cancelButtonColor: '#f43f5e', // Rose-500
            confirmButtonText: 'Confirm Promotion',
            background: '#1e293b', // Slate-800
            color: '#f8fafc' // Slate-50
        });

        if (result.isConfirmed) {
            try {
                await api.put(`/admin/users/${id}/promote`);
                Swal.fire({
                    title: 'Promoted!',
                    text: 'User is now an Administrator.',
                    icon: 'success',
                    background: '#1e293b',
                    color: '#f8fafc',
                    confirmButtonColor: '#4f46e5'
                });
                fetchUsers();
            } catch (err) {
                Swal.fire('Error', err.response?.data?.message || 'Failed', 'error');
            }
        }
    };

    const handleDeleteUser = async (id, email) => {
        const result = await Swal.fire({
            title: 'Delete User?',
            text: `Target: ${email} - This action is irreversible.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f43f5e',
            cancelButtonColor: '#475569',
            confirmButtonText: 'Delete User',
            background: '#1e293b',
            color: '#f8fafc'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/admin/users/${id}`);
                Swal.fire({
                    title: 'Deleted',
                    text: 'User has been removed.',
                    icon: 'success',
                    background: '#1e293b',
                    color: '#f8fafc',
                    confirmButtonColor: '#4f46e5'
                });
                fetchUsers();
                fetchStats();
            } catch (err) {
                Swal.fire('Error', err.response?.data?.message || 'Failed', 'error');
            }
        }
    };

    const handleBulkAction = async (actionType) => {
        const actionName = actionType === 'delete' ? 'Move to Trash' : (actionType === 'restore' ? 'Restore' : 'Permanently Delete');

        const result = await Swal.fire({
            title: `${actionName} ${selectedIds.length} users?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: actionType === 'forget' ? '#f43f5e' : '#3b82f6',
            confirmButtonText: 'Yes, proceed',
            background: '#1e293b',
            color: '#f8fafc'
        });

        if (result.isConfirmed) {
            try {
                await api.post('/admin/users/bulk-action', { ids: selectedIds, action: actionType });
                Swal.fire('Success', 'Bulk action completed', 'success');
                fetchUsers();
                fetchStats(); // Stats might change if users are deleted/restored
            } catch (err) {
                Swal.fire('Error', err.response?.data?.message || 'Failed', 'error');
            }
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === users.length && users.length > 0) setSelectedIds([]);
        else setSelectedIds(users.map(u => u.id));
    };

    const toggleSelect = (id) => {
        if (selectedIds.includes(id)) setSelectedIds(prev => prev.filter(i => i !== id));
        else setSelectedIds(prev => [...prev, id]);
    };

    const isSuperAdmin = user?.isSuperAdmin;

    return (
        <div className="min-h-screen bg-surface p-6 font-sans text-main">
            <header className="flex justify-between items-center mb-8 pb-4 border-b border-outline">
                <div className="flex items-center gap-4">
                    <img src="/adminlogo.png" alt="Admin Logo" className="w-10 h-10 object-contain" />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-main flex items-center gap-2">
                            Admin tBelt
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/20">v1.0.1</span>
                        </h1>
                        <span className="text-sm font-medium text-secondary">
                            {user?.role === 'admin' ? 'Administrator' : 'User'} • {user?.email}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <NotificationCenter />
                    <button onClick={logout} className="flex items-center gap-2 text-secondary hover:text-error transition-colors">
                        <LogOut size={18} /> <span className="text-sm font-medium">Sign Out</span>
                    </button>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" >
                <StatCard icon={<Users className="text-primary" />} label="Total Users" value={stats?.userCount} />
                <StatCard icon={<Database className="text-primary" />} label="Active Loans" value={stats?.activeLoans} />
                <StatCard icon={<FileWarning className="text-warning" />} label="Security Events" value={stats?.auditCount} />
            </div >

            {/* Tabs */}
            < div className="flex gap-4 mb-6" >
                <TabButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} label="Analytics" />
                <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} label="Active Users" />
                <TabButton active={activeTab === 'deleted'} onClick={() => setActiveTab('deleted')} label="Deleted Users" />
                <TabButton active={activeTab === 'logs'} onClick={() => { setActiveTab('logs'); fetchLogs(); }} label="Security Logs" />
                <TabButton active={activeTab === 'system'} onClick={() => setActiveTab('system')} label="System Hub" />
                <TabButton active={activeTab === 'localization'} onClick={() => setActiveTab('localization')} label="Localization" />
            </div >

            {/* Bulk Actions Bar */}
            {
                selectedIds.length > 0 && (
                    <div className="mb-4 p-4 bg-surface-container rounded-xl flex items-center justify-between border border-primary/20 animate-fade-in">
                        <span className="font-bold text-main">{selectedIds.length} users selected</span>
                        <div className="flex gap-2">
                            {activeTab === 'deleted' ? (
                                <>
                                    <button onClick={() => handleBulkAction('restore')} className="px-4 py-2 bg-success/20 text-success rounded-lg hover:bg-success/30 font-medium">Restore Selected</button>
                                    <button onClick={() => handleBulkAction('forget')} className="px-4 py-2 bg-error/20 text-error rounded-lg hover:bg-error/30 font-medium">Permanently Forget</button>
                                </>
                            ) : (
                                <button onClick={() => handleBulkAction('delete')} className="px-4 py-2 bg-warning/20 text-warning rounded-lg hover:bg-warning/30 font-medium">Move to Trash</button>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Content Card */}
            <div className={`glass-panel rounded-xl overflow-hidden min-h-[400px] ${activeTab === 'system' || activeTab === 'analytics' || activeTab === 'localization' ? 'p-6' : ''}`}>
                {activeTab === 'analytics' && <AnalyticsDashboard />}
                {activeTab === 'localization' && <LocalizationCenter />}
                {activeTab === 'system' && (
                    <div className="space-y-6">
                        <SystemMonitor />
                        <NotificationSender />
                    </div>
                )}

                {error && activeTab !== 'system' && activeTab !== 'analytics' && activeTab !== 'localization' && (
                    <div className="bg-error/10 text-error p-4 border-b border-error/20 flex items-center justify-between">
                        <span>Error loading data: {error}</span>
                        <button onClick={fetchUsers} className="underline text-sm">Retry</button>
                    </div>
                )}
                {loading && (
                    <div className="p-8 text-center text-secondary">Loading system data...</div>
                )}
                {(activeTab === 'users' || activeTab === 'deleted') && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-surface-container/50">
                                <tr>
                                    <th className="p-4 table-header w-10">
                                        <input type="checkbox" checked={selectedIds.length === users.length && users.length > 0} onChange={toggleSelectAll} className="rounded border-secondary bg-surface" />
                                    </th>
                                    <th className="p-4 table-header">ID</th>
                                    <th className="p-4 table-header">Identity</th>
                                    <th className="p-4 table-header">Status</th>
                                    <th className="p-4 table-header">Last Login</th>
                                    <th className="p-4 table-header">Role</th>
                                    <th className="p-4 table-header text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} className={`table-row hover:bg-surface-container/30 cursor-pointer ${selectedIds.includes(u.id) ? 'bg-primary/5' : ''}`} onClick={() => setSelectedUserId(u.id)}>
                                        <td className="p-4" onClick={e => e.stopPropagation()}>
                                            <input type="checkbox" checked={selectedIds.includes(u.id)} onChange={() => toggleSelect(u.id)} className="rounded border-secondary bg-surface" />
                                        </td>
                                        <td className="p-4 text-secondary text-sm">#{u.id}</td>
                                        <td className="p-4 font-semibold text-main hover:text-primary transition-colors">
                                            {u.username}
                                            <div className="text-secondary text-xs font-normal">{u.email}</div>
                                        </td>
                                        <td className="p-4">
                                            {u.emailVerified ?
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-success/10 text-success border border-success/20">Verified</span>
                                                :
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-warning/10 text-warning border border-warning/20">Pending</span>
                                            }
                                        </td>
                                        <td className="p-4 text-secondary text-xs font-mono">
                                            {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-xs font-bold uppercase tracking-wider ${u.role === 'admin' ? 'text-primary' : 'text-secondary'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right flex justify-end gap-2 text-sm" onClick={e => e.stopPropagation()}>
                                            {isSuperAdmin && u.role !== 'admin' && activeTab === 'users' && (
                                                <button onClick={() => handlePromote(u.id, u.email)} className="text-primary hover:text-primary-container hover:bg-primary/10 px-3 py-1 rounded transition-colors font-medium">
                                                    Promote
                                                </button>
                                            )}
                                            {activeTab === 'users' && (
                                                <button onClick={() => handleDeleteUser(u.id, u.email)} className="text-error hover:text-error-container hover:bg-error/10 px-3 py-1 rounded transition-colors font-medium">
                                                    Delete
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="overflow-x-auto h-[600px] overflow-y-scroll scrollbar-thin scrollbar-thumb-surface-container-high">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-surface-container/50 sticky top-0 backdrop-blur-md">
                                <tr>
                                    <th className="p-4 table-header">Time</th>
                                    <th className="p-4 table-header">Action</th>
                                    <th className="p-4 table-header">Severity</th>
                                    <th className="p-4 table-header">IP Address</th>
                                    <th className="p-4 table-header w-1/3">Details</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {auditLogs.map(log => (
                                    <tr key={log.id} className="table-row">
                                        <td className="p-4 text-secondary font-mono text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                                        <td className="p-4 font-medium text-main">{log.action}</td>
                                        <td className="p-4">
                                            <SeverityBadge severity={log.severity} />
                                        </td>
                                        <td className="p-4 text-secondary font-mono text-xs">{log.ipAddress}</td>
                                        <td className="p-4 text-secondary text-xs break-all">
                                            {JSON.stringify(log.details)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Profile Modal */}
            {
                selectedUserId && (
                    <UserProfileModal
                        userId={selectedUserId}
                        onClose={() => setSelectedUserId(null)}
                        onUserUpdated={() => {
                            fetchUsers();
                        }}
                    />
                )
            }
        </div >
    );
}

function StatCard({ icon, label, value }) {
    return (
        <div className="glass-panel p-6 rounded-xl flex items-center justify-between hover:bg-surface-container/50 transition-colors shadow-sm">
            <div>
                <div className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">{label}</div>
                <div className="text-3xl font-bold text-main">{value ?? '-'}</div>
            </div>
            <div className="p-3 bg-surface rounded-full shadow-sm">{icon}</div>
        </div>
    );
}

function TabButton({ active, onClick, label }) {
    return (
        <button
            onClick={onClick}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${active
                ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                : 'bg-surface-container text-secondary hover:bg-surface-container-high hover:text-main'
                }`}
        >
            {label}
        </button>
    );
}

function SeverityBadge({ severity }) {
    if (severity === 'CRITICAL') return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-error/10 text-error border border-error/20">CRITICAL</span>;
    if (severity === 'WARNING') return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-warning/10 text-warning border border-warning/20">WARNING</span>;
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-surface-container-high text-secondary">INFO</span>;
}
