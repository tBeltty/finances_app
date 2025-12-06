import React, { useState } from 'react';
import { Send, Users, User, Link as LinkIcon, Info, AlertTriangle, CheckCircle, XCircle, Globe } from 'lucide-react';
import api from '../api/axios';
import Swal from 'sweetalert2';

export default function NotificationSender({ onClose }) {
    const [formData, setFormData] = useState({
        broadcast: 'all',
        userId: '',
        type: 'info',
        link: '',
        content: {
            en: { title: '', message: '' },
            es: { title: '', message: '' }
        }
    });
    const [activeLang, setActiveLang] = useState('en');
    const [loading, setLoading] = useState(false);

    const updateContent = (field, value) => {
        setFormData(prev => ({
            ...prev,
            content: {
                ...prev.content,
                [activeLang]: {
                    ...prev.content[activeLang],
                    [field]: value
                }
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation: At least EN required, likely ES too but let's be flexible
        if (!formData.content.en.title || !formData.content.en.message) {
            Swal.fire('Error', 'English content is required as default.', 'error');
            return;
        }

        setLoading(true);
        try {
            await api.post('/notifications/send', formData);
            Swal.fire({
                title: 'Sent!',
                text: 'Multilingual notification dispatched.',
                icon: 'success',
                background: '#1e293b',
                color: '#fff'
            });
            if (onClose) onClose();
            // Reset
            setFormData({
                broadcast: 'all',
                userId: '',
                type: 'info',
                link: '',
                content: { en: { title: '', message: '' }, es: { title: '', message: '' } }
            });
        } catch (err) {
            console.error(err);
            Swal.fire('Error', err.response?.data?.message || 'Failed to send', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel p-6 rounded-xl animate-fade-in relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Globe size={100} />
            </div>

            <h3 className="text-lg font-bold text-main mb-4 flex items-center gap-2">
                <Send size={20} className="text-primary" /> Send Smart Notification
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Target Selection */}
                <div className="grid grid-cols-2 gap-4">
                    <label className={`cursor-pointer p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.broadcast === 'all' ? 'bg-primary/20 border-primary text-primary' : 'bg-surface-container border-transparent text-secondary hover:bg-surface-container-high'}`}>
                        <input
                            type="radio"
                            name="broadcast"
                            value="all"
                            checked={formData.broadcast === 'all'}
                            onChange={e => setFormData({ ...formData, broadcast: 'all', userId: '' })}
                            className="hidden"
                        />
                        <Users size={24} />
                        <span className="font-medium">All Users</span>
                    </label>
                    <label className={`cursor-pointer p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.broadcast === 'specific' ? 'bg-primary/20 border-primary text-primary' : 'bg-surface-container border-transparent text-secondary hover:bg-surface-container-high'}`}>
                        <input
                            type="radio"
                            name="broadcast"
                            value="specific"
                            checked={formData.broadcast === 'specific'}
                            onChange={e => setFormData({ ...formData, broadcast: 'specific' })}
                            className="hidden"
                        />
                        <User size={24} />
                        <span className="font-medium">Specific ID</span>
                    </label>
                </div>

                {formData.broadcast === 'specific' && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                        <input
                            type="number"
                            placeholder="User ID"
                            value={formData.userId}
                            onChange={e => setFormData({ ...formData, userId: e.target.value })}
                            className="w-full bg-surface-container border border-outline/20 rounded-lg px-4 py-2 text-main focus:ring-2 focus:ring-primary outline-none"
                            required
                        />
                    </div>
                )}

                {/* Language Tabs */}
                <div className="flex border-b border-outline/20 mb-2">
                    <button
                        type="button"
                        onClick={() => setActiveLang('en')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeLang === 'en' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-main'}`}
                    >
                        English {formData.content.en.title && <CheckCircle size={12} className="text-success" />}
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveLang('es')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeLang === 'es' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-main'}`}
                    >
                        Spanish {formData.content.es.title && <CheckCircle size={12} className="text-success" />}
                    </button>
                </div>

                {/* Content Inputs (Dynamic based on activeLang) */}
                <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200" key={activeLang}>
                    <input
                        type="text"
                        placeholder={activeLang === 'en' ? "Title (English)" : "Título (Español)"}
                        value={formData.content[activeLang].title}
                        onChange={e => updateContent('title', e.target.value)}
                        className="w-full bg-surface-container border border-outline/20 rounded-lg px-4 py-3 text-main font-bold focus:ring-2 focus:ring-primary outline-none"
                    />

                    <textarea
                        placeholder={activeLang === 'en' ? "Message (English)..." : "Mensaje (Español)..."}
                        value={formData.content[activeLang].message}
                        onChange={e => updateContent('message', e.target.value)}
                        className="w-full bg-surface-container border border-outline/20 rounded-lg px-4 py-3 text-main h-24 resize-none focus:ring-2 focus:ring-primary outline-none"
                    />
                </div>

                {/* Type Selection */}
                <div className="flex gap-2 bg-surface-container p-1 rounded-lg mt-4">
                    {['info', 'success', 'warning', 'error'].map(type => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setFormData({ ...formData, type })}
                            className={`flex-1 py-1.5 rounded-md text-xs font-bold uppercase transition-all flex justify-center items-center gap-1
                                ${formData.type === type
                                    ? (type === 'info' ? 'bg-indigo-500 text-white' :
                                        type === 'success' ? 'bg-emerald-500 text-white' :
                                            type === 'warning' ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white')
                                    : 'text-secondary hover:bg-white/5'
                                }`}
                        >
                            {type === 'info' && <Info size={12} />}
                            {type === 'success' && <CheckCircle size={12} />}
                            {type === 'warning' && <AlertTriangle size={12} />}
                            {type === 'error' && <XCircle size={12} />}
                            {type}
                        </button>
                    ))}
                </div>

                <div className="relative">
                    <LinkIcon className="absolute left-3 top-3 text-secondary" size={16} />
                    <input
                        type="url"
                        placeholder="Link (Optional Action)"
                        value={formData.link}
                        onChange={e => setFormData({ ...formData, link: e.target.value })}
                        className="w-full bg-surface-container border border-outline/20 rounded-lg pl-10 pr-4 py-2 text-sm text-main focus:ring-2 focus:ring-primary outline-none"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary-container text-on-primary font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Sending...' : <><Send size={18} /> Send Notification ({formData.content.en.title && formData.content.es.title ? 'Dual' : 'Single'})</>}
                </button>

            </form>
        </div>
    );
}
