import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#060a12] text-white">
          <div className="max-w-md w-full bg-[#0e1628] border border-amber-500/30 rounded-2xl p-6 text-center shadow-2xl">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4 animate-bounce" />
            <h2 className="text-xl font-bold font-display uppercase tracking-wider mb-2">Произошла ошибка</h2>
            <p className="text-sm text-gray-400 font-mono mb-6">
              {this.state.error?.message || "Что-то пошло не так при загрузке интерфейса."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 rounded-xl bg-amber-500 text-black font-bold uppercase tracking-wider text-xs hover:bg-amber-400 transition-all cursor-pointer"
            >
              Перезагрузить страницу
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
