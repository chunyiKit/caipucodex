import type { Category } from '@/types';

export const categories: Category[] = ['全部', '荤菜', '素菜', '汤类', '主食', '凉菜', '甜点'];
export const realCategories = categories.filter((item) => item !== '全部') as Exclude<Category, '全部'>[];
export const preferenceOptions = ['清淡', '家常', '麻辣', '鲜甜', '少油', '快手菜', '下饭菜'];
