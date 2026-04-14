import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Check, Copy } from 'lucide-react';
import { getMenuIngredients, toggleIngredientPurchase } from '@/api/menus';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { useToast } from '@/components/ToastProvider';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { cn } from '@/lib/utils';
import { buildIngredientsClipboardText } from '@/utils/format';

export function IngredientsPage() {
  const { id = '' } = useParams();
  const { showToast } = useToast();
  const { isDesktop } = useBreakpoint();
  const queryClient = useQueryClient();
  const queryKey = ['menu', id, 'ingredients'];
  const query = useQuery({ queryKey, queryFn: () => getMenuIngredients(id) });
  const groups = query.data?.groups ?? [];

  const purchased = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const group of groups) {
      for (const item of group.items) {
        const key = `${group.category}-${item.name}`;
        if (item.purchased) map[key] = true;
      }
    }
    return map;
  }, [groups]);

  const totalPurchased = useMemo(() => Object.values(purchased).filter(Boolean).length, [purchased]);

  const toggleMutation = useMutation({
    mutationFn: (ingredientKey: string) => toggleIngredientPurchase(id, ingredientKey),
    onMutate: async (ingredientKey) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: typeof query.data) => {
        if (!old) return old;
        return {
          ...old,
          groups: old.groups.map((group) => ({
            ...group,
            items: group.items.map((item) => {
              const key = `${group.category}-${item.name}`;
              return key === ingredientKey ? { ...item, purchased: !item.purchased } : item;
            }),
          })),
        };
      });
      return { previous };
    },
    onError: (_err, _key, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      showToast('操作失败，请重试', 'error');
    },
  });

  if (!groups.length) {
    return (
      <Screen>
        <TopBar title="采购清单" />
        <EmptyState title="暂时没有食材清单" description="菜单里的菜谱可能没有维护食材信息。" />
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="采购清单" />

      <div className={isDesktop ? 'grid grid-cols-[minmax(0,1fr)_340px] gap-6 items-start' : ''}>
        <div>
          {groups.map((group) => (
            <section className="p-5 rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] mb-4" key={group.category}>
              <h2 className="m-0 mb-4 text-base font-semibold">{group.category}</h2>
              <div className="flex flex-col">
                {group.items.map((item, index) => {
                  const key = `${group.category}-${item.name}`;
                  const isPurchased = purchased[key];
                  return (
                    <div
                      role="button"
                      tabIndex={0}
                      className={cn(
                        'flex items-center gap-3 py-3 text-left transition-colors cursor-pointer',
                        index < group.items.length - 1 && 'border-b border-[var(--border-color)]',
                        isPurchased && 'opacity-50',
                      )}
                      key={key}
                      onClick={() => toggleMutation.mutate(key)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleMutation.mutate(key); }}
                    >
                      <Checkbox checked={isPurchased} className="rounded-md" tabIndex={-1} />
                      <span className={cn('flex-1 text-sm', isPurchased && 'line-through')}>{item.name}</span>
                      <strong className={cn('text-sm text-[var(--text-secondary)]', isPurchased && 'line-through')}>{item.amount || '-'}</strong>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Sidebar */}
        <aside className={isDesktop ? 'sticky top-0 p-5 rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)]' : ''}>
          {isDesktop ? (
            <>
              <p className="text-[11px] font-semibold tracking-wider uppercase text-[var(--brand)] mb-1">Checklist</p>
              <h2 className="text-lg font-semibold m-0 mb-4">采购进度</h2>
              <div className="flex flex-col mb-4">
                {[
                  ['食材种类', `${query.data?.total_count || 0}`],
                  ['已购买', `${totalPurchased}`],
                  ['未购买', `${(query.data?.total_count || 0) - totalPurchased}`],
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
            <div className="flex items-center text-sm text-[var(--text-secondary)]">
              <Check size={14} className="mr-1" />
              共 {query.data?.total_count || 0} 种食材，已购 {totalPurchased} 种
            </div>
            <Button
              className="w-full h-11 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-deep)] text-white font-semibold"
              onClick={async () => {
                await navigator.clipboard.writeText(buildIngredientsClipboardText(groups));
                showToast('清单已复制');
              }}
            >
              <Copy size={14} className="mr-1.5" />
              一键复制清单
            </Button>
          </div>
        </aside>
      </div>
    </Screen>
  );
}
