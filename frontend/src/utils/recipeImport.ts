import type { RecipePayload } from '@/types';

const difficultyOptions = new Set<RecipePayload['difficulty']>(['简单', '中等', '困难']);

export const recipeImportExample = JSON.stringify(
  {
    recipes: [
      {
        name: '番茄炒蛋',
        category: '荤菜',
        description: '适合工作日晚餐的家常快手菜。',
        cooking_time: 15,
        difficulty: '简单',
        ingredients: [
          { name: '番茄', amount: '2个' },
          { name: '鸡蛋', amount: '3个' },
          { name: '盐', amount: '2克' },
          '食用油 1汤匙',
        ],
        cooking_steps: ['番茄切块，鸡蛋打散。', '先炒鸡蛋盛出，再炒番茄出汁。', '倒回鸡蛋翻炒均匀后调味出锅。'],
      },
    ],
  },
  null,
  2,
);

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readRecipeList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (isObject(value) && Array.isArray(value.recipes)) return value.recipes;
  throw new Error('JSON 顶层必须是菜谱数组，或形如 { "recipes": [...] } 的对象');
}

function readRequiredText(value: unknown, fieldName: string, recipeLabel: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${recipeLabel} 的 ${fieldName} 不能为空`);
  }
  return value.trim();
}

function readOptionalText(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    throw new Error('可选文本字段必须是字符串');
  }
  const normalized = value.trim();
  return normalized || null;
}

function readOptionalNumber(value: unknown, fieldName: string, recipeLabel: string): number | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value);
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) return Math.round(parsed);
  }
  throw new Error(`${recipeLabel} 的 ${fieldName} 必须是数字`);
}

function readDifficulty(value: unknown): RecipePayload['difficulty'] {
  if (value === undefined || value === null || value === '') return '中等';
  if (typeof value === 'string' && difficultyOptions.has(value as RecipePayload['difficulty'])) {
    return value as RecipePayload['difficulty'];
  }
  throw new Error('difficulty 只能是 简单 / 中等 / 困难');
}

function normalizeIngredient(value: unknown, index: number, recipeLabel: string): RecipePayload['ingredients'][number] {
  if (typeof value === 'string' && value.trim()) {
    return { name: value.trim(), amount: '', sort_order: index };
  }
  if (!isObject(value)) {
    throw new Error(`${recipeLabel} 的第 ${index + 1} 个食材格式不正确`);
  }
  return {
    name: readRequiredText(value.name, 'ingredients.name', recipeLabel),
    amount: readOptionalText(value.amount) ?? '',
    sort_order: index,
  };
}

function normalizeStep(value: unknown, index: number, recipeLabel: string): RecipePayload['cooking_steps'][number] {
  if (typeof value === 'string' && value.trim()) {
    return { description: value.trim(), image_url: '', sort_order: index };
  }
  if (!isObject(value)) {
    throw new Error(`${recipeLabel} 的第 ${index + 1} 个步骤格式不正确`);
  }
  return {
    description: readRequiredText(value.description, 'cooking_steps.description', recipeLabel),
    image_url: readOptionalText(value.image_url) ?? '',
    sort_order: index,
  };
}

function normalizeRecipe(value: unknown, index: number): RecipePayload {
  if (!isObject(value)) {
    throw new Error(`第 ${index + 1} 个菜谱必须是对象`);
  }

  const recipeLabel = `第 ${index + 1} 个菜谱`;
  const ingredientsSource = value.ingredients;
  const stepsSource = value.cooking_steps ?? value.steps;

  if (!Array.isArray(ingredientsSource) || ingredientsSource.length === 0) {
    throw new Error(`${recipeLabel} 至少要有一个 ingredients 项`);
  }
  if (!Array.isArray(stepsSource) || stepsSource.length === 0) {
    throw new Error(`${recipeLabel} 至少要有一个 cooking_steps 项`);
  }

  return {
    name: readRequiredText(value.name, 'name', recipeLabel),
    category: readRequiredText(value.category, 'category', recipeLabel),
    description: readOptionalText(value.description) ?? '',
    cooking_time: readOptionalNumber(value.cooking_time, 'cooking_time', recipeLabel),
    kcal: readOptionalNumber(value.kcal, 'kcal', recipeLabel),
    difficulty: readDifficulty(value.difficulty),
    image_url: readOptionalText(value.image_url) ?? '',
    ingredients: ingredientsSource.map((item, itemIndex) => normalizeIngredient(item, itemIndex, recipeLabel)),
    cooking_steps: stepsSource.map((item, itemIndex) => normalizeStep(item, itemIndex, recipeLabel)),
  };
}

export function parseRecipeImportText(text: string): RecipePayload[] {
  if (!text.trim()) {
    throw new Error('请先粘贴 JSON 内容');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('JSON 解析失败，请检查逗号、引号和括号是否完整');
  }

  const recipes = readRecipeList(parsed).map((item, index) => normalizeRecipe(item, index));
  if (!recipes.length) {
    throw new Error('至少需要导入一个菜谱');
  }
  return recipes;
}
