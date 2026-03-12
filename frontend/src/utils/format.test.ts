import { describe, expect, it } from 'vitest';
import { buildIngredientsClipboardText } from './format';

describe('buildIngredientsClipboardText', () => {
  it('formats grouped ingredients', () => {
    const text = buildIngredientsClipboardText([
      { category: '蔬菜类', items: [{ name: '土豆', amount: '500g' }] },
    ]);
    expect(text).toContain('蔬菜类');
    expect(text).toContain('土豆 500g');
  });
});
