import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { deleteMenu, getMenus } from '@/api/menus';
import { ActionSheet } from '@/components/ActionSheet';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { StaggerItem } from '@/components/StaggerItem';
import { SwipeActionRow } from '@/components/SwipeActionRow';
import { useToast } from '@/components/ToastProvider';
import { Button } from '@/components/ui/button';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { cn } from '@/lib/utils';
import { formatDateLong, getHistoryGroupLabel } from '@/utils/format';

export function HistoryPage() {
  const { isDesktop } = useBreakpoint();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [pendingDelete, setPendingDelete] = useState<{ id: number; title: string } | null>(null);
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null);
  const query = useQuery({ queryKey: ['menus'], queryFn: getMenus });
  const removeMutation = useMutation({
    mutationFn: deleteMenu,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['menus'] });
      showToast('菜单已删除');
      setPendingDelete(null);
    },
    onError: (error) => showToast(error instanceof Error ? error.message : '删除失败', 'error'),
  });
  const groups = useMemo(() => {
    return (query.data ?? []).reduce<Record<string, typeof query.data>>((acc, menu) => {
      const key = getHistoryGroupLabel(menu.menu_date);
      if (!acc[key]) acc[key] = [];
      acc[key]?.push(menu);
      return acc;
    }, {} as Record<string, typeof query.data>);
  }, [query.data]);

  useEffect(() => {
    if (!selectedMenuId && query.data?.[0]?.id) {
      setSelectedMenuId(query.data[0].id);
    }
  }, [query.data, selectedMenuId]);

  const selectedMenu = (query.data ?? []).find((item) => item.id === selectedMenuId) ?? query.data?.[0];

  return (
    <Screen>
      <header className="mb-4">
        <p className="text-[11px] font-semibold tracking-wider uppercase text-[var(--brand)] mb-1">Records</p>
        <h1 className="m-0 text-[26px] font-bold tracking-[-0.44px]">历史菜单</h1>
      </header>

      {(query.data ?? []).length ? (
        isDesktop ? (
          <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
            <div className="min-w-0">
              {Object.entries(groups).map(([group, menus]) => (
                <section key={group}>
                  <h2 className="text-base font-semibold my-4">{group}</h2>
                  <div className="flex flex-col gap-3">
                    {menus?.map((menu, index) => (
                      <StaggerItem key={menu.id} index={index} disabled={!isDesktop}>
                        <SwipeActionRow actionLabel="删除" onAction={() => setPendingDelete({ id: menu.id, title: menu.title || '家庭菜单' })}>
                          <button
                            type="button"
                            className={cn(
                              'w-full text-left flex items-center justify-between gap-3 p-4 rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] transition-all',
                              selectedMenu?.id === menu.id && 'ring-2 ring-[var(--brand)] ring-opacity-30',
                            )}
                            onClick={() => setSelectedMenuId(menu.id)}
                          >
                            <div className="flex-1 min-w-0">
                              <strong className="block text-sm font-medium mb-1">{menu.title || '家庭菜单'}</strong>
                              <p className="m-0 text-xs text-[var(--text-secondary)] mb-1">{formatDateLong(menu.menu_date)}</p>
                              <small className="text-xs text-[var(--text-secondary)] line-clamp-1">{menu.items.slice(0, 3).map((item) => item.recipe_name).join(' · ')}</small>
                            </div>
                            <span className="text-xs text-[var(--text-secondary)] flex-shrink-0">预览</span>
                          </button>
                        </SwipeActionRow>
                      </StaggerItem>
                    ))}
                  </div>
                </section>
              ))}
            </div>
            {/* Preview sidebar */}
            <aside className="sticky top-0 p-5 rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)]">
              {selectedMenu ? (
                <>
                  <p className="text-[11px] font-semibold tracking-wider uppercase text-[var(--brand)] mb-1">Preview</p>
                  <h2 className="text-lg font-semibold m-0 mb-1">{selectedMenu.title || '家庭菜单'}</h2>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">{formatDateLong(selectedMenu.menu_date)}</p>
                  <div className="flex flex-col">
                    {selectedMenu.items.map((item, index) => (
                      <div key={`${item.recipe_name}-${item.sort_order}`} className={cn('flex justify-between gap-3 py-3', index < selectedMenu.items.length - 1 && 'border-b border-[var(--border-color)]')}>
                        <span className="text-xs text-[var(--text-secondary)]">{item.recipe_category}</span>
                        <strong className="text-sm text-right">{item.recipe_name}</strong>
                      </div>
                    ))}
                  </div>
                  <Button asChild className="w-full mt-4 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-deep)] text-white">
                    <Link to={`/menus/${selectedMenu.id}`}>查看详情</Link>
                  </Button>
                </>
              ) : null}
            </aside>
          </div>
        ) : (
          Object.entries(groups).map(([group, menus]) => (
            <section key={group}>
              <h2 className="text-base font-semibold my-4">{group}</h2>
              <div className="flex flex-col gap-3">
                {menus?.map((menu) => (
                  <SwipeActionRow
                    key={menu.id}
                    actionLabel="删除"
                    onAction={() => setPendingDelete({ id: menu.id, title: menu.title || '家庭菜单' })}
                  >
                    <Link
                      to={`/menus/${menu.id}`}
                      className="block p-4 rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-hover)]"
                    >
                      <strong className="block text-sm font-medium mb-1">{menu.title || '家庭菜单'}</strong>
                      <p className="m-0 text-xs text-[var(--text-secondary)] mb-1">{formatDateLong(menu.menu_date)}</p>
                      <small className="text-xs text-[var(--text-secondary)] line-clamp-1">{menu.items.slice(0, 3).map((item) => item.recipe_name).join(' · ')}</small>
                    </Link>
                  </SwipeActionRow>
                ))}
              </div>
            </section>
          ))
        )
      ) : (
        <EmptyState
          icon="🗂️"
          title="还没有历史菜单"
          description="今天先点一桌喜欢的菜，历史就会慢慢丰富起来。"
          action={
            <Button asChild className="bg-[var(--brand)] hover:bg-[var(--brand-deep)] text-white rounded-lg">
              <Link to="/order">去点菜</Link>
            </Button>
          }
        />
      )}

      <ActionSheet
        open={Boolean(pendingDelete)}
        title="删除这份历史菜单？"
        description={pendingDelete ? `"${pendingDelete.title}" 删除后将无法恢复。` : ''}
        confirmLabel="确认删除"
        onConfirm={() => pendingDelete && removeMutation.mutate(pendingDelete.id)}
        onCancel={() => !removeMutation.isPending && setPendingDelete(null)}
        pending={removeMutation.isPending}
      />
    </Screen>
  );
}
