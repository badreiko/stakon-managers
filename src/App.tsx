import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';

// Theme and i18n
import ThemeProvider from './theme/ThemeProvider';
import './i18n/i18n';

// Auth Provider
import AuthProvider from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Layout
import Layout from './components/layout/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Projects from './pages/Projects';
import Team from './pages/Team';
import LoginForm from './components/auth/LoginForm';
import ForgotPasswordForm from './components/auth/ForgotPasswordForm';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SnackbarProvider maxSnack={3}>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginForm />} />
                <Route path="/forgot-password" element={<ForgotPasswordForm />} />
                
                {/* Protected routes */}
                <Route path="/" element={<ProtectedRoute />}>
                  <Route element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="tasks/*" element={<Tasks />} />
                    <Route path="projects" element={<Projects />} />
                    <Route path="team" element={<Team />} />
                    <Route path="reports" element={<div>Reports Page</div>} />
                    <Route path="settings" element={<div>Settings Page</div>} />
                  </Route>
                </Route>
                
                {/* Admin-only routes */}
                <Route path="admin" element={<ProtectedRoute requireAdmin={true} />}>
                  <Route element={<Layout />}>
                    <Route index element={<div>Admin Page</div>} />
                  </Route>
                </Route>
                
                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
