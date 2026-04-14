import type { IngredientsResponse, MenuDetail, MenuPayload } from '@/types';
import { apiGet, apiSend } from './client';

export function getMenus() {
  return apiGet<MenuDetail[]>('/api/menus');
}

export function getMenu(id: string | number) {
  return apiGet<MenuDetail>(`/api/menus/${id}`);
}

export function createMenu(payload: MenuPayload) {
  return apiSend<MenuDetail>('/api/menus', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteMenu(id: string | number) {
  await apiSend(`/api/menus/${id}`, { method: 'DELETE' });
}

export function getMenuIngredients(id: string | number) {
  return apiGet<IngredientsResponse>(`/api/menus/${id}/ingredients`);
}

export function toggleIngredientPurchase(menuId: string | number, ingredientKey: string) {
  return apiSend<{ purchased: boolean }>(`/api/menus/${menuId}/ingredients/toggle-purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ingredient_key: ingredientKey }),
  });
}
