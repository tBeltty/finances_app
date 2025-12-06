import { useState, useEffect } from 'react';
import api from '../api/axios';

export function useAuditLogs(active) {
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/audit-logs');
            setAuditLogs(data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (active) fetchLogs();
    }, [active]);

    return { auditLogs, loading, error, refetchLogs: fetchLogs };
}
