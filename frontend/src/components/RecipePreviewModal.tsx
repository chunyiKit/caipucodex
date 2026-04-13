import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Clock, Flame, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { assetUrl } from '@/api/client';
import { getRecipe } from '@/api/recipes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getPlaceholderImage } from '@/utils/placeholder';

export function RecipePreviewModal({
  recipeId,
  onClose,
}: {
  recipeId: number | null;
  onClose: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const query = useQuery({
    queryKey: ['recipe', recipeId],
    queryFn: () => getRecipe(recipeId!),
    enabled: recipeId !== null,
  });

  const recipe = query.data;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {recipeId !== null ? (
        <>
          {/* Backdrop */}
          <motion.button
            type="button"
            className="fixed inset-0 z-50 bg-black/40 border-none cursor-default"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              className="relative w-full max-w-[420px] max-h-[80vh] bg-white rounded-[var(--radius-large)] shadow-[0_24px_64px_rgba(0,0,0,0.2)] pointer-events-auto overflow-hidden"
              initial={{ opacity: 0, scale: 0.6, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { type: 'spring', damping: 20, stiffness: 300, mass: 0.8 }
              }
            >
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 z-10 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white"
                onClick={onClose}
              >
                <X size={18} />
              </Button>

              {query.isLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <div className="w-8 h-8 border-3 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : recipe ? (
                <div className="overflow-y-auto max-h-[80vh]">
                  {/* Cover image */}
                  <img
                    src={assetUrl(recipe.image_url) || getPlaceholderImage(recipe.name)}
                    alt={recipe.name}
                    className="w-full aspect-[4/3] object-cover"
                  />

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h2 className="m-0 text-xl font-bold tracking-[-0.18px]">{recipe.name}</h2>
                      <Badge
                        variant="secondary"
                        className="flex-shrink-0 bg-[var(--brand-soft)] text-[var(--brand)] border-0 rounded-full text-xs font-semibold"
                      >
                        {recipe.category}
                      </Badge>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-4 mb-4 text-sm text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {recipe.cooking_time ?? 20} 分钟
                      </span>
                      <span className="flex items-center gap-1">
                        <Flame size={14} />
                        {recipe.difficulty}
                      </span>
                    </div>

                    {recipe.description ? (
                      <p className="m-0 mb-4 text-sm text-[var(--text-secondary)] leading-relaxed">
                        {recipe.description}
                      </p>
                    ) : null}

                    {/* Ingredients */}
                    {recipe.ingredients.length > 0 ? (
                      <div className="mb-4">
                        <h3 className="m-0 mb-2 text-sm font-semibold">食材</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {recipe.ingredients.map((item, index) => (
                            <span
                              key={`ingredient-${index}`}
                              className="px-2.5 py-1 rounded-lg bg-[var(--surface-secondary)] text-xs text-[var(--text-secondary)]"
                            >
                              {item.name}
                              {item.amount ? ` ${item.amount}` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {/* Steps */}
                    {recipe.cooking_steps.length > 0 ? (
                      <div>
                        <h3 className="m-0 mb-2 text-sm font-semibold">步骤</h3>
                        <ol className="m-0 pl-4 space-y-1.5">
                          {recipe.cooking_steps.map((step, index) => (
                            <li key={`step-${index}`} className="text-sm text-[var(--text-secondary)] leading-relaxed">
                              {step.description}
                            </li>
                          ))}
                        </ol>
                      </div>
                    ) : null}

                    {/* Created at */}
                    <p className="m-0 mt-4 text-xs text-[var(--text-secondary)]/60">
                      创建于 {new Date(recipe.created_at).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
