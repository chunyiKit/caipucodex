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
          <section className="detail-card detail-card--spotlight">
            <p className="eyebrow">{draft.is_ai_generated ? '✨ AI 推荐' : '手动点菜'}</p>
            <h1>{draft.title || '今日菜单'}</h1>
            <p>{formatDateLong(draft.menu_date)} · {draft.people_count} 人</p>
            <small className="muted">左滑菜品可快速移除，右上角可继续补加。</small>
          </section>
          {Object.entries(grouped).map(([category, items]) => (
            <section className="detail-card" key={category}>
              <div className="section-title"><h2>{category}</h2></div>
              <div className="menu-item-list">
                {items.map((item, index) => (
                  <StaggerItem key={item.recipe_name} index={index}>
                    <SwipeActionRow actionLabel="移除" onAction={() => setPendingRemove(item.recipe_name)} actionTone="accent">
                      <div className="menu-item-card menu-item-card--swipe pressable-card">
                        <div>
                          <strong>{item.recipe_name}</strong>
                          <p>{item.ai_reason || `${item.quantity} 份 · ${item.cooking_time || 20} 分钟`}</p>
                        </div>
                        <span className="history-card__swipe-tip">滑动调整</span>
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
                <div><span>人数</span><strong>{draft.people_count} 人</strong></div>
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
              <StaggerItem key={recipe.id} index={index}>
                <RecipeListItem recipe={recipe} onAdd={() => addRecipe(recipe)} />
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
