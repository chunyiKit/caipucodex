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
import { useBreakpoint } from '@/hooks/useBreakpoint';
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
    <Screen className={isDesktop ? 'history-page history-page--desktop' : 'history-page'}>
      <header className="page-header">
        <p className="eyebrow">Records</p>
        <h1>历史菜单</h1>
      </header>
      {(query.data ?? []).length ? (
        isDesktop ? (
          <div className="desktop-content-with-aside history-desktop-layout">
            <div className="desktop-content-with-aside__main">
              {Object.entries(groups).map(([group, menus]) => (
                <section key={group}>
                  <div className="section-title"><h2>{group}</h2></div>
                  <div className="list-stack">
                    {menus?.map((menu, index) => (
                      <StaggerItem key={menu.id} index={index}>
                        <SwipeActionRow actionLabel="删除" onAction={() => setPendingDelete({ id: menu.id, title: menu.title || '家庭菜单' })}>
                          <button type="button" className={`history-card history-card--interactive history-card--desktop-row pressable-card ${selectedMenu?.id === menu.id ? 'is-selected' : ''}`} onClick={() => setSelectedMenuId(menu.id)}>
                            <div className="history-card__link">
                              <strong>{menu.title || '家庭菜单'}</strong>
                              <p>{formatDateLong(menu.menu_date)}</p>
                              <small>{menu.items.slice(0, 3).map((item) => item.recipe_name).join(' · ')}</small>
                            </div>
                            <span className="history-card__swipe-tip">预览</span>
                          </button>
                        </SwipeActionRow>
                      </StaggerItem>
                    ))}
                  </div>
                </section>
              ))}
            </div>
            <aside className="desktop-panel desktop-content-with-aside__side">
              {selectedMenu ? (
                <>
                  <p className="eyebrow">Preview</p>
                  <h2>{selectedMenu.title || '家庭菜单'}</h2>
                  <p className="muted">{formatDateLong(selectedMenu.menu_date)} · {selectedMenu.people_count} 人</p>
                  <div className="desktop-summary-list">
                    {selectedMenu.items.map((item) => (
                      <div key={`${item.recipe_name}-${item.sort_order}`}>
                        <span>{item.recipe_category}</span>
                        <strong>{item.recipe_name}</strong>
                      </div>
                    ))}
                  </div>
                  <Link className="primary-button inline-button" to={`/menus/${selectedMenu.id}`}>查看详情</Link>
                </>
              ) : null}
            </aside>
          </div>
        ) : (
          Object.entries(groups).map(([group, menus]) => (
            <section key={group}>
              <div className="section-title"><h2>{group}</h2></div>
              <div className="list-stack">
                {menus?.map((menu, index) => (
                  <StaggerItem key={menu.id} index={index}>
                    <SwipeActionRow
                      actionLabel="删除"
                      onAction={() => setPendingDelete({ id: menu.id, title: menu.title || '家庭菜单' })}
                    >
                      <article className="history-card history-card--interactive pressable-card">
                        <Link className="history-card__link" to={`/menus/${menu.id}`}>
                          <strong>{menu.title || '家庭菜单'}</strong>
                          <p>{formatDateLong(menu.menu_date)}</p>
                          <small>{menu.items.slice(0, 3).map((item) => item.recipe_name).join(' · ')}</small>
                        </Link>
                        <span className="history-card__swipe-tip">左滑删除</span>
                      </article>
                    </SwipeActionRow>
                  </StaggerItem>
                ))}
              </div>
            </section>
          ))
        )
      ) : (
        <EmptyState
          icon="🗂️"
          accent="warm"
          title="还没有历史菜单"
          description="今天先点一桌喜欢的菜，历史就会慢慢丰富起来。"
          action={<Link className="primary-button inline-button" to="/order">去点菜</Link>}
        />
      )}
      <ActionSheet
        open={Boolean(pendingDelete)}
        title="删除这份历史菜单？"
        description={pendingDelete ? `“${pendingDelete.title}” 删除后将无法恢复。` : ''}
        confirmLabel="确认删除"
        onConfirm={() => pendingDelete && removeMutation.mutate(pendingDelete.id)}
        onCancel={() => !removeMutation.isPending && setPendingDelete(null)}
        pending={removeMutation.isPending}
      />
    </Screen>
  );
}
