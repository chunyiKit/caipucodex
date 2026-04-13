import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Share2, Sparkles, ChefHat, ExternalLink } from 'lucide-react';
import { getMenu } from '@/api/menus';
import { assetUrl } from '@/api/client';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { useToast } from '@/components/ToastProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { formatDateLong, groupMenuItems } from '@/utils/format';
import { getPlaceholderImage } from '@/utils/placeholder';

export function MenuDetailPage() {
  const { id = '' } = useParams();
  const { showToast } = useToast();
  const { isDesktop } = useBreakpoint();
  const query = useQuery({ queryKey: ['menu', id], queryFn: () => getMenu(id) });
  const menu = query.data;

  if (!menu) {
    return (
      <Screen>
        <TopBar title="菜单详情" />
        <EmptyState title="没有找到菜单" description="这份菜单可能已经被删除。" />
      </Screen>
    );
  }
  const grouped = groupMenuItems(menu.items);

  return (
    <Screen>
      <TopBar
        title="菜单详情"
        right={
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={async () => {
              await navigator.clipboard.writeText(window.location.href);
              showToast('菜单链接已复制');
            }}
          >
            <Share2 size={18} />
          </Button>
        }
      />

      <div className={isDesktop ? 'grid grid-cols-[minmax(0,1fr)_340px] gap-6 items-start' : ''}>
        <div>
          {/* Header card */}
          <section className="p-5 rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] mb-4">
            <div className="flex items-center gap-2 mb-2">
              {menu.is_ai_generated ? <Sparkles size={14} className="text-[var(--brand)]" /> : null}
              <p className="text-[11px] font-semibold tracking-wider uppercase text-[var(--brand)] m-0">
                {menu.is_ai_generated ? 'AI 推荐' : '家庭菜单'}
              </p>
            </div>
            <h1 className="m-0 text-2xl font-bold tracking-[-0.44px] mb-1">{menu.title || '今日菜单'}</h1>
            <p className="text-sm text-[var(--text-secondary)] m-0">{formatDateLong(menu.menu_date)}</p>
          </section>

          {/* Grouped items */}
          {Object.entries(grouped).map(([category, items]) => (
            <section className="p-5 rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] mb-4" key={category}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="m-0 text-base font-semibold">{category}</h2>
                <Badge className="bg-[var(--brand-soft)] text-[var(--brand)] border-0 rounded-full">{items.length} 道</Badge>
              </div>
              {isDesktop ? (
                <div className="flex flex-col gap-3">
                  {items.map((item) => (
                    <div key={`${item.recipe_name}-${item.sort_order}`} className="flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--surface-secondary)]">
                      <img
                        src={assetUrl(item.image_url) || getPlaceholderImage(item.recipe_name)}
                        alt={item.recipe_name}
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <strong className="block text-sm font-medium mb-0.5">{item.recipe_name}</strong>
                        <p className="m-0 text-xs text-[var(--text-secondary)]">{item.ai_reason || `${item.quantity} 份 · ${item.cooking_time || 20} 分钟`}</p>
                        {item.recipe_id ? (
                          <Link to={`/recipes/${item.recipe_id}`} className="inline-flex items-center gap-1 mt-1 text-xs text-[var(--brand)] font-medium">
                            查看菜谱 <ExternalLink size={10} />
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {items.map((item) => (
                    <div key={`${item.recipe_name}-${item.sort_order}`} className="flex items-start gap-3 p-3.5 rounded-2xl bg-[var(--surface-secondary)]">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm grid place-items-center flex-shrink-0">
                        <ChefHat size={18} className="text-[var(--brand)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <strong className="text-sm font-medium">{item.recipe_name}</strong>
                          <span className="text-[11px] text-[var(--text-secondary)] bg-white px-2 py-0.5 rounded-full flex-shrink-0">已保存</span>
                        </div>
                        <p className="m-0 text-[13px] text-[var(--text-secondary)] leading-relaxed line-clamp-2 mb-2">
                          {item.ai_reason || `${item.recipe_category} · 家常搭配更顺手`}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className="rounded-full text-[11px] border-[var(--border-color)]">{item.quantity} 份</Badge>
                          <Badge variant="outline" className="rounded-full text-[11px] border-[var(--border-color)]">{item.cooking_time || 20} 分钟</Badge>
                          {item.recipe_id ? (
                            <Link to={`/recipes/${item.recipe_id}`} className="inline-flex items-center gap-1 text-xs text-[var(--brand)] font-medium">
                              查看菜谱 <ExternalLink size={10} />
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                  ['日期', formatDateLong(menu.menu_date)],
                  ['菜品数', `${menu.items.length} 道`],
                  ['来源', menu.is_ai_generated ? 'AI 推荐' : '手动生成'],
                ].map(([label, value], index) => (
                  <div key={label} className={`flex justify-between gap-3 py-3 ${index < 2 ? 'border-b border-[var(--border-color)]' : ''}`}>
                    <span className="text-sm text-[var(--text-secondary)]">{label}</span>
                    <strong className="text-sm">{value}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : null}
          <Button variant="outline" asChild className="w-full h-11 rounded-xl mt-2 lg:mt-0">
            <Link to={`/menus/${menu.id}/ingredients`}>查看采购清单</Link>
          </Button>
        </aside>
      </div>
    </Screen>
  );
}
