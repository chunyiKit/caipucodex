import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Minus, Plus, X, ShoppingCart } from 'lucide-react';
import { getCategories } from '@/api/categories';
import { getRecipes } from '@/api/recipes';
import { ActionSheet } from '@/components/ActionSheet';
import { BottomSheet } from '@/components/BottomSheet';
import { EmptyState } from '@/components/EmptyState';
import { RecipeListItem } from '@/components/RecipeListItem';
import { Screen } from '@/components/Screen';
import { StaggerItem } from '@/components/StaggerItem';
import { SwipeActionRow } from '@/components/SwipeActionRow';
import { TopBar } from '@/components/TopBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { defaultCategories } from '@/constants/categories';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useMenuDraftStore } from '@/store/menuDraftStore';
import { useOrderStore } from '@/store/orderStore';
import { cn } from '@/lib/utils';

interface FlyingItem {
  id: number;
  label: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export function OrderPage() {
  const navigate = useNavigate();
  const { isDesktop } = useBreakpoint();
  const prefersReducedMotion = useReducedMotion();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const [barPulse, setBarPulse] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<{ id: number; name: string } | null>(null);
  const lastCountRef = useRef(0);
  const cartTargetRef = useRef<HTMLElement | null>(null);
  const items = useOrderStore((state) => state.items);
  const addRecipe = useOrderStore((state) => state.addRecipe);
  const updateQuantity = useOrderStore((state) => state.updateQuantity);
  const removeRecipe = useOrderStore((state) => state.removeRecipe);
  const setDraft = useMenuDraftStore((state) => state.setDraft);
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const categories = useMemo(() => categoriesQuery.data ?? defaultCategories, [categoriesQuery.data]);
  const query = useQuery({
    queryKey: ['recipes', 'order', activeCategory, search],
    queryFn: () => getRecipes({ category: activeCategory, search, limit: 100 }),
  });
  const recipes = useMemo(() => query.data?.items ?? [], [query.data]);
  const selectedCounts = useMemo(() => new Map(items.map((item) => [item.recipe_id, item.quantity] as const)), [items]);
  const enableListAnimations = isDesktop && !prefersReducedMotion;
  const enableFlyAnimation = isDesktop && !prefersReducedMotion;

  useEffect(() => {
    if (items.length > lastCountRef.current) {
      setBarPulse(true);
      const timer = window.setTimeout(() => setBarPulse(false), 360);
      lastCountRef.current = items.length;
      return () => window.clearTimeout(timer);
    }
    lastCountRef.current = items.length;
    return undefined;
  }, [items.length]);

  const triggerFlyAnimation = useCallback((target?: HTMLElement | null, label?: string) => {
    if (!enableFlyAnimation || !target || !cartTargetRef.current) return;
    const sourceRect = target.getBoundingClientRect();
    const destinationRect = cartTargetRef.current.getBoundingClientRect();
    const id = Date.now() + Math.random();
    setFlyingItems((current) => [
      ...current.slice(-1),
      {
        id,
        label: (label || '菜').slice(0, 1),
        startX: sourceRect.left + sourceRect.width / 2,
        startY: sourceRect.top + sourceRect.height / 2,
        endX: destinationRect.left + 32,
        endY: destinationRect.top + destinationRect.height / 2,
      },
    ]);
  }, [enableFlyAnimation]);

  const handleAddRecipe = useCallback((recipe: (typeof recipes)[number], target?: HTMLElement | null) => {
    addRecipe(recipe);
    triggerFlyAnimation(target, recipe.name);
  }, [addRecipe, triggerFlyAnimation]);

  const handleDecrease = useCallback((recipeId: number) => {
    updateQuantity(recipeId, -1);
  }, [updateQuantity]);

  const createDraft = useCallback(() => {
    setDraft({
      title: '今日菜单',
      menu_date: new Date().toISOString().slice(0, 10),
      is_ai_generated: false,
      items,
    });
    setSheetOpen(false);
    navigate('/menus/preview');
  }, [items, navigate, setDraft]);

  return (
    <Screen>
      {!isDesktop ? <TopBar title="点菜" onBack={() => navigate('/')} /> : null}

      {isDesktop ? (
        <div className="grid grid-cols-[280px_minmax(0,1fr)_360px] gap-6 items-start">
          {/* Filters */}
          <aside className="sticky top-0 p-5 rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)]">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-[var(--brand)] mb-1">Filters</p>
            <h2 className="text-lg font-semibold m-0 mb-1">今天想做什么</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-4">先筛分类，再在中间列表里挑菜。</p>
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
              <Input className="pl-10 h-10 rounded-xl" placeholder="搜索菜品" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
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

          {/* Recipe list */}
          <section className="min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="m-0 text-lg font-semibold">菜品列表</h2>
              <span className="text-sm text-[var(--text-secondary)]">共 {recipes.length} 道</span>
            </div>
            <div className="flex flex-col gap-3 max-h-[calc(100vh-220px)] overflow-auto pr-1">
              {recipes.length ? (
                recipes.map((recipe, index) => {
                  const selected = selectedCounts.get(recipe.id);
                  return (
                    <StaggerItem key={recipe.id} index={index} disabled={!enableListAnimations}>
                      <RecipeListItem
                        recipe={recipe}
                        quantity={selected}
                        onAdd={handleAddRecipe}
                        onDecrease={handleDecrease}
                      />
                    </StaggerItem>
                  );
                })
              ) : (
                <EmptyState
                  icon={search ? '🔎' : '🥬'}
                  title={search ? '没有找到匹配菜品' : '这一类还没有菜'}
                  description={search ? '换个关键词试试。' : '可以先切换分类，或到菜谱页补充内容。'}
                />
              )}
            </div>
          </section>

          {/* Cart */}
          <aside
            className={cn(
              'sticky top-0 p-5 rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] transition-shadow',
              barPulse && 'shadow-[var(--shadow-hover)]',
            )}
          >
            <div ref={cartTargetRef as React.RefObject<HTMLDivElement>} className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-[11px] font-semibold tracking-wider uppercase text-[var(--brand)] mb-1">Cart</p>
                <h2 className="text-lg font-semibold m-0">已选菜品</h2>
              </div>
              <Badge className="bg-[var(--brand-soft)] text-[var(--brand)] border-0 text-base font-bold min-w-[40px] h-10 rounded-xl grid place-items-center">
                {items.length}
              </Badge>
            </div>
            <div className="flex flex-col gap-2.5 max-h-[calc(100vh-330px)] overflow-auto mb-4">
              {items.length ? (
                items.map((item) => (
                  <div key={item.recipe_name} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--surface-secondary)]">
                    <div className="min-w-0">
                      <strong className="block text-sm font-medium truncate">{item.recipe_name}</strong>
                      <p className="m-0 text-xs text-[var(--text-secondary)]">{item.recipe_category}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full" onClick={() => item.recipe_id && handleDecrease(item.recipe_id)}>
                        <Minus size={12} />
                      </Button>
                      <span className="min-w-[20px] text-center text-sm font-semibold">{item.quantity}</span>
                      <Button
                        variant="ghost" size="icon" className="w-7 h-7 rounded-full"
                        onClick={(event) => {
                          const recipe = recipes.find((entry) => entry.id === item.recipe_id);
                          if (recipe) handleAddRecipe(recipe, event.currentTarget);
                        }}
                      >
                        <Plus size={12} />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full text-[#c13515]" onClick={() => item.recipe_id && setPendingRemove({ id: item.recipe_id, name: item.recipe_name })}>
                        <X size={12} />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState icon="🧺" title="购物篮还是空的" description="从左边和中间挑几道菜。" />
              )}
            </div>
            <Button
              className="w-full h-11 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-deep)] text-white font-semibold"
              onClick={createDraft}
              disabled={!items.length}
            >
              生成菜单
            </Button>
          </aside>
        </div>
      ) : (
        <>
          {/* Mobile search */}
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <Input className="pl-10 h-11 rounded-xl" placeholder="搜索菜品" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>

          {/* Mobile categories */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-3">
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

          {/* Mobile recipe list */}
          <div className="flex flex-col gap-3 pb-[120px]">
            {recipes.length ? (
              recipes.map((recipe) => {
                const selected = selectedCounts.get(recipe.id);
                return (
                  <RecipeListItem
                    key={recipe.id}
                    recipe={recipe}
                    quantity={selected}
                    onAdd={handleAddRecipe}
                    onDecrease={handleDecrease}
                  />
                );
              })
            ) : (
              <EmptyState
                icon={search ? '🔎' : '🥬'}
                title={search ? '没有找到匹配菜品' : '这一类还没有菜'}
                description={search ? '换个关键词试试。' : '可以先切换分类，或到菜谱页补充内容。'}
              />
            )}
          </div>

          {/* Mobile selection bar */}
          <button
            ref={cartTargetRef as React.RefObject<HTMLButtonElement>}
            type="button"
            className={cn(
              'selection-bar',
              items.length && 'is-active',
              barPulse && 'is-pulsing',
            )}
            onClick={() => items.length && setSheetOpen(true)}
          >
            <div>
              <strong className="block text-sm">{items.length ? `已选 ${items.length} 道菜` : '还没有选择菜品'}</strong>
              <div className="flex gap-1.5 mt-2">
                {items.length ? (
                  items.slice(0, 5).map((item) => (
                    <span key={item.recipe_name} className="w-7 h-7 grid place-items-center rounded-full bg-[var(--brand-soft)] text-[var(--brand)] text-xs font-bold">
                      {item.recipe_name.slice(0, 1)}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[var(--text-secondary)]">先选几道菜，再生成菜单</span>
                )}
              </div>
            </div>
            <ShoppingCart size={18} />
          </button>

          {/* Mobile cart sheet */}
          <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="已选菜品">
            <div className="flex flex-col gap-2.5 max-h-[42vh] overflow-y-auto">
              {items.length ? (
                items.map((item) => (
                  <SwipeActionRow
                    key={item.recipe_name}
                    actionLabel="删除"
                    onAction={() => item.recipe_id && setPendingRemove({ id: item.recipe_id, name: item.recipe_name })}
                  >
                    <div className="flex items-center justify-between gap-3 p-3.5 rounded-[var(--radius-card)] bg-white">
                      <div className="min-w-0">
                        <strong className="block text-sm font-medium">{item.recipe_name}</strong>
                        <p className="m-0 text-xs text-[var(--text-secondary)]">{item.recipe_category}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" onClick={() => item.recipe_id && handleDecrease(item.recipe_id)}>
                          <Minus size={14} />
                        </Button>
                        <span className="min-w-[20px] text-center text-sm font-semibold">{item.quantity}</span>
                        <Button
                          variant="ghost" size="icon" className="w-8 h-8 rounded-full"
                          onClick={(event) => {
                            const recipe = recipes.find((entry) => entry.id === item.recipe_id);
                            if (recipe) handleAddRecipe(recipe, event.currentTarget);
                          }}
                        >
                          <Plus size={14} />
                        </Button>
                      </div>
                    </div>
                  </SwipeActionRow>
                ))
              ) : (
                <EmptyState icon="🧺" title="购物篮还是空的" description="挑几道喜欢的菜。" />
              )}
            </div>
            <Button
              className="w-full h-12 mt-4 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-deep)] text-white font-semibold"
              onClick={createDraft}
              disabled={!items.length}
            >
              生成菜单
            </Button>
          </BottomSheet>
        </>
      )}

      <ActionSheet
        open={Boolean(pendingRemove)}
        title="从已选菜品里删除这道菜？"
        description={pendingRemove ? `"${pendingRemove.name}" 将从当前购物篮中移除。` : ''}
        confirmLabel="确认删除"
        onConfirm={() => {
          if (pendingRemove) removeRecipe(pendingRemove.id);
          setPendingRemove(null);
        }}
        onCancel={() => setPendingRemove(null)}
      />

      {enableFlyAnimation ? (
        <AnimatePresence>
          {flyingItems.map((item) => (
            <motion.div
              key={item.id}
              className="fly-token"
              initial={{ x: item.startX - 18, y: item.startY - 18, scale: 1, opacity: 0.95 }}
              animate={{ x: item.endX - 18, y: item.endY - 18, scale: 0.34, opacity: 0.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
              onAnimationComplete={() => setFlyingItems((current) => current.filter((entry) => entry.id !== item.id))}
            >
              {item.label}
            </motion.div>
          ))}
        </AnimatePresence>
      ) : null}
    </Screen>
  );
}
