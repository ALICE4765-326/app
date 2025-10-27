import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { useAuth } from './hooks/useAuth';
import App from './App.tsx';
import './index.css';

// Initialize auth state
const { initializeAuth } = useAuth.getState();
initializeAuth();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
