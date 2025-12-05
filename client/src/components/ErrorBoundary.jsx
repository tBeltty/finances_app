import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-surface text-main p-8 flex flex-col items-center justify-center">
                    <h1 className="text-3xl font-bold text-error mb-4">Algo salió mal</h1>
                    <div className="bg-surface-container p-6 rounded-lg max-w-2xl w-full overflow-auto border border-outline">
                        <h2 className="text-xl font-semibold mb-2 text-error">Error:</h2>
                        <pre className="text-sm text-main whitespace-pre-wrap mb-4">
                            {this.state.error && this.state.error.toString()}
                        </pre>
                        <h2 className="text-xl font-semibold mb-2 text-primary">Component Stack:</h2>
                        <pre className="text-xs text-slate-500 whitespace-pre-wrap">
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </pre>
                    </div>
                    <button
                        onClick={async () => {
                            if ('serviceWorker' in navigator) {
                                const registrations = await navigator.serviceWorker.getRegistrations();
                                for (const registration of registrations) {
                                    await registration.unregister();
                                }
                            }
                            window.location.reload(true);
                        }}
                        className="mt-8 px-6 py-3 bg-primary hover:bg-indigo-700 rounded-lg font-medium transition-colors"
                    >
                        Recargar y Actualizar
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
