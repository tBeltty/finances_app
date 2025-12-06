import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import api from '../api/axios';
import { useLocation } from 'react-router-dom';

export default function NotificationCenter() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const location = useLocation();

    const fetchNotifications = async () => {
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
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
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error(err);
        }
    };

    const markAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
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
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-surface-container-high rounded-xl shadow-2xl border border-outline/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="p-3 border-b border-outline/10 flex justify-between items-center bg-surface/50 backdrop-blur">
                        <h3 className="font-semibold text-sm text-main">Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={markAllRead} className="text-xs text-primary hover:text-primary-container transition-colors flex items-center gap-1">
                                <Check size={12} /> Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-outline/20">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-secondary text-sm">
                                <Bell size={32} className="mx-auto mb-2 opacity-20" />
                                No notifications yet
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => !n.isRead && markAsRead(n.id)}
                                    className={`p-4 border-b border-outline/5 hover:bg-white/5 transition-colors cursor-pointer group ${!n.isRead ? 'bg-primary/5' : ''}`}
                                >
                                    <div className="flex gap-3">
                                        <div className="mt-1.5 flex-shrink-0">
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className={`text-sm font-medium ${!n.isRead ? 'text-main' : 'text-secondary'}`}>{n.title}</h4>
                                                <span className="text-[10px] text-secondary opacity-60 ml-2 whitespace-nowrap">
                                                    {new Date(n.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-secondary mt-1 leading-relaxed">{n.message}</p>

                                            {n.link && (
                                                <a
                                                    href={n.link}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline mt-2"
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    View Details <ExternalLink size={10} />
                                                </a>
                                            )}
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
            )}
        </div>
    );
}
