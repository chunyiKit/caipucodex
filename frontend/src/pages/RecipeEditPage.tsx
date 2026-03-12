import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { createRecipe, getRecipe, updateRecipe, uploadRecipeImage } from '@/api/recipes';
import { ActionSheet } from '@/components/ActionSheet';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { useToast } from '@/components/ToastProvider';
import { realCategories } from '@/constants/categories';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import type { CookingStep, Ingredient, RecipePayload } from '@/types';
import { compressImage } from '@/utils/image';

const defaultPayload: RecipePayload = {
  name: '',
  category: '荤菜',
  description: '',
  cooking_time: 20,
  difficulty: '中等',
  image_url: '',
  ingredients: [{ name: '', amount: '', sort_order: 0 }],
  cooking_steps: [{ description: '', image_url: '', sort_order: 0 }],
};

type PendingRemove =
  | { type: 'ingredient'; index: number; label: string }
  | { type: 'step'; index: number; label: string }
  | null;

export function RecipeEditPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { isDesktop } = useBreakpoint();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [form, setForm] = useState<RecipePayload>(defaultPayload);
  const [uploading, setUploading] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<PendingRemove>(null);

  const query = useQuery({ queryKey: ['recipe', id], queryFn: () => getRecipe(id!), enabled: isEdit });

  useEffect(() => {
    if (query.data) {
      setForm({
        name: query.data.name,
        category: query.data.category,
        description: query.data.description || '',
        cooking_time: query.data.cooking_time || 20,
        difficulty: query.data.difficulty,
        image_url: query.data.image_url || '',
        ingredients: query.data.ingredients.length ? query.data.ingredients : [{ name: '', amount: '', sort_order: 0 }],
        cooking_steps: query.data.cooking_steps.length
          ? query.data.cooking_steps.map((item, index) => ({ ...item, sort_order: index }))
          : [{ description: '', image_url: '', sort_order: 0 }],
      });
    }
  }, [query.data]);

  const isValid = useMemo(
    () => Boolean(form.name.trim() && form.category && form.ingredients.every((item) => item.name.trim()) && form.cooking_steps.every((step) => step.description.trim())),
    [form],
  );

  const mutation = useMutation({
    mutationFn: (payload: RecipePayload) => (isEdit ? updateRecipe(id!, payload) : createRecipe(payload)),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['recipes'] });
      await queryClient.invalidateQueries({ queryKey: ['recipe', id] });
      showToast(isEdit ? '菜谱已更新' : '菜谱已创建');
      navigate(`/recipes/${response.id}`);
    },
    onError: (error) => showToast(error instanceof Error ? error.message : '保存失败', 'error'),
  });

  const updateIngredient = (index: number, key: keyof Ingredient, value: string) => {
    setForm((current) => ({ ...current, ingredients: current.ingredients.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)) }));
  };

  const updateStep = (index: number, key: keyof CookingStep, value: string) => {
    setForm((current) => ({ ...current, cooking_steps: current.cooking_steps.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)) }));
  };

  const reorder = <T,>(items: T[], index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return items;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(nextIndex, 0, moved);
    return next.map((item, itemIndex) => ({ ...item, sort_order: itemIndex }));
  };

  const requestRemoveIngredient = (index: number) => {
    const ingredient = form.ingredients[index];
    const label = ingredient?.name?.trim() || `第 ${index + 1} 个食材`;
    setPendingRemove({ type: 'ingredient', index, label });
  };

  const requestRemoveStep = (index: number) => {
    const step = form.cooking_steps[index];
    const label = step?.description?.trim() || `第 ${index + 1} 步`;
    setPendingRemove({ type: 'step', index, label });
  };

  const confirmRemove = () => {
    if (!pendingRemove) return;
    if (pendingRemove.type === 'ingredient') {
      setForm((current) => ({ ...current, ingredients: current.ingredients.filter((_, itemIndex) => itemIndex !== pendingRemove.index).map((item, itemIndex) => ({ ...item, sort_order: itemIndex })) }));
      showToast('已移除食材项');
    }
    if (pendingRemove.type === 'step') {
      setForm((current) => ({ ...current, cooking_steps: current.cooking_steps.filter((_, itemIndex) => itemIndex !== pendingRemove.index).map((item, itemIndex) => ({ ...item, sort_order: itemIndex })) }));
      showToast('已移除步骤');
    }
    setPendingRemove(null);
  };

  return (
    <Screen className={isDesktop ? 'recipe-edit-page recipe-edit-page--desktop' : 'recipe-edit-page'}>
      <TopBar
        title={isEdit ? '编辑菜谱' : '新建菜谱'}
        right={<button className="ghost-link" type="button" onClick={() => mutation.mutate(form)} disabled={!isValid || mutation.isPending}>{mutation.isPending ? '保存中' : '保存'}</button>}
      />
      <div className={isDesktop ? 'recipe-edit-layout' : ''}>
        <div className="recipe-edit-layout__base">
          <div className="form-card">
            <label className="field-label">封面图</label>
            <label className="upload-box">
              {form.image_url ? <img src={form.image_url.startsWith('/uploads') ? `${import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'}${form.image_url}` : form.image_url} alt="封面" /> : <span>{uploading ? '上传中...' : '点击上传封面'}</span>}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  try {
                    setUploading(true);
                    const compressed = await compressImage(file);
                    const response = await uploadRecipeImage(compressed);
                    setForm((current) => ({ ...current, image_url: response.url }));
                    showToast('图片上传成功');
                  } catch (error) {
                    showToast(error instanceof Error ? error.message : '图片上传失败', 'error');
                  } finally {
                    setUploading(false);
                  }
                }}
              />
            </label>
          </div>

          <div className="form-card">
            <label className="field-label">菜名</label>
            <input className="text-input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="例如：番茄炒蛋" />
            <label className="field-label">分类</label>
            <div className="pill-row">
              {realCategories.map((category) => (
                <button key={category} type="button" className={`pill-toggle ${form.category === category ? 'is-active' : ''}`} onClick={() => setForm({ ...form, category })}>{category}</button>
              ))}
            </div>
            <label className="field-label">烹饪时间</label>
            <input className="text-input" type="number" min={1} value={form.cooking_time || ''} onChange={(event) => setForm({ ...form, cooking_time: Number(event.target.value) || 0 })} />
            <label className="field-label">难度</label>
            <div className="segmented-control">
              {['简单', '中等', '困难'].map((difficulty) => (
                <button type="button" key={difficulty} className={form.difficulty === difficulty ? 'is-active' : ''} onClick={() => setForm({ ...form, difficulty: difficulty as RecipePayload['difficulty'] })}>{difficulty}</button>
              ))}
            </div>
            <label className="field-label">描述</label>
            <textarea className="text-area" value={form.description || ''} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="写下这道菜的故事..." />
          </div>
        </div>

        <div className="recipe-edit-layout__ingredients form-card">
          <div className="section-title"><h2>食材</h2></div>
          {form.ingredients.map((ingredient, index) => (
            <div key={`ingredient-${index}`} className="nested-form-row">
              <input className="text-input" placeholder="食材名" value={ingredient.name} onChange={(event) => updateIngredient(index, 'name', event.target.value)} />
              <input className="text-input" placeholder="用量" value={ingredient.amount || ''} onChange={(event) => updateIngredient(index, 'amount', event.target.value)} />
              <div className="row-actions">
                <button type="button" className="ghost-button small" onClick={() => setForm((current) => ({ ...current, ingredients: reorder(current.ingredients, index, -1) }))}>↑</button>
                <button type="button" className="ghost-button small" onClick={() => setForm((current) => ({ ...current, ingredients: reorder(current.ingredients, index, 1) }))}>↓</button>
                <button type="button" className="ghost-button small" onClick={() => requestRemoveIngredient(index)} disabled={form.ingredients.length === 1}>移除</button>
              </div>
            </div>
          ))}
          <button type="button" className="ghost-link" onClick={() => setForm((current) => ({ ...current, ingredients: [...current.ingredients, { name: '', amount: '', sort_order: current.ingredients.length }] }))}>+ 添加食材</button>
        </div>

        <div className="recipe-edit-layout__steps form-card">
          <div className="section-title"><h2>步骤</h2></div>
          {form.cooking_steps.map((step, index) => (
            <div key={`step-${index}`} className="step-editor">
              <div className="step-index">{index + 1}</div>
              <textarea className="text-area" placeholder="描述步骤" value={step.description} onChange={(event) => updateStep(index, 'description', event.target.value)} />
              <div className="row-actions">
                <button type="button" className="ghost-button small" onClick={() => setForm((current) => ({ ...current, cooking_steps: reorder(current.cooking_steps, index, -1) }))}>上移</button>
                <button type="button" className="ghost-button small" onClick={() => setForm((current) => ({ ...current, cooking_steps: reorder(current.cooking_steps, index, 1) }))}>下移</button>
                <button type="button" className="ghost-button small" onClick={() => requestRemoveStep(index)} disabled={form.cooking_steps.length === 1}>移除</button>
              </div>
            </div>
          ))}
          <button type="button" className="ghost-link" onClick={() => setForm((current) => ({ ...current, cooking_steps: [...current.cooking_steps, { description: '', image_url: '', sort_order: current.cooking_steps.length }] }))}>+ 添加步骤</button>
        </div>
      </div>

      <ActionSheet
        open={Boolean(pendingRemove)}
        title={pendingRemove?.type === 'ingredient' ? '移除这个食材项？' : '移除这个步骤？'}
        description={pendingRemove ? `“${pendingRemove.label}” 会从当前编辑表单里移除，确认后仍可手动重新添加。` : ''}
        confirmLabel={pendingRemove?.type === 'ingredient' ? '确认移除食材' : '确认移除步骤'}
        confirmTone="accent"
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemove(null)}
      />
    </Screen>
  );
}
