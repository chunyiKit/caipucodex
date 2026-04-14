import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Sparkles, ChefHat } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  const recipesQuery = useQuery({ queryKey: ['recipes', 'picker'], queryFn: () => getRecipes({ limit: 100 }) });
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
          title="还没有菜单草稿"
          description="先从点菜页或者 AI 推荐生成一份菜单。"
          action={
            <Button className="bg-[var(--brand)] hover:bg-[var(--brand-deep)] text-white rounded-lg" onClick={() => navigate('/order')}>
              去点菜
            </Button>
          }
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar
        title="菜单预览"
        right={
          <Button variant="ghost" size="sm" className="text-[var(--brand)] font-medium" onClick={() => setPickerOpen(true)}>
            <Plus size={16} /> 添加
          </Button>
        }
      />

      <div className={isDesktop ? 'grid grid-cols-[minmax(0,1fr)_340px] gap-6 items-start' : ''}>
        <div>
          {/* Hero */}
          <section className="p-5 rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] mb-4">
            <div className="flex items-center gap-2 mb-2">
              {draft.is_ai_generated ? <Sparkles size={14} className="text-[var(--brand)]" /> : null}
              <p className="text-[11px] font-semibold tracking-wider uppercase text-[var(--brand)] m-0">
                {draft.is_ai_generated ? 'AI 推荐' : '手动点菜'}
              </p>
            </div>
            <h1 className="m-0 text-2xl font-bold tracking-[-0.44px] mb-1">{draft.title || '今日菜单'}</h1>
            <p className="text-sm text-[var(--text-secondary)] m-0 mb-3">{formatDateLong(draft.menu_date)}</p>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="outline" className="rounded-full border-[var(--border-color)]">{draft.items.length} 道菜</Badge>
              <Badge variant="outline" className="rounded-full border-[var(--border-color)]">{Object.keys(grouped).length} 类搭配</Badge>
            </div>
            <small className="text-xs text-[var(--text-secondary)]">左滑菜品可快速移除，右上角可继续补加。</small>
          </section>

          {/* Grouped items */}
          {Object.entries(grouped).map(([category, items]) => (
            <section className="p-5 rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] mb-4" key={category}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="m-0 text-base font-semibold">{category}</h2>
                <Badge className="bg-[var(--brand-soft)] text-[var(--brand)] border-0 rounded-full">{items.length} 道</Badge>
              </div>
              <div className="flex flex-col gap-2.5">
                {items.map((item, index) => (
                  <StaggerItem key={item.recipe_name} index={index} disabled={!isDesktop}>
                    <SwipeActionRow actionLabel="移除" onAction={() => setPendingRemove(item.recipe_name)} actionTone="accent">
                      <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[var(--surface-secondary)] transition-colors hover:bg-[var(--surface-button)]">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm grid place-items-center flex-shrink-0">
                          <ChefHat size={18} className="text-[var(--brand)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <strong className="text-sm font-medium">{item.recipe_name}</strong>
                            <span className="text-[11px] text-[var(--text-secondary)] bg-white px-2 py-0.5 rounded-full flex-shrink-0">左滑移除</span>
                          </div>
                          <p className="m-0 text-[13px] text-[var(--text-secondary)] leading-relaxed line-clamp-2 mb-2">
                            {item.ai_reason || `${item.recipe_category} · 家常搭配更顺手`}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            <Badge variant="outline" className="rounded-full text-[11px] border-[var(--border-color)]">{item.quantity} 份</Badge>
                            <Badge variant="outline" className="rounded-full text-[11px] border-[var(--border-color)]">{item.cooking_time || 20} 分钟</Badge>
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

        {/* Sidebar */}
        <aside className={isDesktop ? 'sticky top-0 p-5 rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)]' : ''}>
          {isDesktop ? (
            <>
              <p className="text-[11px] font-semibold tracking-wider uppercase text-[var(--brand)] mb-1">Summary</p>
              <h2 className="text-lg font-semibold m-0 mb-4">菜单概览</h2>
              <div className="flex flex-col mb-4">
                {[
                  ['日期', formatDateLong(draft.menu_date)],
                  ['菜品数', `${draft.items.length} 道`],
                  ['类型', draft.is_ai_generated ? 'AI 推荐' : '手动点菜'],
                ].map(([label, value], index) => (
                  <div key={label} className={`flex justify-between gap-3 py-3 ${index < 2 ? 'border-b border-[var(--border-color)]' : ''}`}>
                    <span className="text-sm text-[var(--text-secondary)]">{label}</span>
                    <strong className="text-sm">{value}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : null}
          <div className="flex flex-col gap-2.5 mt-2 lg:mt-0">
            <Button variant="outline" className="w-full h-11 rounded-xl" onClick={() => setPickerOpen(true)}>
              补加菜品
            </Button>
            <Button
              className="w-full h-11 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-deep)] text-white font-semibold"
              onClick={() => saveMutation.mutate(draft)}
            >
              {saveMutation.isPending ? '保存中...' : '保存菜单'}
            </Button>
          </div>
        </aside>
      </div>

      {/* Picker sheet */}
      <BottomSheet open={pickerOpen} onClose={() => setPickerOpen(false)} title="添加已有菜谱">
        <div className="flex flex-col gap-3 max-h-[42vh] overflow-y-auto">
          {(recipesQuery.data?.items ?? []).length ? (
            (recipesQuery.data?.items ?? []).map((recipe) => (
              <RecipeListItem key={recipe.id} recipe={recipe} onAdd={(selectedRecipe) => addRecipe(selectedRecipe)} />
            ))
          ) : (
            <EmptyState icon="📚" title="暂时没有可添加的菜谱" description="先去菜谱页新建几道菜。" />
          )}
        </div>
      </BottomSheet>

      <ActionSheet
        open={Boolean(pendingRemove)}
        title="从菜单里移除这道菜？"
        description={pendingRemove ? `移除 "${pendingRemove}" 后，可以稍后再补加。` : ''}
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
