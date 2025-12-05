import { useState, useEffect } from 'react';
import { Database, X } from 'lucide-react';

export default function BackupNotification() {
    const [show, setShow] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const checkBackupStatus = async () => {
            try {
                const res = await fetch('/api/system/backup-status');
                const data = await res.json();
                if (data.inProgress && !dismissed) {
                    setShow(true);
                } else {
                    setShow(false);
                }
            } catch (err) {
                // Silently fail
            }
        };

        // Check immediately
        checkBackupStatus();

        // Poll every 30 seconds
        const interval = setInterval(checkBackupStatus, 30000);
        return () => clearInterval(interval);
    }, [dismissed]);

    if (!show) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
            <div className="bg-surface-container/95 backdrop-blur-xl border border-outline rounded-xl px-4 py-3 shadow-xl flex items-center gap-3 max-w-xs">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Database className="h-4 w-4 text-primary" />
                        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
                    </div>
                    <span className="text-sm text-secondary">
                        Backup in progress...
                    </span>
                </div>
                <button
                    onClick={() => setDismissed(true)}
                    className="text-secondary hover:text-main transition-colors p-1"
                    aria-label="Dismiss"
                >
                    <X className="h-3 w-3" />
                </button>
            </div>
        </div>
    );
}
