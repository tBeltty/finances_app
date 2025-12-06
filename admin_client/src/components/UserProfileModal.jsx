import React, { useEffect, useState } from 'react';
import { X, Shield, ShieldAlert, CheckCircle, Database, Calendar, CreditCard, DollarSign } from 'lucide-react';
import api from '../api/axios';
import Swal from 'sweetalert2';

export default function UserProfileModal({ userId, onClose, onUserUpdated }) {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const { data } = await api.get(`/admin/users/${userId}`);
                setUser(data.user);
                setStats(data.stats);
            } catch (err) {
                Swal.fire('Error', 'Failed to load user details', 'error');
                onClose();
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [userId]);

    const handleAction = async (actionType) => {
        try {
            if (actionType === 'verify_email') {
                await api.put(`/admin/users/${userId}/status`, { action: 'verify_email' });
                setUser(prev => ({ ...prev, emailVerified: true }));
                Swal.fire('Success', 'Email marked as verified', 'success');
            } else if (actionType === 'disable_2fa') {
                await api.put(`/admin/users/${userId}/status`, { action: 'disable_2fa' });
                setUser(prev => ({ ...prev, isTwoFactorEnabled: false }));
                Swal.fire('Success', '2FA has been disabled', 'success');
            } else if (actionType === 'sent_reset') {
                await api.post('/auth/forgot-password', { email: user.email });
                Swal.fire('Sent', `Password reset email sent to ${user.email}`, 'success');
            }
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Action failed', 'error');
        }
    };

    const handleDelete = async (type) => {
        const isForget = type === 'forget';
        const result = await Swal.fire({
            title: isForget ? 'Forget User?' : 'Delete User?',
            text: isForget
                ? 'This is a GDPR/Right-to-be-Forgotten request. All data will be wiped.'
                : 'Standard deletion. All data will be wiped.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f43f5e',
            cancelButtonColor: '#475569',
            confirmButtonText: isForget ? 'Forget Forever' : 'Delete',
            background: '#1e293b',
            color: '#f8fafc'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/admin/users/${userId}${isForget ? '?type=forget' : ''}`);
                Swal.fire('Deleted', 'User has been removed.', 'success');
                onUserUpdated(); // Refresh parent list
                onClose();
            } catch (err) {
                Swal.fire('Error', err.response?.data?.message || 'Delete failed', 'error');
            }
        }
    };

    const handleRestore = async () => {
        try {
            await api.post(`/admin/users/${userId}/restore`);
            Swal.fire('Restored', 'User has been restored.', 'success');
            onUserUpdated();
            onClose();
        } catch (err) {
            Swal.fire('Error', 'Restore failed', 'error');
        }
    };

    if (loading) return <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"><div className="text-secondary">Loading Profile...</div></div>;
    if (!user) return null;

    const isDeleted = !!user.deletedAt;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-surface glass-panel w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-outline/20" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className={`p-6 flex justify-between items-start border-b border-outline/10 ${isDeleted ? 'bg-error/10' : 'bg-surface-container/50'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${isDeleted ? 'bg-error/20 text-error' : 'bg-primary/20 text-primary'}`}>
                            {user.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-main flex items-center gap-2">
                                {user.username}
                                {isDeleted && <span className="text-xs bg-error text-white px-2 py-0.5 rounded-full">DELETED</span>}
                            </h2>
                            <p className="text-sm text-secondary">{user.email}</p>
                            <div className="flex gap-2 mt-2">
                                <span className={`text-xs px-2 py-0.5 rounded ${user.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'}`}>
                                    {user.role}
                                </span>
                                {user.emailVerified ?
                                    <span className="text-xs px-2 py-0.5 rounded bg-success/20 text-success flex items-center gap-1"><CheckCircle size={10} /> Verified</span>
                                    : <span className="text-xs px-2 py-0.5 rounded bg-warning/20 text-warning">Unverified</span>
                                }
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-secondary hover:text-main p-1 rounded-full hover:bg-white/5 transition"><X /></button>
                </div>

                {/* Body */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Stats */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-secondary uppercase tracking-wider">Engagement Metrcis</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-surface-container/30 p-3 rounded-xl border border-white/5">
                                <div className="text-xs text-secondary mb-1">Last Login</div>
                                <div className="text-sm font-mono text-main">
                                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                                </div>
                            </div>
                            <div className="bg-surface-container/30 p-3 rounded-xl border border-white/5">
                                <div className="text-xs text-secondary mb-1">Joined</div>
                                <div className="text-sm font-mono text-main">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="bg-surface-container/30 p-3 rounded-xl border border-white/5">
                                <div className="text-xs text-secondary mb-1">Expenses Logged</div>
                                <div className="text-lg font-bold text-main">{stats?.expenseCount || 0}</div>
                            </div>
                            <div className="bg-surface-container/30 p-3 rounded-xl border border-white/5">
                                <div className="text-xs text-secondary mb-1">Loans Managed</div>
                                <div className="text-lg font-bold text-main">{stats?.loanCount || 0}</div>
                            </div>
                        </div>

                        <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mt-6">Preferences</h3>
                        <div className="flex flex-wrap gap-2">
                            <Badge label="Theme" value={user.theme} />
                            <Badge label="Lang" value={user.language} />
                            <Badge label="Currency" value={user.currency} />
                            <Badge label="Pay Freq" value={user.incomeFrequency} />
                            <Badge label="Marketing" value={user.marketingConsent ? 'YES' : 'NO'} />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-secondary uppercase tracking-wider">Support Actions</h3>

                        {isDeleted ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg text-warning text-sm">
                                    This user is currently in the Trash. They will be permanently deleted in 30 days unless restored.
                                </div>
                                <button onClick={handleRestore} className="w-full py-3 rounded-lg bg-success hover:bg-success-container text-white font-bold transition shadow-lg shadow-success/20">
                                    Restore User
                                </button>
                                <button onClick={() => handleDelete('forget')} className="w-full py-3 rounded-lg bg-error hover:bg-error-container text-white font-bold transition shadow-lg shadow-error/20">
                                    Permanently Delete Now
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    {user.isTwoFactorEnabled ? (
                                        <button onClick={() => handleAction('disable_2fa')} className="w-full p-3 rounded-lg border border-warning/30 bg-warning/5 text-warning hover:bg-warning/10 text-left text-sm flex items-center gap-3 transition">
                                            <ShieldAlert size={18} /> Disable 2FA (Rescue)
                                        </button>
                                    ) : (
                                        <div className="w-full p-3 rounded-lg border border-white/5 bg-white/5 text-secondary text-left text-sm flex items-center gap-3 opacity-50 cursor-not-allowed">
                                            <Shield size={18} /> 2FA is not enabled
                                        </div>
                                    )}

                                    {!user.emailVerified && (
                                        <button onClick={() => handleAction('verify_email')} className="w-full p-3 rounded-lg border border-success/30 bg-success/5 text-success hover:bg-success/10 text-left text-sm flex items-center gap-3 transition">
                                            <CheckCircle size={18} /> Manually Verify Email
                                        </button>
                                    )}

                                    <button onClick={() => handleAction('sent_reset')} className="w-full p-3 rounded-lg border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 text-left text-sm flex items-center gap-3 transition">
                                        <CreditCard size={18} /> Send Password Reset
                                    </button>
                                </div>

                                <h3 className="text-xs font-bold text-error uppercase tracking-wider mt-6">Danger Zone</h3>
                                <div className="flex gap-2">
                                    <button onClick={() => handleDelete('standard')} className="flex-1 py-2 rounded-lg bg-surface-container-high hover:bg-error/20 text-error text-sm font-medium transition border border-transparent hover:border-error/20">
                                        Move to Trash
                                    </button>
                                    <button onClick={() => handleDelete('forget')} className="flex-1 py-2 rounded-lg bg-error hover:bg-error-container text-white text-sm font-bold transition shadow-lg shadow-error/20">
                                        Forget User
                                    </button>
                                </div>
                                <p className="text-[10px] text-secondary text-center mt-2">
                                    "Forget" flags the deletion as a compliance request in audit logs.
                                </p>
                            </>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}

function Badge({ label, value }) {
    return (
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-surface-container text-secondary border border-white/5">
            <span className="opacity-50 mr-1">{label}:</span> <span className="text-main font-medium">{value}</span>
        </span>
    );
}
