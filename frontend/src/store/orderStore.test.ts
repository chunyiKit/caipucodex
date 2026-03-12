import { beforeEach, describe, expect, it } from 'vitest';
import { useOrderStore } from './orderStore';

describe('orderStore', () => {
  beforeEach(() => {
    useOrderStore.getState().clear();
  });

  it('adds recipes and merges quantity', () => {
    const recipe = {
      id: 1,
      name: '番茄炒蛋',
      category: '荤菜' as const,
      difficulty: '简单' as const,
      description: '',
      cooking_time: 10,
      image_url: '',
      created_at: '',
      updated_at: '',
    };
    useOrderStore.getState().addRecipe(recipe);
    useOrderStore.getState().addRecipe(recipe);
    expect(useOrderStore.getState().items[0].quantity).toBe(2);
  });
});
