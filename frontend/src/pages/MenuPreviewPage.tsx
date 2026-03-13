import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createMenu } from '@/api/menus';
import { getRecipes } from '@/api/recipes';
import { ActionSheet } from '@/components/ActionSheet';
import { BottomSheet } from '@/components/BottomSheet';
import { EmptyState } from '@/components/EmptyState';
import { RecipeListItem } from '@/components/RecipeListItem';
import { Screen } from '@/components/Screen';
import { StaggerItem } from '@/components/StaggerItem';
import { SwipeActionRow } from '@/components/SwipeActionRow';
import { TopBar } from '@/components/TopBar';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useToast } from '@/components/ToastProvider';
import { useMenuDraftStore } from '@/store/menuDraftStore';
import { useOrderStore } from '@/store/orderStore';
import { formatDateLong, groupMenuItems } from '@/utils/format';

const CATEGORY_ICON_MAP: Record<string, string> = {
  '荤菜': '🥩',
  '素菜': '🥬',
  '汤类': '🍲',
  '主食': '🍚',
  '凉菜': '🥗',
  '甜点': '🍮',
};

export function MenuPreviewPage() {
  const navigate = useNavigate();
  const { isDesktop } = useBreakpoint();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { draft, removeItem, addRecipe, clear } = useMenuDraftStore();
  const orderClear = useOrderStore((state) => state.clear);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);
  const recipesQuery = useQuery({ queryKey: ['recipes', 'picker'], queryFn: () => getRecipes() });
  const grouped = useMemo(() => groupMenuItems(draft?.items ?? []), [draft]);
  const saveMutation = useMutation({
    mutationFn: createMenu,
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['menus'] });
      showToast('菜单已保存');
      clear();
      orderClear();
      navigate(`/menus/${response.id}`);
    },
    onError: (error) => showToast(error instanceof Error ? error.message : '保存失败', 'error'),
  });

  if (!draft || !draft.items.length) {
    return (
      <Screen>
        <TopBar title="菜单预览" />
        <EmptyState
          icon="📝"
          accent="calm"
          title="还没有菜单草稿"
          description="先从点菜页或者 AI 推荐生成一份菜单。"
          action={<button type="button" className="primary-button inline-button" onClick={() => navigate('/order')}>去点菜</button>}
        />
      </Screen>
    );
  }

  return (
    <Screen className={isDesktop ? 'menu-preview-page menu-preview-page--desktop' : 'menu-preview-page'}>
      <TopBar title="菜单预览" right={<button className="ghost-link" onClick={() => setPickerOpen(true)}>添加</button>} />
      <div className={isDesktop ? 'desktop-content-with-aside' : ''}>
        <div className="desktop-content-with-aside__main">
          <section className="detail-card detail-card--spotlight menu-preview-hero">
            <p className="eyebrow">{draft.is_ai_generated ? '✨ AI 推荐' : '手动点菜'}</p>
            <h1>{draft.title || '今日菜单'}</h1>
            <p>{formatDateLong(draft.menu_date)}</p>
            <div className="pill-row static menu-preview-overview">
              <span className="pill pill--plain">{draft.items.length} 道菜</span>
              <span className="pill pill--plain">{Object.keys(grouped).length} 类搭配</span>
            </div>
            <small className="muted menu-preview-hero__hint">左滑菜品可快速移除，右上角可继续补加。</small>
          </section>
          {Object.entries(grouped).map(([category, items]) => (
            <section className="detail-card menu-preview-section" key={category}>
              <div className="section-title menu-preview-section__header">
                <h2>{category}</h2>
                <span className={`pill pill--${category} menu-preview-section__count`}>{items.length} 道</span>
              </div>
              <div className="menu-item-list menu-item-list--preview">
                {items.map((item, index) => (
                  <StaggerItem key={item.recipe_name} index={index} disabled={!isDesktop}>
                    <SwipeActionRow actionLabel="移除" onAction={() => setPendingRemove(item.recipe_name)} actionTone="accent">
                      <div className="menu-item-card menu-item-card--swipe menu-item-card--preview pressable-card">
                        <div className="menu-item-card__icon" aria-hidden="true">{CATEGORY_ICON_MAP[item.recipe_category] || '🍽️'}</div>
                        <div className="menu-item-card__body">
                          <div className="menu-item-card__title-row">
                            <strong>{item.recipe_name}</strong>
                            <span className="menu-item-card__hint">左滑移除</span>
                          </div>
                          <p className="menu-item-card__reason">{item.ai_reason || `${item.recipe_category} · 家常搭配更顺手`}</p>
                          <div className="menu-item-card__meta">
                            <span className="pill pill--plain">{item.quantity} 份</span>
                            <span className="pill pill--plain">{item.cooking_time || 20} 分钟</span>
                          </div>
                        </div>
                      </div>
                    </SwipeActionRow>
                  </StaggerItem>
                ))}
              </div>
            </section>
          ))}
        </div>
        <aside className={isDesktop ? 'desktop-panel desktop-content-with-aside__side' : ''}>
          {isDesktop ? (
            <>
              <p className="eyebrow">Summary</p>
              <h2>菜单概览</h2>
              <div className="desktop-summary-list">
                <div><span>日期</span><strong>{formatDateLong(draft.menu_date)}</strong></div>
                <div><span>菜品数</span><strong>{draft.items.length} 道</strong></div>
                <div><span>类型</span><strong>{draft.is_ai_generated ? 'AI 推荐' : '手动点菜'}</strong></div>
              </div>
            </>
          ) : null}
          <div className="bottom-actions sticky desktop-actions-stack">
            <button type="button" className="secondary-button" onClick={() => setPickerOpen(true)}>补加菜品</button>
            <button type="button" className="primary-button compact" onClick={() => saveMutation.mutate(draft)}>
              {saveMutation.isPending ? '保存中...' : '保存菜单'}
            </button>
          </div>
        </aside>
      </div>
      <BottomSheet open={pickerOpen} onClose={() => setPickerOpen(false)} title="添加已有菜谱">
        <div className="cart-list">
          {(recipesQuery.data ?? []).length ? (
            (recipesQuery.data ?? []).map((recipe, index) => (
              <StaggerItem key={recipe.id} index={index} disabled={!isDesktop}>
                <RecipeListItem recipe={recipe} onAdd={(selectedRecipe) => addRecipe(selectedRecipe)} />
              </StaggerItem>
            ))
          ) : (
            <EmptyState icon="📚" title="暂时没有可添加的菜谱" description="先去菜谱页新建几道菜，再回来补加。" />
          )}
        </div>
      </BottomSheet>
      <ActionSheet
        open={Boolean(pendingRemove)}
        title="从菜单里移除这道菜？"
        description={pendingRemove ? `移除 “${pendingRemove}” 后，可以稍后再从菜谱里补加回来。` : ''}
        confirmLabel="确认移除"
        confirmTone="accent"
        onConfirm={() => {
          if (pendingRemove) removeItem(pendingRemove);
          setPendingRemove(null);
        }}
        onCancel={() => setPendingRemove(null)}
      />
    </Screen>
  );
}
