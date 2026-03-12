import { create } from 'zustand';
import type { MenuItem, MenuPayload, RecipeCard } from '@/types';

interface MenuDraftState {
  draft: MenuPayload | null;
  setDraft: (draft: MenuPayload) => void;
  removeItem: (name: string) => void;
  addRecipe: (recipe: RecipeCard) => void;
  clear: () => void;
}

function resequence(items: MenuItem[]) {
  return items.map((item, index) => ({ ...item, sort_order: index }));
}

export const useMenuDraftStore = create<MenuDraftState>((set) => ({
  draft: null,
  setDraft: (draft) => set({ draft: { ...draft, items: resequence(draft.items) } }),
  removeItem: (name) =>
    set((state) =>
      state.draft
        ? { draft: { ...state.draft, items: resequence(state.draft.items.filter((item) => item.recipe_name !== name)) } }
        : state,
    ),
  addRecipe: (recipe) =>
    set((state) => {
      if (!state.draft) return state;
      const exists = state.draft.items.some((item) => item.recipe_id === recipe.id);
      if (exists) return state;
      return {
        draft: {
          ...state.draft,
          items: resequence([
            ...state.draft.items,
            {
              recipe_id: recipe.id,
              recipe_name: recipe.name,
              recipe_category: recipe.category,
              image_url: recipe.image_url,
              cooking_time: recipe.cooking_time,
              quantity: 1,
              sort_order: state.draft.items.length,
            },
          ]),
        },
      };
    }),
  clear: () => set({ draft: null }),
}));
