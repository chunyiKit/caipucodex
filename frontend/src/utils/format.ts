import type { MenuItem } from '@/types';

export function formatDate(input?: string) {
  if (!input) return '';
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date(input));
}

export function formatDateLong(input?: string) {
  if (!input) return '';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date(input));
}

export function groupMenuItems(items: MenuItem[]) {
  return items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    if (!acc[item.recipe_category]) acc[item.recipe_category] = [];
    acc[item.recipe_category].push(item);
    return acc;
  }, {});
}

export function getHistoryGroupLabel(input: string) {
  const today = new Date();
  const date = new Date(input);
  const diff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 7) return '本周';
  if (diff <= 14) return '上周';
  return '更早';
}

export function buildIngredientsClipboardText(groups: { category: string; items: { name: string; amount?: string | null }[] }[]) {
  return groups
    .map((group) => `${group.category}\n${group.items.map((item) => `- ${item.name}${item.amount ? ` ${item.amount}` : ''}`).join('\n')}`)
    .join('\n\n');
}
