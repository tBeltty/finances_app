import { useState, useEffect } from 'react';
import api from '../api/axios';
import Swal from 'sweetalert2';

export function useAdminUsers(activeTab) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);

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

    useEffect(() => {
        if (activeTab === 'users' || activeTab === 'deleted') {
            fetchUsers();
        }
    }, [activeTab]);

    const handlePromote = async (id, email) => {
        const result = await Swal.fire({
            title: 'Grant Admin Privileges?',
            text: `User: ${email} - They will have full system access.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#f43f5e',
            confirmButtonText: 'Confirm Promotion',
            background: '#1e293b',
            color: '#f8fafc'
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

    const handleDeleteUser = async (id, email, onSuccess) => {
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
                if (onSuccess) onSuccess();
            } catch (err) {
                Swal.fire('Error', err.response?.data?.message || 'Failed', 'error');
            }
        }
    };

    const handleBulkAction = async (actionType, onSuccess) => {
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
                if (onSuccess) onSuccess();
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

    return {
        users,
        loading,
        error,
        selectedIds,
        refetchUsers: fetchUsers,
        handlePromote,
        handleDeleteUser,
        handleBulkAction,
        toggleSelectAll,
        toggleSelect,
        setSelectedIds
    };
}
