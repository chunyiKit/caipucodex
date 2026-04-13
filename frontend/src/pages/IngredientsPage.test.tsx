import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/components/ToastProvider';
import { IngredientsPage } from './IngredientsPage';

const getMenuIngredients = vi.fn();
const updateMenuIngredientPurchases = vi.fn();
let purchasedKeys: string[] = [];

vi.mock('@/api/menus', () => ({
  getMenuIngredients: (...args: unknown[]) => getMenuIngredients(...args),
  updateMenuIngredientPurchases: (...args: unknown[]) => updateMenuIngredientPurchases(...args),
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
      <MemoryRouter initialEntries={['/menus/42/ingredients']}>
        <ToastProvider>
          <Routes>
            <Route path="/menus/:id/ingredients" element={<IngredientsPage />} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('IngredientsPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    purchasedKeys = [];
    getMenuIngredients.mockReset();
    updateMenuIngredientPurchases.mockReset();
    getMenuIngredients.mockImplementation(async () => ({
      menu_id: 42,
      total_count: 1,
      groups: [
        {
          category: '蔬菜',
          items: [{ key: '蔬菜::土豆', name: '土豆', amount: '500g', purchased: purchasedKeys.includes('蔬菜::土豆') }],
        },
      ],
    }));
    updateMenuIngredientPurchases.mockImplementation(async (_id: string | number, nextPurchasedKeys: string[]) => {
      purchasedKeys = nextPurchasedKeys;
      return { menu_id: 42, purchased_keys: nextPurchasedKeys };
    });
  });

  it('persists purchased state after reopening the checklist', async () => {
    const user = userEvent.setup();
    const firstView = renderPage();

    const firstButton = await screen.findByRole('button', { name: /土豆/i });
    await user.click(firstButton);

    await waitFor(() => expect(firstButton).toHaveClass('is-purchased'));
    await waitFor(() => expect(updateMenuIngredientPurchases).toHaveBeenCalledWith('42', ['蔬菜::土豆']));
    expect(window.localStorage.getItem('menu-ingredients-purchased:42')).toContain('"蔬菜::土豆":true');

    firstView.unmount();

    renderPage();

    const reopenedButton = await screen.findByRole('button', { name: /土豆/i });
    expect(reopenedButton).toHaveClass('is-purchased');
  });
});
