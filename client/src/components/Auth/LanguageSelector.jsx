import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

/**
 * A subtle language selector for auth pages.
 * Positioned fixed top-right by default.
 */
export default function LanguageSelector() {
    const { i18n } = useTranslation();
    const currentLang = i18n.language || 'en';

    const languages = [
        { code: 'en', label: 'EN' },
        { code: 'es', label: 'ES' }
    ];

    const handleChange = (e) => {
        const lang = e.target.value;
        i18n.changeLanguage(lang);
        localStorage.setItem('i18nextLng', lang);
    };

    return (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-1.5 bg-surface-container/80 backdrop-blur-sm border border-outline rounded-lg px-2 py-1.5 shadow-sm">
            <Globe className="w-4 h-4 text-secondary" />
            <select
                value={currentLang.substring(0, 2)}
                onChange={handleChange}
                className="bg-transparent text-secondary text-sm font-medium focus:outline-none cursor-pointer appearance-none pr-1"
            >
                {languages.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-surface text-main">
                        {lang.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
