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
                <div className="min-h-screen bg-slate-950 text-white p-8 flex flex-col items-center justify-center">
                    <h1 className="text-3xl font-bold text-rose-500 mb-4">Algo salió mal</h1>
                    <div className="bg-slate-900 p-6 rounded-lg max-w-2xl w-full overflow-auto border border-slate-800">
                        <h2 className="text-xl font-semibold mb-2 text-rose-400">Error:</h2>
                        <pre className="text-sm text-slate-300 whitespace-pre-wrap mb-4">
                            {this.state.error && this.state.error.toString()}
                        </pre>
                        <h2 className="text-xl font-semibold mb-2 text-indigo-400">Component Stack:</h2>
                        <pre className="text-xs text-slate-500 whitespace-pre-wrap">
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </pre>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-8 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
                    >
                        Recargar Página
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
