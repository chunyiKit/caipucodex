import type { AIRecommendResponse } from '@/types';
import { apiSend } from './client';

export function recommendMenu(payload: { people_count: number; preferences: string[] }) {
  return apiSend<AIRecommendResponse>('/api/ai/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
