import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import './index.css';

import { AuthProvider } from './providers/AuthProvider';
import { DebugProvider } from './providers/DebugProvider';
import { App } from './routes/App';
import { AppErrorBoundary } from './components/AppErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DebugProvider>
      <AppErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </AppErrorBoundary>
    </DebugProvider>
  </React.StrictMode>
);

