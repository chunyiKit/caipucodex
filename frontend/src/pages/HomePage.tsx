import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { getMenus } from '@/api/menus';
import { getRecipes } from '@/api/recipes';
import { BottomSheet } from '@/components/BottomSheet';
import { EmptyState } from '@/components/EmptyState';
import { RecipeCard } from '@/components/RecipeCard';
import { SectionTitle } from '@/components/SectionTitle';
import { Screen } from '@/components/Screen';
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
    <Screen className={isDesktop ? 'home-page home-page--desktop' : 'home-page'}>
      <div className={isDesktop ? 'desktop-home-grid' : ''}>
        <div className={isDesktop ? 'desktop-home-main' : ''}>
          <div className="hero-card hero-card--welcome">
            <div>
              <p className="eyebrow">CaipuCodex</p>
              <h1>今天想吃什么？</h1>
              <p className="muted">{formatDateLong(new Date().toISOString())}</p>
            </div>
            <div className="avatar-badge">家</div>
          </div>

          <div className={isDesktop ? 'desktop-home-actions' : ''}>
            <Link to="/order" className="hero-card hero-card--primary floating-card home-action-card">
              <div>
                <p className="eyebrow">今日入口</p>
                <h2>开始点菜</h2>
                <p>为今天的餐桌挑选一桌热乎饭菜。</p>
              </div>
              <span className="hero-card__emoji">🍽️</span>
            </Link>

            <button type="button" className="hero-card hero-card--secondary home-action-card" onClick={() => setOpen(true)}>
              <div>
                <p className="eyebrow">智能搭配</p>
                <h2>AI 帮你配菜</h2>
                <p>输入偏好，快速生成一份荤素搭配。</p>
              </div>
              <span className="hero-card__emoji">✨</span>
            </button>
          </div>

          <section className={isDesktop ? 'desktop-panel desktop-home-panel' : ''}>
            <SectionTitle title="最近的菜单" action={<Link to="/history">查看全部</Link>} />
            <div className={isDesktop ? 'desktop-history-list' : 'horizontal-scroll'}>
              {(menusQuery.data ?? []).length ? (
                menusQuery.data?.slice(0, 6).map((menu) => (
                  <Link to={`/menus/${menu.id}`} key={menu.id} className={`history-card small ${isDesktop ? 'history-card--home' : ''}`}>
                    <div className="history-card__summary">
                      <strong>{menu.title || '家庭菜单'}</strong>
                      <p>{formatDateLong(menu.menu_date)}</p>
                      <small>{menu.items.slice(0, 3).map((item) => item.recipe_name).join(' · ')}</small>
                    </div>
                  </Link>
                ))
              ) : (
                <EmptyState icon="🗓️" accent="warm" title="还没有菜单记录" description="去点菜生成今天的菜单吧。" />
              )}
            </div>
          </section>
        </div>

        <section className={isDesktop ? 'desktop-panel desktop-home-side' : ''}>
          <SectionTitle title="家常好菜" />
          {recipesQuery.isLoading ? (
            <div className="grid-two"><div className="recipe-card skeleton" /><div className="recipe-card skeleton" /></div>
          ) : popularRecipes.length ? (
            <div className={isDesktop ? 'grid-three' : 'grid-two'}>
              {popularRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          ) : (
            <EmptyState icon="📚" title="还没有菜谱" description="先添加几道拿手菜，首页会为你推荐。" />
          )}
        </section>
      </div>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="AI 智能配菜">
        <div className="sheet-section">
          <label className="field-label">偏好</label>
          <div className="pill-row">
            {preferenceOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={`pill-toggle ${preferences.includes(option) ? 'is-active' : ''}`}
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
        <button
          type="button"
          className="primary-button"
          onClick={() => {
            setOpen(false);
            navigate('/ai/loading', { state: { preferences } });
          }}
        >
          开始推荐
        </button>
      </BottomSheet>
    </Screen>
  );
}
