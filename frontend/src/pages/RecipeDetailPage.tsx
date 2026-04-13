import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { deleteRecipe, getRecipe } from '@/api/recipes';
import { assetUrl } from '@/api/client';
import { ActionSheet } from '@/components/ActionSheet';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { useToast } from '@/components/ToastProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { getPlaceholderImage } from '@/utils/placeholder';

export function RecipeDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { isDesktop } = useBreakpoint();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const query = useQuery({ queryKey: ['recipe', id], queryFn: () => getRecipe(id) });
  const removeMutation = useMutation({
    mutationFn: () => deleteRecipe(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['recipes'] });
      showToast('菜谱已删除');
      setConfirmOpen(false);
      navigate('/recipes');
    },
    onError: (error) => showToast(error instanceof Error ? error.message : '删除失败', 'error'),
  });

  const recipe = query.data;
  if (!recipe) {
    return (
      <Screen>
        <TopBar title="菜谱详情" />
        <EmptyState title="没有找到菜谱" description="可能已经被删除，回列表看看别的吧。" />
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar
        title="菜谱详情"
        right={
          <Button variant="ghost" size="sm" asChild className="text-[var(--brand)]">
            <Link to={`/recipes/${id}/edit`}><Pencil size={16} /></Link>
          </Button>
        }
      />
      {/* Hero */}
      <div className={isDesktop ? 'grid grid-cols-[minmax(420px,0.92fr)_minmax(0,1fr)] gap-6 mb-4' : ''}>
        <img
          className="w-full aspect-[1.1/1] object-cover rounded-[var(--radius-large)] mb-4 lg:mb-0"
          src={assetUrl(recipe.image_url) || getPlaceholderImage(recipe.name)}
          alt={recipe.name}
        />
        <section className="p-5 rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] mb-4 lg:mb-0 lg:flex lg:flex-col lg:justify-center">
          <h1 className="m-0 text-2xl font-bold tracking-[-0.44px] mb-3">{recipe.name}</h1>
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge className="rounded-full bg-[var(--brand-soft)] text-[var(--brand)] border-0 font-medium">{recipe.category}</Badge>
            <Badge variant="outline" className="rounded-full border-[var(--border-color)]">{recipe.difficulty}</Badge>
            <Badge variant="outline" className="rounded-full border-[var(--border-color)]">{recipe.cooking_time || 20} 分钟</Badge>
          </div>
          <p className="text-[var(--text-secondary)] leading-relaxed">{recipe.description || '这道菜还没有补充描述。'}</p>
          {isDesktop ? (
            <div className="flex gap-3 mt-5">
              <Button variant="outline" asChild className="rounded-lg">
                <Link to={`/recipes/${id}/edit`}><Pencil size={14} className="mr-1" /> 编辑</Link>
              </Button>
              <Button variant="ghost" className="text-[#c13515] hover:bg-red-50 rounded-lg" onClick={() => setConfirmOpen(true)}>
                <Trash2 size={14} className="mr-1" /> 删除
              </Button>
            </div>
          ) : null}
        </section>
      </div>

      {/* Content */}
      <div className={isDesktop ? 'grid grid-cols-2 gap-6' : ''}>
        <section className="p-5 rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] mb-4">
          <h2 className="m-0 mb-4 text-lg font-semibold">所需食材</h2>
          <div className="flex flex-col">
            {recipe.ingredients.map((item, index) => (
              <div key={`${item.name}-${item.sort_order}`}>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-sm text-[var(--text-secondary)]">{item.amount || '-'}</span>
                </div>
                {index < recipe.ingredients.length - 1 ? <Separator /> : null}
              </div>
            ))}
          </div>
        </section>

        <section className="p-5 rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] mb-4">
          <h2 className="m-0 mb-4 text-lg font-semibold">烹饪步骤</h2>
          <div className="flex flex-col gap-5">
            {recipe.cooking_steps.map((step, index) => (
              <div key={step.id || index} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--brand)] text-white text-sm font-semibold grid place-items-center flex-shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="m-0 text-sm leading-relaxed">{step.description}</p>
                  {step.image_url ? <img className="mt-3 rounded-xl" src={assetUrl(step.image_url)} alt={`步骤 ${index + 1}`} /> : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Mobile actions */}
      {!isDesktop ? (
        <div className="flex gap-3 mt-2">
          <Button variant="outline" asChild className="flex-1 h-11 rounded-xl">
            <Link to={`/recipes/${id}/edit`}>编辑</Link>
          </Button>
          <Button variant="ghost" className="flex-1 h-11 rounded-xl text-[#c13515] hover:bg-red-50" onClick={() => setConfirmOpen(true)}>
            删除
          </Button>
        </div>
      ) : null}

      <ActionSheet
        open={confirmOpen}
        title="确定要删除这道菜谱吗？"
        description="删除后不可恢复，但已保存到历史菜单里的菜品快照仍会保留。"
        confirmLabel="确认删除"
        onConfirm={() => removeMutation.mutate()}
        onCancel={() => !removeMutation.isPending && setConfirmOpen(false)}
        pending={removeMutation.isPending}
      />
    </Screen>
  );
}
