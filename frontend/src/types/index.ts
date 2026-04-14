export type Category = string;

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
  category: string;
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

export interface RecipeListResponse {
  items: RecipeCard[];
  total: number;
}

export interface RecipePayload {
  name: string;
  category: string;
  description?: string | null;
  cooking_time?: number | null;
  kcal?: number | null;
  difficulty: '简单' | '中等' | '困难';
  image_url?: string | null;
  ingredients: Ingredient[];
  cooking_steps: CookingStep[];
}

export interface MenuItem {
  id?: number;
  recipe_id?: number | null;
  recipe_name: string;
  recipe_category: string;
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
  is_ai_generated: boolean;
  created_at: string;
  ai_preferences?: Record<string, unknown> | null;
  items: MenuItem[];
}

export interface MenuPayload {
  title?: string | null;
  menu_date: string;
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
  dishes: {
    recipe_id: number;
    name: string;
    category: string;
    reason: string;
  }[];
}

export interface FamilyMemberBodyReport {
  measured_at?: string | null;
  source_device?: string | null;
  source_image_url?: string | null;
  body_type?: string | null;
  score?: number | null;
  advice?: string | null;
  weight_jin?: number | null;
  weight_delta_jin?: number | null;
  bmi?: number | null;
  bmi_delta?: number | null;
  bmi_status?: string | null;
  body_fat_pct?: number | null;
  body_fat_delta?: number | null;
  body_fat_status?: string | null;
  water_mass_jin?: number | null;
  fat_mass_jin?: number | null;
  protein_mass_jin?: number | null;
  bone_mass_jin?: number | null;
  muscle_mass_jin?: number | null;
  muscle_mass_status?: string | null;
  muscle_rate_pct?: number | null;
  muscle_rate_delta?: number | null;
  muscle_rate_status?: string | null;
  body_water_pct?: number | null;
  body_water_delta?: number | null;
  body_water_status?: string | null;
  protein_pct?: number | null;
  protein_delta?: number | null;
  protein_status?: string | null;
  salt_pct?: number | null;
  salt_delta?: number | null;
  salt_status?: string | null;
  visceral_fat_level?: number | null;
  visceral_fat_delta?: number | null;
  visceral_fat_status?: string | null;
  bmr_kcal?: number | null;
  bmr_delta?: number | null;
  bmr_status?: string | null;
  waist_hip_ratio?: number | null;
  waist_hip_status?: string | null;
  metabolic_age_years?: number | null;
  fat_free_mass_jin?: number | null;
  fat_free_mass_delta?: number | null;
  standard_weight_jin?: number | null;
  weight_control_jin?: number | null;
  fat_control_jin?: number | null;
  muscle_control?: string | null;
  [key: string]: string | number | null | undefined;
}

export interface FamilyMember {
  id: number;
  name: string;
  height_cm?: number | null;
  avatar_url?: string | null;
  signature?: string | null;
  body_report?: FamilyMemberBodyReport | null;
  created_at: string;
  updated_at: string;
}

export interface FamilyMemberPayload {
  name: string;
  height_cm?: number | null;
  avatar_url?: string | null;
  signature?: string | null;
  body_report?: FamilyMemberBodyReport | null;
}
