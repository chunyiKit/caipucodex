import { create } from 'zustand';
import type { MenuItem, RecipeCard } from '@/types';

interface OrderState {
  items: MenuItem[];
  addRecipe: (recipe: RecipeCard) => void;
  updateQuantity: (recipeId: number, delta: number) => void;
  removeRecipe: (recipeId: number) => void;
  clear: () => void;
}

function normalize(items: MenuItem[]) {
  return items
    .filter((item) => item.quantity > 0)
    .map((item, index) => ({ ...item, sort_order: index }));
}

export const useOrderStore = create<OrderState>((set) => ({
  items: [],
  addRecipe: (recipe) =>
    set((state) => {
      const existing = state.items.find((item) => item.recipe_id === recipe.id);
      if (existing) {
        return {
          items: normalize(
            state.items.map((item) =>
              item.recipe_id === recipe.id ? { ...item, quantity: item.quantity + 1 } : item,
            ),
          ),
        };
      }
      return {
        items: normalize([
          ...state.items,
          {
            recipe_id: recipe.id,
            recipe_name: recipe.name,
            recipe_category: recipe.category,
            image_url: recipe.image_url,
            cooking_time: recipe.cooking_time,
            quantity: 1,
            sort_order: state.items.length,
          },
        ]),
      };
    }),
  updateQuantity: (recipeId, delta) =>
    set((state) => ({
      items: normalize(
        state.items.map((item) =>
          item.recipe_id === recipeId ? { ...item, quantity: item.quantity + delta } : item,
        ),
      ),
    })),
  removeRecipe: (recipeId) => set((state) => ({ items: normalize(state.items.filter((item) => item.recipe_id !== recipeId)) })),
  clear: () => set({ items: [] }),
}));
