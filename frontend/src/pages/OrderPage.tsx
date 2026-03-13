import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getRecipes } from '@/api/recipes';
import { ActionSheet } from '@/components/ActionSheet';
import { BottomSheet } from '@/components/BottomSheet';
import { EmptyState } from '@/components/EmptyState';
import { RecipeListItem } from '@/components/RecipeListItem';
import { Screen } from '@/components/Screen';
import { StaggerItem } from '@/components/StaggerItem';
import { SwipeActionRow } from '@/components/SwipeActionRow';
import { TopBar } from '@/components/TopBar';
import { categories } from '@/constants/categories';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useMenuDraftStore } from '@/store/menuDraftStore';
import { useOrderStore } from '@/store/orderStore';

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
  const query = useQuery({
    queryKey: ['recipes', 'order', activeCategory, search],
    queryFn: () => getRecipes({ category: activeCategory, search }),
  });
  const recipes = useMemo(() => query.data ?? [], [query.data]);
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
    <Screen className={isDesktop ? 'order-page order-page--desktop' : 'order-page'}>
      {!isDesktop ? <TopBar title="点菜" onBack={() => navigate('/')} /> : null}

      {isDesktop ? (
        <div className="desktop-order-layout">
          <aside className="desktop-panel desktop-order-sidebar">
            <p className="eyebrow">Filters</p>
            <h2>今天想做什么</h2>
            <p className="muted">先筛分类，再在中间列表里挑菜，右侧会实时汇总已选内容。</p>
            <input className="search-input" placeholder="搜索菜品" value={search} onChange={(event) => setSearch(event.target.value)} />
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

          <section className="desktop-order-main">
            <div className="section-title"><h2>菜品列表</h2><span className="muted">共 {recipes.length} 道</span></div>
            <div className="list-stack desktop-order-list">
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
                  accent="calm"
                  title={search ? '没有找到匹配菜品' : '这一类还没有菜'}
                  description={search ? '换个关键词试试，或者先去新建一道拿手菜。' : '可以先切换分类，或者到菜谱页补充内容。'}
                />
              )}
            </div>
          </section>

          <aside className={`desktop-panel desktop-order-cart ${barPulse ? 'is-pulsing' : ''}`}>
            <div ref={cartTargetRef as React.RefObject<HTMLDivElement>} className="desktop-order-cart__header">
              <div>
                <p className="eyebrow">Cart</p>
                <h2>已选菜品</h2>
              </div>
              <span className="desktop-order-cart__count">{items.length}</span>
            </div>
            <div className="cart-list desktop-order-cart__list">
              {items.length ? (
                items.map((item) => (
                  <div key={item.recipe_name} className="cart-item cart-item--desktop">
                    <div>
                      <strong>{item.recipe_name}</strong>
                      <p>{item.recipe_category}</p>
                    </div>
                    <div className="cart-item__actions">
                      <button type="button" className="ghost-button small" onClick={() => item.recipe_id && handleDecrease(item.recipe_id)}>-</button>
                      <span className="cart-item__count">{item.quantity}</span>
                      <button
                        type="button"
                        className="ghost-button small"
                        onClick={(event) => {
                          const recipe = recipes.find((entry) => entry.id === item.recipe_id);
                          if (recipe) handleAddRecipe(recipe, event.currentTarget);
                        }}
                      >
                        +
                      </button>
                      <button type="button" className="ghost-button small" onClick={() => item.recipe_id && setPendingRemove({ id: item.recipe_id, name: item.recipe_name })}>移除</button>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState icon="🧺" accent="warm" title="购物篮还是空的" description="从左边和中间挑几道菜，右侧会自动汇总。" />
              )}
            </div>
            <button type="button" className="primary-button" onClick={createDraft} disabled={!items.length}>生成菜单</button>
          </aside>
        </div>
      ) : (
        <>
          <input className="search-input" placeholder="搜索菜品" value={search} onChange={(event) => setSearch(event.target.value)} />
          <div className="category-scroll">
            {categories.map((category, index) => (
              <StaggerItem key={category} index={index} disabled>
                <button
                  type="button"
                  className={`category-chip ${activeCategory === category ? 'is-active' : ''}`}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              </StaggerItem>
            ))}
          </div>
          <div className="list-stack with-bottom-bar">
            {recipes.length ? (
              recipes.map((recipe, index) => {
                const selected = selectedCounts.get(recipe.id);
                return (
                  <StaggerItem key={recipe.id} index={index} disabled>
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
                accent="calm"
                title={search ? '没有找到匹配菜品' : '这一类还没有菜'}
                description={search ? '换个关键词试试，或者先去新建一道拿手菜。' : '可以先切换分类，或者到菜谱页补充内容。'}
              />
            )}
          </div>

          <button
            ref={cartTargetRef as React.RefObject<HTMLButtonElement>}
            type="button"
            className={`selection-bar ${items.length ? 'is-active' : ''} ${barPulse ? 'is-pulsing' : ''}`}
            onClick={() => items.length && setSheetOpen(true)}
          >
            <div>
              <strong>{items.length ? `已选 ${items.length} 道菜` : '还没有选择菜品'}</strong>
              <div className="selection-bar__thumbs">
                {items.length ? (
                  items.slice(0, 5).map((item) => (
                    <span key={item.recipe_name} className="thumb-dot">{item.recipe_name.slice(0, 1)}</span>
                  ))
                ) : (
                  <span className="selection-bar__hint">先选几道菜，再生成菜单</span>
                )}
              </div>
            </div>
            <span className="selection-bar__arrow">⌃</span>
          </button>

          <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="已选菜品">
            <div className="cart-list">
              {items.length ? (
                items.map((item, index) => (
                  <StaggerItem key={item.recipe_name} index={index} disabled>
                    <SwipeActionRow
                      actionLabel="删除"
                      onAction={() => item.recipe_id && setPendingRemove({ id: item.recipe_id, name: item.recipe_name })}
                    >
                      <div className="cart-item cart-item--swipe">
                        <div>
                          <strong>{item.recipe_name}</strong>
                          <p>{item.recipe_category}</p>
                        </div>
                        <div className="cart-item__actions">
                          <button type="button" className="ghost-button small" onClick={() => item.recipe_id && handleDecrease(item.recipe_id)}>-</button>
                          <span className="cart-item__count">{item.quantity}</span>
                          <button
                            type="button"
                            className="ghost-button small"
                            onClick={(event) => {
                              const recipe = recipes.find((entry) => entry.id === item.recipe_id);
                              if (recipe) handleAddRecipe(recipe, event.currentTarget);
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </SwipeActionRow>
                  </StaggerItem>
                ))
              ) : (
                <EmptyState icon="🧺" title="购物篮还是空的" description="挑几道喜欢的菜，底部会自动汇总到这里。" accent="warm" />
              )}
            </div>
            <button type="button" className="primary-button" onClick={createDraft} disabled={!items.length}>生成菜单</button>
          </BottomSheet>
        </>
      )}

      <ActionSheet
        open={Boolean(pendingRemove)}
        title="从已选菜品里删除这道菜？"
        description={pendingRemove ? `“${pendingRemove.name}” 将从当前购物篮中移除。` : ''}
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
