import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getMenuIngredients } from '@/api/menus';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { useToast } from '@/components/ToastProvider';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { buildIngredientsClipboardText } from '@/utils/format';

export function IngredientsPage() {
  const { id = '' } = useParams();
  const { showToast } = useToast();
  const { isDesktop } = useBreakpoint();
  const query = useQuery({ queryKey: ['menu', id, 'ingredients'], queryFn: () => getMenuIngredients(id) });
  const [purchased, setPurchased] = useState<Record<string, boolean>>({});
  const totalPurchased = useMemo(() => Object.values(purchased).filter(Boolean).length, [purchased]);
  const groups = query.data?.groups ?? [];

  if (!groups.length) {
    return (
      <Screen>
        <TopBar title="采购清单" />
        <EmptyState title="暂时没有食材清单" description="菜单里的菜谱可能没有维护食材信息。" />
      </Screen>
    );
  }

  return (
    <Screen className={isDesktop ? 'ingredients-page ingredients-page--desktop' : 'ingredients-page'}>
      <TopBar title="采购清单" />
      <div className={isDesktop ? 'desktop-content-with-aside' : ''}>
        <div className="desktop-content-with-aside__main">
          {groups.map((group) => (
            <section className="detail-card" key={group.category}>
              <div className="section-title"><h2>{group.category}</h2></div>
              <div className="detail-list">
                {group.items.map((item) => {
                  const key = `${group.category}-${item.name}`;
                  const isPurchased = purchased[key];
                  return (
                    <button type="button" className={`ingredient-check ${isPurchased ? 'is-purchased' : ''}`} key={key} onClick={() => setPurchased((current) => ({ ...current, [key]: !current[key] }))}>
                      <span className="checkbox-circle">{isPurchased ? '✓' : ''}</span>
                      <span>{item.name}</span>
                      <strong>{item.amount || '-'}</strong>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
        <aside className={isDesktop ? 'desktop-panel desktop-content-with-aside__side' : ''}>
          {isDesktop ? (
            <>
              <p className="eyebrow">Checklist</p>
              <h2>采购进度</h2>
              <div className="desktop-summary-list">
                <div><span>食材种类</span><strong>{query.data?.total_count || 0}</strong></div>
                <div><span>已购买</span><strong>{totalPurchased}</strong></div>
                <div><span>未购买</span><strong>{(query.data?.total_count || 0) - totalPurchased}</strong></div>
              </div>
            </>
          ) : null}
          <div className="bottom-actions sticky desktop-actions-stack">
            <div className="stats-text">共 {query.data?.total_count || 0} 种食材，已购 {totalPurchased} 种</div>
            <button
              type="button"
              className="primary-button compact"
              onClick={async () => {
                await navigator.clipboard.writeText(buildIngredientsClipboardText(groups));
                showToast('清单已复制');
              }}
            >
              一键复制清单
            </button>
          </div>
        </aside>
      </div>
    </Screen>
  );
}
