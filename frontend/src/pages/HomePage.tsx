import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Sparkles, ChevronRight } from 'lucide-react';
import { getMenus } from '@/api/menus';
import { getRecipes } from '@/api/recipes';
import { BottomSheet } from '@/components/BottomSheet';
import { EmptyState } from '@/components/EmptyState';
import { RecipeCard } from '@/components/RecipeCard';
import { SectionTitle } from '@/components/SectionTitle';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { preferenceOptions } from '@/constants/categories';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { formatDateLong } from '@/utils/format';

export function HomePage() {
  const navigate = useNavigate();
  const { isDesktop } = useBreakpoint();
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState<string[]>([]);
  const recipesQuery = useQuery({ queryKey: ['recipes', 'home'], queryFn: () => getRecipes() });
  const menusQuery = useQuery({ queryKey: ['menus'], queryFn: getMenus });

  const popularRecipes = useMemo(() => {
    const recipes = recipesQuery.data ?? [];
    return recipes.slice(0, isDesktop ? 8 : 6);
  }, [isDesktop, recipesQuery.data]);

  return (
    <Screen className={isDesktop ? 'lg:pt-0' : ''}>
      <div className={isDesktop ? 'grid grid-cols-[minmax(0,1.35fr)_minmax(360px,0.95fr)] gap-6 items-start' : ''}>
        <div className={isDesktop ? 'flex flex-col gap-5' : ''}>
          {/* Welcome card */}
          <div className="flex items-center justify-between gap-4 p-5 rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] mb-4 lg:mb-0">
            <div>
              <p className="text-[11px] font-semibold tracking-wider uppercase text-[var(--brand)] mb-1">CaipuCodex</p>
              <h1 className="m-0 text-[26px] font-bold tracking-[-0.44px] leading-tight">今天想吃什么？</h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1 m-0">{formatDateLong(new Date().toISOString())}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[var(--brand)] text-white grid place-items-center text-lg font-bold flex-shrink-0">
              家
            </div>
          </div>

          {/* Action cards */}
          <div className={isDesktop ? 'grid grid-cols-2 gap-4' : 'flex flex-col gap-3 mb-4'}>
            <Link
              to="/order"
              className="flex items-center justify-between gap-4 p-5 rounded-[var(--radius-card)] bg-[var(--text-primary)] text-white shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-hover)] group"
            >
              <div>
                <p className="text-[11px] font-semibold tracking-wider uppercase text-white/70 mb-1">今日入口</p>
                <h2 className="m-0 text-lg font-semibold mb-1">开始点菜</h2>
                <p className="m-0 text-sm text-white/70">为今天的餐桌挑选一桌热乎饭菜。</p>
              </div>
              <UtensilsCrossed size={36} className="text-white/40 flex-shrink-0 transition-transform group-hover:scale-110" />
            </Link>

            <button
              type="button"
              className="flex items-center justify-between gap-4 p-5 rounded-[var(--radius-card)] bg-[var(--surface-secondary)] text-[var(--text-primary)] shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-hover)] text-left group"
              onClick={() => setOpen(true)}
            >
              <div>
                <p className="text-[11px] font-semibold tracking-wider uppercase text-[var(--brand)] mb-1">智能搭配</p>
                <h2 className="m-0 text-lg font-semibold mb-1">AI 帮你配菜</h2>
                <p className="m-0 text-sm text-[var(--text-secondary)]">输入偏好，快速生成一份荤素搭配。</p>
              </div>
              <Sparkles size={36} className="text-[var(--brand)] opacity-40 flex-shrink-0 transition-transform group-hover:scale-110" />
            </button>
          </div>

          {/* Recent menus */}
          <section className={isDesktop ? 'p-5 rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)]' : ''}>
            <SectionTitle title="最近的菜单" action={<Link to="/history" className="flex items-center gap-1">查看全部 <ChevronRight size={14} /></Link>} />
            <div className={isDesktop ? 'grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3' : 'flex gap-3 overflow-x-auto scrollbar-hide pb-1'}>
              {(menusQuery.data ?? []).length ? (
                menusQuery.data?.slice(0, 6).map((menu) => (
                  <Link
                    to={`/menus/${menu.id}`}
                    key={menu.id}
                    className="flex-shrink-0 w-[220px] lg:w-auto p-4 rounded-2xl bg-white border border-[var(--border-color)] hover:shadow-[var(--shadow-hover)] transition-shadow"
                  >
                    <strong className="block text-sm font-semibold mb-1">{menu.title || '家庭菜单'}</strong>
                    <p className="text-xs text-[var(--text-secondary)] m-0 mb-1">{formatDateLong(menu.menu_date)}</p>
                    <small className="text-xs text-[var(--text-secondary)] line-clamp-2">{menu.items.slice(0, 3).map((item) => item.recipe_name).join(' · ')}</small>
                  </Link>
                ))
              ) : (
                <EmptyState icon="🗓️" title="还没有菜单记录" description="去点菜生成今天的菜单吧。" />
              )}
            </div>
          </section>
        </div>

        {/* Popular recipes */}
        <section className={isDesktop ? 'p-5 rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)]' : ''}>
          <SectionTitle title="家常好菜" />
          {recipesQuery.isLoading ? (
            <div className="grid grid-cols-2 gap-3.5">
              <div className="rounded-[var(--radius-card)] bg-[var(--surface-secondary)] aspect-[4/3] animate-shimmer" />
              <div className="rounded-[var(--radius-card)] bg-[var(--surface-secondary)] aspect-[4/3] animate-shimmer" />
            </div>
          ) : popularRecipes.length ? (
            <div className={isDesktop ? 'grid grid-cols-3 gap-4' : 'grid grid-cols-2 gap-3.5'}>
              {popularRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          ) : (
            <EmptyState icon="📚" title="还没有菜谱" description="先添加几道拿手菜，首页会为你推荐。" />
          )}
        </section>
      </div>

      {/* AI Sheet */}
      <BottomSheet open={open} onClose={() => setOpen(false)} title="AI 智能配菜">
        <div className="mb-5">
          <label className="block text-sm font-semibold mb-3">偏好</label>
          <div className="flex flex-wrap gap-2">
            {preferenceOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  preferences.includes(option)
                    ? 'bg-[var(--brand)] text-white border-[var(--brand)]'
                    : 'bg-white text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--text-primary)]'
                }`}
                onClick={() =>
                  setPreferences((current) =>
                    current.includes(option) ? current.filter((item) => item !== option) : [...current, option],
                  )
                }
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <Button
          className="w-full h-12 rounded-xl text-base font-semibold bg-[var(--brand)] hover:bg-[var(--brand-deep)] text-white"
          onClick={() => {
            setOpen(false);
            navigate('/ai/loading', { state: { preferences } });
          }}
        >
          开始推荐
        </Button>
      </BottomSheet>
    </Screen>
  );
}
