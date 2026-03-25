import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('Dashboard error boundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b] text-zinc-100 p-6">
          <div className="max-w-md w-full text-center border border-red-500/30 bg-red-500/10 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-red-300">Something went wrong</h2>
            <p className="text-sm text-zinc-300 mt-2">The page crashed while rendering analytics.</p>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white">
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
