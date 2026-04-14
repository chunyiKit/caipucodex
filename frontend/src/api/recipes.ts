import type { RecipeDetail, RecipeListResponse, RecipePayload } from '@/types';
import { apiGet, apiSend } from './client';

export function getRecipes(params?: { category?: string; search?: string; skip?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.search) query.set('search', params.search);
  if (params?.skip != null) query.set('skip', String(params.skip));
  if (params?.limit != null) query.set('limit', String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiGet<RecipeListResponse>(`/api/recipes${suffix}`);
}

export function getRecipe(id: string | number) {
  return apiGet<RecipeDetail>(`/api/recipes/${id}`);
}

export function createRecipe(payload: RecipePayload) {
  return apiSend<RecipeDetail>('/api/recipes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function updateRecipe(id: string | number, payload: RecipePayload) {
  return apiSend<RecipeDetail>(`/api/recipes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteRecipe(id: string | number) {
  await apiSend(`/api/recipes/${id}`, { method: 'DELETE' });
}

export async function uploadRecipeImage(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return apiSend<{ url: string }>('/api/recipes/upload-image', { method: 'POST', body: formData });
}
