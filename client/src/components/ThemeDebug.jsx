import React, { useEffect, useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function ThemeDebug() {
    const [debugInfo, setDebugInfo] = useState({});
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const updateDebug = () => {
            const root = document.documentElement;
            const computed = getComputedStyle(root);
            setDebugInfo({
                classes: root.className,
                bgMain: computed.getPropertyValue('--bg-main'),
                textMain: computed.getPropertyValue('--text-main'),
                primary: computed.getPropertyValue('--primary'),
                theme: localStorage.getItem('theme'),
                mode: localStorage.getItem('mode')
            });
        };

        updateDebug();
        const interval = setInterval(updateDebug, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleCopy = () => {
        const text = JSON.stringify(debugInfo, null, 2);
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed bottom-12 left-2 z-[100] bg-black/90 text-green-400 p-4 rounded-lg font-mono text-xs max-w-sm shadow-2xl border border-green-500/30">
            <div className="flex items-center justify-between border-b border-green-400/30 mb-2 pb-2">
                <h3 className="font-bold text-green-300">Theme Debugger</h3>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2 py-1 bg-green-500/10 hover:bg-green-500/20 rounded border border-green-500/30 transition-all active:scale-95"
                    title="Copy to clipboard"
                >
                    {copied ? (
                        <>
                            <Check size={12} />
                            <span className="font-bold">COPIED</span>
                        </>
                    ) : (
                        <>
                            <Copy size={12} />
                            <span>COPY</span>
                        </>
                    )}
                </button>
            </div>
            <div className="space-y-1.5 select-text">
                <div className="grid grid-cols-[80px_1fr] gap-2">
                    <span className="text-white/70">Classes:</span>
                    <span className="break-all">{debugInfo.classes || 'None'}</span>
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-2">
                    <span className="text-white/70">--bg-main:</span>
                    <span className="break-all">{debugInfo.bgMain || 'Undefined'}</span>
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-2">
                    <span className="text-white/70">--text-main:</span>
                    <span className="break-all">{debugInfo.textMain || 'Undefined'}</span>
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-2">
                    <span className="text-white/70">--primary:</span>
                    <span className="break-all">{debugInfo.primary || 'Undefined'}</span>
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-2">
                    <span className="text-white/70">LS Theme:</span>
                    <span>{debugInfo.theme}</span>
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-2">
                    <span className="text-white/70">LS Mode:</span>
                    <span>{debugInfo.mode}</span>
                </div>
            </div>
        </div>
    );
}
