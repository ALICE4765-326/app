import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Utensils, User, LogOut, ShoppingBag } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { CartButton } from './CartButton';
import { usePizzeriaSettings } from '../hooks/usePizzeriaSettings';
import toast from 'react-hot-toast';

interface NavbarProps {
  onCartClick: () => void;
}

export function Navbar({ onCartClick }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { settings } = usePizzeriaSettings();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Sessão terminada com sucesso');
      navigate('/auth');
    } catch (error: any) {
      console.error('Erreur lors de la déconnexion:', error);
      toast.error(error.message || 'Erro ao terminar sessão');
    }
  };

  return (
    <nav className="bg-primary-800 text-white sticky top-0 z-40 shadow-md">
      <div className="w-full px-4">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <Link to="/" className="flex items-center space-x-2">
            {settings.logo_url ? (
              <img
                src={settings.logo_url}
                alt={settings.name}
                className="h-7 w-7 sm:h-8 sm:w-8 object-contain"
              />
            ) : (
              <Utensils className="h-7 w-7 sm:h-8 sm:w-8 text-accent-400" />
            )}
            <span className="font-bold text-lg sm:text-xl truncate max-w-[150px] sm:max-w-none">{settings.name}</span>
          </Link>

          {/* Desktop & Tablet Menu */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-6">
            <Link to="/menu" className="hover:text-accent-400 transition text-sm lg:text-base">Menu</Link>
            {user ? (
              <>
                <Link to="/profile" className="hover:text-accent-400 transition" title="Perfil">
                  <User className="h-5 w-5" />
                </Link>
                {user.selectedSpace === 'client' && (
                  <>
                    <Link to="/mes-commandes" className="hover:text-accent-400 transition flex items-center space-x-1" title="Os meus pedidos">
                      <ShoppingBag className="h-5 w-5" />
                      <span className="hidden lg:inline text-sm lg:text-base">Pedidos</span>
                    </Link>
                    <CartButton onClick={onCartClick} />
                  </>
                )}
                {user.selectedSpace === 'admin' && (
                  <Link to="/admin" className="hover:text-accent-400 transition text-sm lg:text-base">
                    Admin
                  </Link>
                )}
                {user.selectedSpace === 'pizzeria' && (
                  <Link to="/pizzeria" className="hover:text-accent-400 transition text-sm lg:text-base">
                    Espaço Gestão
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="flex items-center hover:text-accent-400 transition"
                  title="Terminar sessão"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="hidden lg:inline ml-1 text-sm lg:text-base">Sair</span>
                </button>
              </>
            ) : (
              <Link to="/auth" className="hover:text-accent-400 transition text-sm lg:text-base">Iniciar sessão</Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-2 md:hidden">
            {user?.selectedSpace === 'client' && <CartButton onClick={onCartClick} />}
            <button
              className="md:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4">
            <Link
              to="/menu"
              className="block py-2 hover:text-accent-400 transition"
              onClick={() => setIsOpen(false)}
            >
              Menu
            </Link>
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="block py-2 hover:text-accent-400 transition"
                  onClick={() => setIsOpen(false)}
                >
                  Perfil
                </Link>
                {user.selectedSpace === 'client' && (
                  <>
                    <Link
                      to="/mes-commandes"
                      className="block py-2 hover:text-accent-400 transition"
                      onClick={() => setIsOpen(false)}
                    >
                      Os meus pedidos
                    </Link>
                    <div
                      className="block py-2"
                      onClick={() => {
                        setIsOpen(false);
                        onCartClick();
                      }}
                    >
                      <CartButton />
                    </div>
                  </>
                )}
                {user.selectedSpace === 'admin' && (
                  <Link
                    to="/admin"
                    className="block py-2 hover:text-accent-400 transition"
                    onClick={() => setIsOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                {user.selectedSpace === 'pizzeria' && (
                  <Link
                    to="/pizzeria"
                    className="block py-2 hover:text-accent-400 transition"
                    onClick={() => setIsOpen(false)}
                  >
                    Espaço Gestão
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsOpen(false);
                  }}
                  className="block w-full text-left py-2 hover:text-accent-400 transition"
                >
                  Terminar sessão
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="block py-2 hover:text-accent-400 transition"
                onClick={() => setIsOpen(false)}
              >
                Iniciar sessão
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}