import React from 'react';
import { X, Minus, Plus, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import { useAuth } from '../hooks/useAuth';
import { usePizzeriaSettings } from '../hooks/usePizzeriaSettings';
import { ordersService } from '../services/firebaseService';
import type { OrderItem } from '../types';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose }) => {
  const { items, updateQuantity, removeItem, getTotal, clearCart } = useCartStore();
  const { user } = useAuth();
  const { settings } = usePizzeriaSettings();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleCheckout = async () => {
    if (!user) {
      alert('⚠️ Precisa fazer login para fazer um pedido!');
      onClose();
      navigate('/auth');
      return;
    }

    try {
      const orderItems: OrderItem[] = items.map(item => ({
        pizza_id: item.pizza.id,
        pizza_name: item.pizza.name,
        pizza_category: item.pizza.category,
        size: item.size,
        quantity: item.quantity,
        price: item.price,
        removed_ingredients: item.removedIngredients,
        extras: item.extras,
        custom_ingredients: item.customIngredients
      }));

      const orderData = {
        user_id: user.id,
        user: {
          full_name: user.full_name,
          phone: user.phone,
          address: user.address,
          email: user.email
        },
        pickup_address: settings.address,
        items: orderItems,
        total: getTotal(),
        status: 'en_attente' as const
      };

      await ordersService.createOrder(orderData);

      clearCart();
      onClose();
      navigate('/mes-commandes');
    } catch (error) {
      console.error('Erreur lors de la commande:', error);
      alert(`Erro ao fazer o pedido: ${(error as any).message || 'Tente novamente.'}`);
    }
  };

  const formatCustomizations = (item: any) => {
    const customizations = [];

    if (item.removedIngredients && item.removedIngredients.length > 0) {
      customizations.push(
        <div key="removed" className="text-red-600 text-sm">
          🚫 Sem: {item.removedIngredients.join(', ')}
        </div>
      );
    }

    if (item.extras && item.extras.length > 0) {
      customizations.push(
        <div key="extras" className="text-green-600 text-sm">
          ➕ Extras: {item.extras.map((extra: any) => `${extra.name} (+${extra.price}€)`).join(', ')}
        </div>
      );
    }

    if (item.customIngredients && item.customIngredients.length > 0) {
      customizations.push(
        <div key="custom" className="text-blue-600 text-sm font-medium">
          ✨ Ingredientes Extra: {item.customIngredients.join(', ')}
        </div>
      );
    }

    return customizations;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-lg sm:rounded-lg max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" />
            O Meu Carrinho
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors touch-manipulation"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 sm:p-6">
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">O seu carrinho está vazio</p>
              <p className="text-sm">Adicione produtos deliciosos!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                ⚠️ Atenção: Se você se desconectar, o carrinho será apagado automaticamente.
              </div>
              {items.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row items-start gap-4 p-4 border rounded-lg">
                  <img
                    src={item.pizza.image_url}
                    alt={item.pizza.name}
                    className="w-full sm:w-16 h-32 sm:h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-base sm:text-lg">{item.pizza.name}</h3>
                    {item.size && item.size.toLowerCase() !== 'unique' && (
                      <p className="text-gray-600 text-sm">Tamanho: {item.size}</p>
                    )}
                    {item.pizza.category && (
                      <p className="text-amber-600 text-sm font-medium">📂 {item.pizza.category}</p>
                    )}

                    {/* Affichage des personnalisations */}
                    <div className="space-y-2 mb-4 mt-2">
                      {formatCustomizations(item)}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors touch-manipulation"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-semibold px-4 py-2 bg-gray-100 rounded text-lg min-w-[3rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors touch-manipulation"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg sm:text-xl">
                          {(item.price * item.quantity).toFixed(2)}€
                        </p>
                        <p className="text-sm text-gray-600">
                          {item.quantity} × {item.price.toFixed(2)}€
                        </p>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700 text-sm transition-colors touch-manipulation mt-1"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t p-4 sm:p-6 flex-shrink-0 bg-white">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg sm:text-xl font-bold">Total:</span>
              <span className="text-2xl sm:text-3xl font-bold text-accent-600">
                {getTotal().toFixed(2)}€
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={clearCart}
                className="flex-1 px-4 py-3 sm:px-6 sm:py-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors font-medium touch-manipulation"
              >
                Esvaziar carrinho
              </button>
              <button
                onClick={handleCheckout}
                className="flex-1 px-4 py-3 sm:px-6 sm:py-4 bg-accent-600 text-white rounded-lg hover:bg-accent-700 active:bg-accent-800 transition-colors font-semibold text-base sm:text-lg touch-manipulation"
              >
                Encomendar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};