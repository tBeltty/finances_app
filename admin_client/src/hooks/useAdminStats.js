import { useState, useEffect } from 'react';
import api from '../api/axios';

export function useAdminStats() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/stats');
            setStats(data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    return { stats, loading, error, refetchStats: fetchStats };
}
