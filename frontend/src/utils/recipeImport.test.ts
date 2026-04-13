import { describe, expect, it } from 'vitest';
import { parseRecipeImportText } from './recipeImport';

describe('parseRecipeImportText', () => {
  it('parses recipe objects and applies defaults', () => {
    const recipes = parseRecipeImportText(JSON.stringify({
      recipes: [
        {
          name: '番茄炒蛋',
          category: '荤菜',
          ingredients: ['番茄 2个', { name: '鸡蛋', amount: '3个' }],
          cooking_steps: ['切好食材', { description: '翻炒出锅' }],
        },
      ],
    }));

    expect(recipes).toHaveLength(1);
    expect(recipes[0].difficulty).toBe('中等');
    expect(recipes[0].ingredients[0]).toMatchObject({ name: '番茄 2个', amount: '' });
    expect(recipes[0].cooking_steps[1]).toMatchObject({ description: '翻炒出锅', image_url: '' });
  });

  it('supports array root and steps alias', () => {
    const recipes = parseRecipeImportText(JSON.stringify([
      {
        name: '拍黄瓜',
        category: '凉菜',
        ingredients: [{ name: '黄瓜', amount: '2根' }],
        steps: ['拍碎黄瓜', '拌匀调味'],
      },
    ]));

    expect(recipes[0].cooking_steps).toHaveLength(2);
  });

  it('throws when required fields are missing', () => {
    expect(() =>
      parseRecipeImportText(JSON.stringify([{ name: '缺步骤', category: '素菜', ingredients: ['青菜 300g'] }])),
    ).toThrow(/cooking_steps/);
  });
});
