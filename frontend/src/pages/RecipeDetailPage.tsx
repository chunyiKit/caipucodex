import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deleteRecipe, getRecipe } from '@/api/recipes';
import { assetUrl } from '@/api/client';
import { ActionSheet } from '@/components/ActionSheet';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { useToast } from '@/components/ToastProvider';
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
    <Screen className={isDesktop ? 'recipe-detail-page recipe-detail-page--desktop' : 'recipe-detail-page'}>
      <TopBar title="菜谱详情" right={<Link className="ghost-link" to={`/recipes/${id}/edit`}>编辑</Link>} />
      <div className={isDesktop ? 'recipe-detail-hero-layout' : ''}>
        <img className="detail-hero" src={assetUrl(recipe.image_url) || getPlaceholderImage(recipe.name)} alt={recipe.name} />
        <section className="detail-card recipe-detail-summary">
          <h1>{recipe.name}</h1>
          <div className="pill-row static">
            <span className={`pill pill--${recipe.category}`}>{recipe.category}</span>
            <span className="pill pill--plain">{recipe.difficulty}</span>
            <span className="pill pill--plain">{recipe.cooking_time || 20} 分钟</span>
          </div>
          <p>{recipe.description || '这道菜还没有补充描述。'}</p>
          {isDesktop ? (
            <div className="bottom-actions desktop-actions-inline">
              <Link className="secondary-button" to={`/recipes/${id}/edit`}>编辑</Link>
              <button type="button" className="text-danger" onClick={() => setConfirmOpen(true)}>删除</button>
            </div>
          ) : null}
        </section>
      </div>
      <div className={isDesktop ? 'desktop-two-column' : ''}>
        <section className="detail-card">
          <h2>所需食材</h2>
          <div className="detail-list">
            {recipe.ingredients.map((item) => (
              <div key={`${item.name}-${item.sort_order}`} className="ingredient-row">
                <span>{item.name}</span>
                <span>{item.amount || '-'}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="detail-card">
          <h2>烹饪步骤</h2>
          <div className="steps-list">
            {recipe.cooking_steps.map((step, index) => (
              <div key={step.id || index} className="step-item">
                <div className="step-index">{index + 1}</div>
                <div>
                  <p>{step.description}</p>
                  {step.image_url ? <img className="step-image" src={assetUrl(step.image_url)} alt={`步骤 ${index + 1}`} /> : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      {!isDesktop ? (
        <div className="bottom-actions">
          <Link className="secondary-button" to={`/recipes/${id}/edit`}>编辑</Link>
          <button type="button" className="text-danger" onClick={() => setConfirmOpen(true)}>删除</button>
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
