import React from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'

function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r)
        },
        onRegisterError(error) {
            console.log('SW registration error', error)
        },
    })

    const close = () => {
        setOfflineReady(false)
        setNeedRefresh(false)
    }

    // Don't show "Offline Ready" message, it's unnecessary noise.
    // Only show if a refresh is explicitly needed (which shouldn't happen often with autoUpdate)
    if (offlineReady) return null;
    if (!needRefresh) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 animate-in slide-in-from-bottom-5 duration-300">
            <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700 p-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-sm">
                <div className="flex-1">
                    <h3 className="text-sm font-bold text-slate-200 mb-1">
                        {offlineReady ? 'App lista para usar offline' : 'Nueva versión disponible'}
                    </h3>
                    <p className="text-xs text-slate-400">
                        {offlineReady
                            ? 'La aplicación funcionará sin conexión.'
                            : 'Haz clic en actualizar para ver los cambios.'}
                    </p>
                </div>

                {needRefresh && (
                    <button
                        className="bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
                        onClick={() => updateServiceWorker(true)}
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                )}

                <button
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                    onClick={close}
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    )
}

export default ReloadPrompt
