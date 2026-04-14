import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { getCategories } from '@/api/categories';
import { getRecipes } from '@/api/recipes';
import { EmptyState } from '@/components/EmptyState';
import { RecipeCard } from '@/components/RecipeCard';
import { RecipeGridSkeleton } from '@/components/Skeletons';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { defaultCategories } from '@/constants/categories';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;

export function RecipeListPage() {
  const { isDesktop } = useBreakpoint();
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('q') ?? '';
  const activeCategory = searchParams.get('category') ?? '全部';

  const setKeyword = useCallback(
    (value: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) {
          next.set('q', value);
        } else {
          next.delete('q');
        }
        return next;
      }, { replace: true });
    },
    [setSearchParams],
  );

  const setActiveCategory = useCallback(
    (value: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value && value !== '全部') {
          next.set('category', value);
        } else {
          next.delete('category');
        }
        return next;
      }, { replace: true });
    },
    [setSearchParams],
  );
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const categories = useMemo(() => categoriesQuery.data ?? defaultCategories, [categoriesQuery.data]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['recipes', activeCategory, keyword],
    queryFn: ({ pageParam = 0 }) =>
      getRecipes({ category: activeCategory, search: keyword, skip: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + page.items.length, 0);
      return loaded < lastPage.total ? loaded : undefined;
    },
  });

  const recipes = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );
  const total = data?.pages[0]?.total ?? 0;

  // Intersection observer for infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersect, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  const skeletonCount = isDesktop ? 6 : 4;

  return (
    <Screen>
      <div className={isDesktop ? 'grid grid-cols-[280px_minmax(0,1fr)] gap-6 items-start' : ''}>
        {/* Desktop filter sidebar */}
        {isDesktop ? (
          <aside className="sticky top-0 p-5 rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)]">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-[var(--brand)] mb-1">Filters</p>
            <h2 className="text-lg font-semibold m-0 mb-1">分类筛选</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-4">快速切换家常菜分类</p>
            <div className="flex flex-col gap-2">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                    activeCategory === category
                      ? 'bg-[var(--brand-soft)] text-[var(--brand)]'
                      : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:bg-[var(--surface-button)]',
                  )}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </aside>
        ) : null}

        <div className="min-w-0">
          {/* Header */}
          <header className={isDesktop ? 'flex items-center justify-between gap-4 mb-4' : 'mb-4'}>
            <div>
              <p className="text-[11px] font-semibold tracking-wider uppercase text-[var(--brand)] mb-1">Recipe Book</p>
              <h1 className="m-0 text-[26px] font-bold tracking-[-0.44px]">我的菜谱</h1>
              <p className="m-0 mt-1 text-sm text-[var(--text-secondary)]">
                共 <span className="font-semibold text-[var(--text-primary)]">{total}</span> 道菜谱
              </p>
            </div>
            {isDesktop ? (
              <Button asChild className="bg-[var(--brand)] hover:bg-[var(--brand-deep)] text-white rounded-lg">
                <Link to="/recipes/new"><Plus size={16} /> 新建菜谱</Link>
              </Button>
            ) : null}
          </header>

          {/* Search */}
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <Input
              className="pl-10 h-11 rounded-xl border-[var(--border-color)]"
              placeholder="搜索菜谱"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>

          {/* Mobile category pills */}
          {!isDesktop ? (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-4">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category}
                  className={cn(
                    'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors',
                    activeCategory === category
                      ? 'bg-[var(--brand)] text-white border-[var(--brand)]'
                      : 'bg-white text-[var(--text-secondary)] border-[var(--border-color)]',
                  )}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          ) : null}

          {/* Recipe grid */}
          {isLoading ? (
            <div className={isDesktop ? 'grid grid-cols-3 gap-4' : 'grid grid-cols-2 gap-3.5'}>
              {Array.from({ length: skeletonCount }, (_, i) => (
                <RecipeGridSkeleton key={i} />
              ))}
            </div>
          ) : recipes.length ? (
            <>
              <div className={isDesktop ? 'grid grid-cols-3 gap-4' : 'grid grid-cols-2 gap-3.5'}>
                {recipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
                {isFetchingNextPage
                  ? Array.from({ length: isDesktop ? 3 : 2 }, (_, i) => (
                      <RecipeGridSkeleton key={`loading-${i}`} />
                    ))
                  : null}
              </div>
              <div ref={sentinelRef} className="h-1" />
            </>
          ) : (
            <EmptyState
              icon="📔"
              title="还没有菜谱"
              description="添加第一道拿手菜，之后点菜会更快。"
              action={
                <Button asChild className="bg-[var(--brand)] hover:bg-[var(--brand-deep)] text-white rounded-lg">
                  <Link to="/recipes/new">添加菜谱</Link>
                </Button>
              }
            />
          )}
        </div>
      </div>

      {/* Mobile FAB */}
      {!isDesktop ? (
        <Link
          to="/recipes/new"
          className="fixed right-4 bottom-[calc(90px+var(--safe-bottom))] w-12 h-12 rounded-full bg-[var(--brand)] text-white shadow-[var(--shadow-card)] grid place-items-center hover:bg-[var(--brand-deep)] transition-colors z-20"
        >
          <Plus size={22} />
        </Link>
      ) : null}
    </Screen>
  );
}
