import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Pizza, Extra } from '../types';

interface CartItem {
  id: string;
  customizationId: string;
  pizza: Pizza;
  size: 'small' | 'medium' | 'large';
  quantity: number;
  price: number;
  removedIngredients: string[];
  extras: Extra[];
  customIngredients: string[];
}

interface CartStore {
  items: CartItem[];
  addItem: (item: { pizza: Pizza; size: 'small' | 'medium' | 'large'; quantity: number; removedIngredients: string[]; extras: Extra[]; customIngredients: string[] }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: ({ pizza, size, quantity, removedIngredients, extras, customIngredients }) => {
        const state = get();
        const basePrice = pizza.unique_price && pizza.unique_price > 0
          ? pizza.unique_price
          : pizza.prices[size];
        const extrasPrice = extras.reduce((sum, extra) => sum + extra.price, 0);
        const totalPrice = basePrice + extrasPrice;

        // Créer un ID unique basé sur la pizza et ses personnalisations
        const customizationId = `${pizza.id}-${size}-${JSON.stringify(removedIngredients.sort())}-${JSON.stringify(extras.sort())}-${JSON.stringify(customIngredients.sort())}`;

        const existingItem = state.items.find(item => item.customizationId === customizationId);

        if (existingItem) {
          // Si l'article existe déjà avec les mêmes personnalisations, augmenter la quantité
          set({
            items: state.items.map(item =>
              item.customizationId === customizationId
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          });
        } else {
          // Sinon, créer un nouvel article
          const newItem: CartItem = {
            id: `${Date.now()}-${Math.random()}`,
            customizationId,
            pizza,
            size,
            quantity,
            price: totalPrice,
            removedIngredients,
            extras,
            customIngredients
          };

          set({
            items: [...state.items, newItem]
          });
        }
      },

      removeItem: (id: string) => {
        set(state => ({
          items: state.items.filter(item => item.id !== id)
        }));
      },

      updateQuantity: (id: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        
        set(state => ({
          items: state.items.map(item =>
            item.id === id ? { ...item, quantity } : item
          )
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotal: () => {
        const state = get();
        return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },

      getItemCount: () => {
        const state = get();
        return state.items.reduce((count, item) => count + item.quantity, 0);
      }
    }),
    {
      name: 'cart-storage',
    }
  )
);