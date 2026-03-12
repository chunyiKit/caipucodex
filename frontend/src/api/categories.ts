import { apiGet } from './client';

export function getCategories() {
  return apiGet<string[]>('/api/categories');
}
