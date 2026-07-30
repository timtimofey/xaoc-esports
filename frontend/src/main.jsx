import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './components/AuthContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './index.css';

window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason?.message?.includes('WebSocket') ||
    event.reason?.message?.includes('vite') ||
    String(event.reason).includes('WebSocket')
  ) {
    event.preventDefault();
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
