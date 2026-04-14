import type { AIRecommendResponse } from '@/types';
import { apiSend } from './client';

export function recommendMenu(payload: { preferences: string[]; diners: number }) {
  return apiSend<AIRecommendResponse>('/api/ai/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function generateCoverImage(payload: { name: string; ingredients: string[] }) {
  return apiSend<{ url: string }>('/api/ai/generate-cover', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
