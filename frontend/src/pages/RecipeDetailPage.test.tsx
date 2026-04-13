import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/components/ToastProvider';
import { RecipeDetailPage } from './RecipeDetailPage';

const getRecipe = vi.fn();
const deleteRecipe = vi.fn();

vi.mock('@/api/recipes', () => ({
  getRecipe: (...args: unknown[]) => getRecipe(...args),
  deleteRecipe: (...args: unknown[]) => deleteRecipe(...args),
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/recipes/18']}>
        <ToastProvider>
          <Routes>
            <Route path="/recipes/:id" element={<RecipeDetailPage />} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('RecipeDetailPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    getRecipe.mockReset();
    deleteRecipe.mockReset();
    deleteRecipe.mockResolvedValue(undefined);
  });

  it('shows recipe kcal when the detail contains calorie data', async () => {
    getRecipe.mockResolvedValue({
      id: 18,
      name: '麻婆豆腐',
      category: '荤菜',
      description: '麻辣鲜香、十分下饭',
      cooking_time: 18,
      kcal: 426,
      difficulty: '中等',
      image_url: null,
      created_at: '2026-03-29T00:00:00Z',
      updated_at: '2026-03-29T00:00:00Z',
      ingredients: [{ name: '豆腐', amount: '1 块', sort_order: 1 }],
      cooking_steps: [{ description: '下锅翻炒。', sort_order: 1 }],
    });

    renderPage();

    expect(await screen.findByRole('heading', { name: '麻婆豆腐' })).toBeInTheDocument();
    expect(screen.getByText('426 Kcal')).toBeInTheDocument();
  });

  it('omits the kcal block when calorie data is missing', async () => {
    getRecipe.mockResolvedValue({
      id: 18,
      name: '清炒时蔬',
      category: '素菜',
      description: '当天鲜蔬随手炒',
      cooking_time: 10,
      kcal: null,
      difficulty: '简单',
      image_url: null,
      created_at: '2026-03-29T00:00:00Z',
      updated_at: '2026-03-29T00:00:00Z',
      ingredients: [{ name: '青菜', amount: '300g', sort_order: 1 }],
      cooking_steps: [{ description: '大火快炒。', sort_order: 1 }],
    });

    renderPage();

    expect(await screen.findByRole('heading', { name: '清炒时蔬' })).toBeInTheDocument();
    expect(screen.queryByText(/Kcal/i)).not.toBeInTheDocument();
  });
});
