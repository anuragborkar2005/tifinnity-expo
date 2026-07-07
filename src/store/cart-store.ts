import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CartItem {
  meal_box_id: string; // mapped from BIGINT in db
  quantity: number;
  name: string;       // Cached metadata for rendering
  price: number;      // Cached metadata for rendering
}

interface CartState {
  kitchenId: string | null;
  items: CartItem[];
  
  // Actions
  addItem: (item: Omit<CartItem, 'quantity'>, kitchenId: string) => { success: boolean; mismatch: boolean };
  removeItem: (meal_box_id: string) => void;
  updateQuantity: (meal_box_id: string, quantity: number) => void;
  clearCart: () => void;
  replaceCart: (item: Omit<CartItem, 'quantity'>, kitchenId: string) => void;
  getItemCount: () => number;
  getCartTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      kitchenId: null,
      items: [],

      addItem: (item, kitchenId) => {
        const state = get();
        
        // Enforce single-kitchen-per-cart
        if (state.kitchenId !== null && state.kitchenId !== kitchenId && state.items.length > 0) {
          return { success: false, mismatch: true };
        }

        const existingItemIndex = state.items.findIndex(
          (i) => i.meal_box_id === item.meal_box_id
        );

        let newItems = [...state.items];
        if (existingItemIndex > -1) {
          newItems[existingItemIndex].quantity += 1;
        } else {
          newItems.push({ ...item, quantity: 1 });
        }

        set({
          kitchenId,
          items: newItems,
        });

        return { success: true, mismatch: false };
      },

      removeItem: (meal_box_id) => {
        const state = get();
        const newItems = state.items.filter((i) => i.meal_box_id !== meal_box_id);
        
        set({
          items: newItems,
          kitchenId: newItems.length === 0 ? null : state.kitchenId,
        });
      },

      updateQuantity: (meal_box_id, quantity) => {
        const state = get();
        if (quantity <= 0) {
          state.removeItem(meal_box_id);
          return;
        }

        const newItems = state.items.map((i) =>
          i.meal_box_id === meal_box_id ? { ...i, quantity } : i
        );

        set({ items: newItems });
      },

      clearCart: () => {
        set({ kitchenId: null, items: [] });
      },

      replaceCart: (item, kitchenId) => {
        set({
          kitchenId,
          items: [{ ...item, quantity: 1 }],
        });
      },

      getItemCount: () => {
        return get().items.reduce((acc, item) => acc + item.quantity, 0);
      },

      getCartTotal: () => {
        return get().items.reduce((acc, item) => acc + item.price * item.quantity, 0);
      },
    }),
    {
      name: 'tifinnity-cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
