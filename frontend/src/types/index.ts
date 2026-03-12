export type Category = '全部' | '荤菜' | '素菜' | '汤类' | '主食' | '凉菜' | '甜点';

export interface Ingredient {
  id?: number;
  name: string;
  amount?: string | null;
  sort_order: number;
}

export interface CookingStep {
  id?: number;
  step_number?: number;
  description: string;
  image_url?: string | null;
  sort_order: number;
}

export interface RecipeCard {
  id: number;
  name: string;
  category: Exclude<Category, '全部'>;
  description?: string | null;
  cooking_time?: number | null;
  difficulty: '简单' | '中等' | '困难';
  image_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecipeDetail extends RecipeCard {
  ingredients: Ingredient[];
  cooking_steps: CookingStep[];
}

export interface RecipePayload {
  name: string;
  category: Exclude<Category, '全部'>;
  description?: string | null;
  cooking_time?: number | null;
  difficulty: '简单' | '中等' | '困难';
  image_url?: string | null;
  ingredients: Ingredient[];
  cooking_steps: CookingStep[];
}

export interface MenuItem {
  id?: number;
  recipe_id?: number | null;
  recipe_name: string;
  recipe_category: Exclude<Category, '全部'>;
  image_url?: string | null;
  cooking_time?: number | null;
  quantity: number;
  ai_reason?: string | null;
  sort_order: number;
}

export interface MenuDetail {
  id: number;
  title?: string | null;
  menu_date: string;
  people_count: number;
  is_ai_generated: boolean;
  created_at: string;
  ai_preferences?: Record<string, unknown> | null;
  items: MenuItem[];
}

export interface MenuPayload {
  title?: string | null;
  menu_date: string;
  people_count: number;
  is_ai_generated: boolean;
  ai_preferences?: Record<string, unknown> | null;
  items: MenuItem[];
}

export interface IngredientGroup {
  category: string;
  items: { name: string; amount?: string | null; purchased?: boolean }[];
}

export interface IngredientsResponse {
  menu_id: number;
  total_count: number;
  groups: IngredientGroup[];
}

export interface AIRecommendResponse {
  people_count: number;
  dishes: {
    recipe_id?: number | null;
    name: string;
    category: Exclude<Category, '全部'>;
    reason: string;
  }[];
}
