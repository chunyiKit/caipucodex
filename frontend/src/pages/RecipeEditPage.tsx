import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowUp, ArrowDown, X, Plus, Upload, Sparkles, Loader2 } from 'lucide-react';
import { generateCoverImage } from '@/api/ai';
import { assetUrl } from '@/api/client';
import { createRecipe, getRecipe, updateRecipe, uploadRecipeImage } from '@/api/recipes';
import { ActionSheet } from '@/components/ActionSheet';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { useToast } from '@/components/ToastProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getCategories } from '@/api/categories';
import { defaultCategories } from '@/constants/categories';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { cn } from '@/lib/utils';
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
  const [generating, setGenerating] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<PendingRemove>(null);

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const realCategories = useMemo(() => (categoriesQuery.data ?? defaultCategories).filter((c) => c !== '全部'), [categoriesQuery.data]);
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
    <Screen>
      <TopBar
        title={isEdit ? '编辑菜谱' : '新建菜谱'}
        right={
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--brand)] font-semibold"
            onClick={() => mutation.mutate(form)}
            disabled={!isValid || mutation.isPending}
          >
            {mutation.isPending ? '保存中' : '保存'}
          </Button>
        }
      />
      <div className={isDesktop ? 'grid grid-cols-[420px_minmax(320px,0.8fr)_minmax(360px,1fr)] gap-6 items-start' : ''}>
        {/* Base info */}
        <div className={isDesktop ? 'flex flex-col gap-4' : ''}>
          <div className="p-5 rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] mb-4 lg:mb-0">
            <Label className="text-sm font-semibold mb-2 block">封面图</Label>
            <label className="flex items-center justify-center min-h-[180px] rounded-xl border-2 border-dashed border-[var(--border-color)] bg-[var(--surface-secondary)] cursor-pointer overflow-hidden hover:border-[var(--brand)] transition-colors">
              {form.image_url ? (
                <img src={assetUrl(form.image_url)} alt="封面" className="w-full h-full object-cover" />
              ) : (
                <span className="flex flex-col items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <Upload size={24} />
                  {uploading ? '上传中...' : '点击上传封面'}
                </span>
              )}
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
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2 rounded-xl gap-1.5 text-[var(--brand)] border-[var(--brand)]/30 hover:bg-[var(--brand)]/5"
              disabled={!form.name.trim() || generating}
              onClick={async () => {
                try {
                  setGenerating(true);
                  const ingredients = form.ingredients.map((i) => i.name).filter(Boolean);
                  const response = await generateCoverImage({ name: form.name, ingredients });
                  setForm((current) => ({ ...current, image_url: response.url }));
                  showToast('AI 封面生成成功');
                } catch (error) {
                  showToast(error instanceof Error ? error.message : 'AI 封面生成失败', 'error');
                } finally {
                  setGenerating(false);
                }
              }}
            >
              {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {generating ? 'AI 生成中...' : 'AI 生成封面'}
            </Button>
          </div>

          <div className="p-5 rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] mb-4 lg:mb-0 space-y-4">
            <div>
              <Label className="text-sm font-semibold mb-2 block">菜名</Label>
              <Input className="h-11 rounded-xl" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="例如：番茄炒蛋" />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-2 block">分类</Label>
              <div className="flex flex-wrap gap-2">
                {realCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={cn(
                      'px-4 py-2 rounded-full text-sm font-medium border transition-colors',
                      form.category === category
                        ? 'bg-[var(--brand)] text-white border-[var(--brand)]'
                        : 'bg-white text-[var(--text-secondary)] border-[var(--border-color)]',
                    )}
                    onClick={() => setForm({ ...form, category })}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold mb-2 block">烹饪时间</Label>
              <Input className="h-11 rounded-xl" type="number" min={1} value={form.cooking_time || ''} onChange={(event) => setForm({ ...form, cooking_time: Number(event.target.value) || 0 })} />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-2 block">难度</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['简单', '中等', '困难'] as const).map((difficulty) => (
                  <button
                    type="button"
                    key={difficulty}
                    className={cn(
                      'py-2.5 rounded-xl text-sm font-medium border transition-colors',
                      form.difficulty === difficulty
                        ? 'bg-[var(--brand)] text-white border-[var(--brand)]'
                        : 'bg-white text-[var(--text-secondary)] border-[var(--border-color)]',
                    )}
                    onClick={() => setForm({ ...form, difficulty: difficulty as RecipePayload['difficulty'] })}
                  >
                    {difficulty}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold mb-2 block">描述</Label>
              <Textarea className="min-h-[120px] rounded-xl resize-y" value={form.description || ''} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="写下这道菜的故事..." />
            </div>
          </div>
        </div>

        {/* Ingredients */}
        <div className="p-5 rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] mb-4 lg:mb-0 lg:self-start">
          <h2 className="m-0 mb-4 text-lg font-semibold">食材</h2>
          {form.ingredients.map((ingredient, index) => (
            <div key={`ingredient-${index}`} className="grid grid-cols-[1fr_100px_auto] gap-2 mb-3 items-center lg:grid-cols-[minmax(0,1fr)_140px_auto]">
              <Input className="h-10 rounded-lg" placeholder="食材名" value={ingredient.name} onChange={(event) => updateIngredient(index, 'name', event.target.value)} />
              <Input className="h-10 rounded-lg" placeholder="用量" value={ingredient.amount || ''} onChange={(event) => updateIngredient(index, 'amount', event.target.value)} />
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" onClick={() => setForm((current) => ({ ...current, ingredients: reorder(current.ingredients, index, -1) }))}><ArrowUp size={14} /></Button>
                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" onClick={() => setForm((current) => ({ ...current, ingredients: reorder(current.ingredients, index, 1) }))}><ArrowDown size={14} /></Button>
                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-[#c13515]" onClick={() => requestRemoveIngredient(index)} disabled={form.ingredients.length === 1}><X size={14} /></Button>
              </div>
            </div>
          ))}
          <Button
            variant="ghost"
            className="text-[var(--brand)] font-medium"
            onClick={() => setForm((current) => ({ ...current, ingredients: [...current.ingredients, { name: '', amount: '', sort_order: current.ingredients.length }] }))}
          >
            <Plus size={14} /> 添加食材
          </Button>
        </div>

        {/* Steps */}
        <div className="p-5 rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] mb-4 lg:mb-0 lg:self-start">
          <h2 className="m-0 mb-4 text-lg font-semibold">步骤</h2>
          {form.cooking_steps.map((step, index) => (
            <div key={`step-${index}`} className="flex gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[var(--brand)] text-white text-sm font-semibold grid place-items-center flex-shrink-0 mt-1">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <Textarea className="min-h-[80px] rounded-lg resize-y mb-2" placeholder="描述步骤" value={step.description} onChange={(event) => updateStep(index, 'description', event.target.value)} />
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => setForm((current) => ({ ...current, cooking_steps: reorder(current.cooking_steps, index, -1) }))}>上移</Button>
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => setForm((current) => ({ ...current, cooking_steps: reorder(current.cooking_steps, index, 1) }))}>下移</Button>
                  <Button variant="ghost" size="sm" className="text-xs text-[#c13515]" onClick={() => requestRemoveStep(index)} disabled={form.cooking_steps.length === 1}>移除</Button>
                </div>
              </div>
            </div>
          ))}
          <Button
            variant="ghost"
            className="text-[var(--brand)] font-medium"
            onClick={() => setForm((current) => ({ ...current, cooking_steps: [...current.cooking_steps, { description: '', image_url: '', sort_order: current.cooking_steps.length }] }))}
          >
            <Plus size={14} /> 添加步骤
          </Button>
        </div>
      </div>

      <ActionSheet
        open={Boolean(pendingRemove)}
        title={pendingRemove?.type === 'ingredient' ? '移除这个食材项？' : '移除这个步骤？'}
        description={pendingRemove ? `"${pendingRemove.label}" 会从当前编辑表单里移除，确认后仍可手动重新添加。` : ''}
        confirmLabel={pendingRemove?.type === 'ingredient' ? '确认移除食材' : '确认移除步骤'}
        confirmTone="accent"
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemove(null)}
      />
    </Screen>
  );
}
