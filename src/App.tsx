import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartModal } from './components/CartModal';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ExpirationBanner } from './components/ExpirationBanner';
import { Home } from './pages/Home';
import { Menu } from './pages/Menu';
import { Auth } from './pages/Auth';
import { Profile } from './pages/Profile';
import MesCommandes from './pages/MesCommandes';
import { Legal } from './pages/Legal';
import { Privacy } from './pages/Privacy';
import { Admin } from './pages/Admin';
import { Pizzeria } from './pages/Pizzeria';
import { isExpired } from './utils/expirationCheck';

function MainContent() {
  const location = useLocation();
  const isAdminOrPizzeria = location.pathname.startsWith('/admin') || location.pathname.startsWith('/pizzeria');

  return (
    <main className={`flex-1 ${isAdminOrPizzeria ? 'w-full' : 'container mx-auto px-4 py-8'}`}>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/contact" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/mes-commandes" element={
          <ProtectedRoute role="client">
            <MesCommandes />
          </ProtectedRoute>
        } />
        <Route path="/legal" element={<Legal />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/admin/*" element={
          <ProtectedRoute role="admin">
            <Admin />
          </ProtectedRoute>
        } />
        <Route path="/pizzeria/*" element={
          <ProtectedRoute role="pizzeria">
            <Pizzeria />
          </ProtectedRoute>
        } />
      </Routes>
    </main>
  );
}

function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { user } = useAuth();
  const expired = user ? isExpired(user.created_at) : false;

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen h-full bg-primary-50 flex flex-col">
        <Toaster position="top-center" />
        {expired && <ExpirationBanner />}
        <Navbar onCartClick={() => setIsCartOpen(true)} />
        {expired ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Acesso Expirado</h2>
              <p className="text-gray-700 mb-2">O período de teste desta aplicação expirou.</p>
              <p className="text-gray-700 font-semibold">Por favor, contacte a Digismart para renovar o acesso.</p>
            </div>
          </div>
        ) : (
          <MainContent />
        )}
        <Footer />
        <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      </div>
    </BrowserRouter>
  );
}

export default App;