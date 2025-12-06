import { useTranslation } from 'react-i18next';
import { Sparkles, Wallet, HandCoins, X, ArrowRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function WhatsNewModal({ isOpen, onClose, version }) {
    const { t } = useTranslation();
    const { theme } = useTheme();

    if (!isOpen) return null;

    const features = [
        {
            icon: <Wallet className="w-6 h-6 text-primary" />,
            titleKey: 'whatsNew.features.income.title',
            descKey: 'whatsNew.features.income.desc'
        },
        {
            icon: <HandCoins className="w-6 h-6 text-primary" />,
            titleKey: 'whatsNew.features.loans.title',
            descKey: 'whatsNew.features.loans.desc'
        },
        {
            icon: <Sparkles className="w-6 h-6 text-primary" />,
            titleKey: 'whatsNew.features.ui.title',
            descKey: 'whatsNew.features.ui.desc'
        }
    ];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface-container border border-outline rounded-3xl w-full max-w-md shadow-2xl animate-fade-in overflow-hidden relative">

                {/* Decorative background elements */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none" />
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative p-6 space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center p-3 bg-surface border border-outline rounded-2xl shadow-sm mb-2">
                            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                        </div>
                        <h2 className="text-2xl font-bold text-main">
                            {t('whatsNew.title')} <span className="text-primary">v{version}</span>
                        </h2>
                        <p className="text-secondary text-sm">
                            {t('whatsNew.subtitle')}
                        </p>
                    </div>

                    {/* Features List */}
                    <div className="space-y-4">
                        {features.map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-4 p-4 bg-surface/50 border border-outline/50 rounded-2xl hover:bg-surface transition-colors">
                                <div className="p-2 bg-primary/10 rounded-xl shrink-0">
                                    {feature.icon}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-main text-sm mb-1">{t(feature.titleKey)}</h3>
                                    <p className="text-xs text-secondary leading-relaxed">{t(feature.descKey)}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Action */}
                    <button
                        onClick={onClose}
                        className="w-full bg-primary hover:bg-primary-container text-main py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 flex items-center justify-center gap-2 group"
                    >
                        {t('whatsNew.button')}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
}
