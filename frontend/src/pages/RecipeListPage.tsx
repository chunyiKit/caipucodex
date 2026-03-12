import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getRecipes } from '@/api/recipes';
import { EmptyState } from '@/components/EmptyState';
import { RecipeCard } from '@/components/RecipeCard';
import { Screen } from '@/components/Screen';
import { categories } from '@/constants/categories';
import { useBreakpoint } from '@/hooks/useBreakpoint';

export function RecipeListPage() {
  const { isDesktop } = useBreakpoint();
  const [keyword, setKeyword] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');
  const query = useQuery({ queryKey: ['recipes', activeCategory, keyword], queryFn: () => getRecipes({ category: activeCategory, search: keyword }) });
  const recipes = useMemo(() => query.data ?? [], [query.data]);

  return (
    <Screen className={isDesktop ? 'recipe-list-page recipe-list-page--desktop' : 'recipe-list-page'}>
      <div className={isDesktop ? 'desktop-recipe-layout' : ''}>
        {isDesktop ? (
          <aside className="desktop-panel desktop-filter-panel">
            <p className="eyebrow">Filters</p>
            <h2>分类筛选</h2>
            <p className="muted">快速切换家常菜分类，桌面端更适合边筛边看。</p>
            <div className="desktop-filter-list">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category}
                  className={`desktop-filter-item ${activeCategory === category ? 'is-active' : ''}`}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </aside>
        ) : null}

        <div className="desktop-recipe-main">
          <header className="page-header desktop-page-header">
            <div>
              <p className="eyebrow">Recipe Book</p>
              <h1>我的菜谱</h1>
            </div>
            {isDesktop ? <Link className="primary-button inline-button" to="/recipes/new">+ 新建菜谱</Link> : null}
          </header>

          <div className={isDesktop ? 'desktop-search-row' : ''}>
            <input className="search-input" placeholder="搜索菜谱" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
          </div>

          {!isDesktop ? (
            <div className="category-scroll">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category}
                  className={`category-chip ${activeCategory === category ? 'is-active' : ''}`}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          ) : null}

          {recipes.length ? (
            <div className={isDesktop ? 'grid-three' : 'grid-two'}>
              {recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="📔"
              title="还没有菜谱"
              description="添加第一道拿手菜，之后点菜会更快。"
              action={<Link className="primary-button inline-button" to="/recipes/new">添加菜谱</Link>}
            />
          )}
        </div>
      </div>

      {!isDesktop ? <Link to="/recipes/new" className="floating-fab">+</Link> : null}
    </Screen>
  );
}
