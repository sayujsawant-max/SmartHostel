import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import './app.css';
import ErrorBoundary from '@components/ErrorBoundary';
import { ThemeProvider } from '@context/ThemeContext';
import { AuthProvider } from '@context/AuthContext';
import { HostelConfigProvider } from '@context/HostelConfigContext';
import { queryClient } from '@/lib/query-client';
import { reportWebVitals } from '@utils/web-vitals';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <HostelConfigProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </HostelConfigProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);

void reportWebVitals();
