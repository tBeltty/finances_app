import React from 'react';
import { X, Calendar, Bell, ExternalLink, Info, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function NotificationDetailsModal({ isOpen, onClose, notification }) {
    const { t } = useTranslation();

    if (!isOpen || !notification) return null;

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="w-8 h-8 text-success" />;
            case 'warning': return <AlertTriangle className="w-8 h-8 text-warning" />;
            case 'error': return <AlertCircle className="w-8 h-8 text-error" />;
            default: return <Info className="w-8 h-8 text-primary" />;
        }
    };

    const getBgColor = (type) => {
        switch (type) {
            case 'success': return 'bg-success/10';
            case 'warning': return 'bg-warning/10';
            case 'error': return 'bg-error/10';
            default: return 'bg-primary/10';
        }
    };

    return (
        <div className="fixed inset-0 h-[100dvh] bg-black/60 backdrop-blur-3xl grid place-items-center z-[9999] p-6 md:p-8 animate-in fade-in duration-200">
            <div className="bg-surface border border-outline rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden relative flex flex-col max-h-[85vh] m-auto">

                {/* Decorative background elements */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl pointer-events-none ${getBgColor(notification.type)} opacity-50`} />

                <div className="relative p-6 space-y-6 overflow-y-auto scrollbar-thin">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface/50 text-secondary transition-colors"
                    >
                        <X size={20} />
                    </button>

                    {/* Header */}
                    <div className="flex flex-col items-center text-center space-y-4 pt-2">
                        <div className={`inline-flex items-center justify-center p-4 rounded-2xl shadow-sm mb-2 ${getBgColor(notification.type)} border border-outline/10`}>
                            {getIcon(notification.type)}
                        </div>

                        <div className="space-y-1">
                            <h2 className="text-xl font-bold text-main">
                                {notification.title}
                            </h2>
                            <div className="flex items-center justify-center gap-1.5 text-xs text-secondary font-medium bg-surface/50 py-1 px-3 rounded-full border border-outline/50 w-fit mx-auto">
                                <Calendar size={12} />
                                {new Date(notification.createdAt).toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="bg-surface/50 border border-outline/50 rounded-2xl p-5 shadow-inner">
                        <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                            {notification.message}
                        </p>
                    </div>

                    {/* Footer / Actions */}
                    <div className="flex flex-col gap-3">


                        <button
                            onClick={onClose}
                            className="w-full bg-surface hover:bg-surface-container-high text-main py-3.5 rounded-xl font-medium transition-all border border-outline"
                        >
                            {t('common.close')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
