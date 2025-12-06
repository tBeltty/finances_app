import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import NotificationDetailsModal from './NotificationDetailsModal';

export default function NotificationCenter() {
    const { t } = useTranslation();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const dropdownRef = useRef(null);
    const location = useLocation();

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await fetch('/api/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Poll every 60s
        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    // Close when route changes
    useEffect(() => {
        setIsOpen(false);
    }, [location]);

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const markAllRead = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/notifications/read-all', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <div className="w-2 h-2 rounded-full bg-emerald-500"></div>;
            case 'warning': return <div className="w-2 h-2 rounded-full bg-amber-500"></div>;
            case 'error': return <div className="w-2 h-2 rounded-full bg-rose-500"></div>;
            default: return <div className="w-2 h-2 rounded-full bg-indigo-500"></div>;
        }
    };

    return (
        <>
            <div className="relative z-50" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative p-2 rounded-full text-secondary hover:bg-surface-container hover:text-main transition-colors"
                >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-surface animate-pulse"></span>
                    )}
                </button>

                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40 bg-black/20 md:hidden" onClick={() => setIsOpen(false)} />
                        <div className="fixed top-16 right-4 left-4 md:left-auto md:absolute md:top-full md:right-0 md:mt-2 w-auto md:w-96 bg-[rgb(var(--surface-container))] rounded-xl shadow-2xl border border-outline/20 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-white/10 z-50">
                            <div className="p-3 border-b border-outline/10 flex justify-between items-center bg-surface/50 backdrop-blur-md">
                                <h3 className="font-semibold text-sm text-main">{t('notifications.title')}</h3>
                                {unreadCount > 0 && (
                                    <button onClick={markAllRead} className="text-xs text-primary hover:text-primary-container transition-colors flex items-center gap-1">
                                        <Check size={12} /> {t('notifications.markAllRead')}
                                    </button>
                                )}
                            </div>

                            <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-outline/20">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-secondary text-sm">
                                        <Bell size={32} className="mx-auto mb-2 opacity-20" />
                                        {t('notifications.empty')}
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <div
                                            key={n.id}
                                            onClick={() => {
                                                if (!n.isRead) markAsRead(n.id);
                                                // Don't open modal if clicking the main container, maybe?
                                                // Actually, expanding logic: Click -> Open Modal & Mark Read
                                                setSelectedNotification(n);
                                                setIsOpen(false); // Close dropdown
                                            }}
                                            className={`p-4 border-b border-outline/5 hover:bg-white/5 transition-colors cursor-pointer group ${!n.isRead ? 'bg-primary/5' : ''}`}
                                        >
                                            <div className="flex gap-3">
                                                <div className="mt-1.5 flex-shrink-0">
                                                    {getIcon(n.type)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className={`text-sm font-medium ${!n.isRead ? 'text-main' : 'text-on-surface'}`}>{n.title}</h4>
                                                        <span className="text-[10px] text-secondary opacity-60 ml-2 whitespace-nowrap">
                                                            {new Date(n.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed line-clamp-2">{n.message}</p>

                                                    <div className="mt-2 flex items-center gap-2">
                                                        <button
                                                            className="text-[10px] text-primary hover:underline font-medium flex items-center gap-1"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedNotification(n);
                                                                setIsOpen(false);
                                                                if (!n.isRead) markAsRead(n.id);
                                                            }}
                                                        >
                                                            {t('notifications.viewDetails')} <ExternalLink size={10} />
                                                        </button>
                                                    </div>
                                                </div>
                                                {!n.isRead && (
                                                    <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]"></div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            <NotificationDetailsModal
                isOpen={!!selectedNotification}
                onClose={() => setSelectedNotification(null)}
                notification={selectedNotification}
            />
        </>
    );
}
