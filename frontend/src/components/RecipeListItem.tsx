import { memo } from 'react';
import { Plus, Clock } from 'lucide-react';
import { assetUrl } from '@/api/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getPlaceholderImage } from '@/utils/placeholder';
import type { RecipeCard } from '@/types';
import { QuantityStepper } from './QuantityStepper';

function RecipeListItemComponent({
  recipe,
  quantity,
  onAdd,
  onDecrease,
}: {
  recipe: RecipeCard;
  quantity?: number;
  onAdd: (recipe: RecipeCard, target?: HTMLElement | null) => void;
  onDecrease?: (recipeId: number) => void;
}) {
  return (
    <div className="flex items-center gap-3.5 p-3 rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-hover)]">
      <img
        src={assetUrl(recipe.image_url) || getPlaceholderImage(recipe.name)}
        alt={recipe.name}
        loading="lazy"
        decoding="async"
        className="w-[88px] h-[88px] rounded-xl object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <h3 className="m-0 text-[15px] font-semibold tracking-[-0.18px]">{recipe.name}</h3>
          <Badge variant="outline" className="rounded-full text-[11px] font-medium border-[var(--border-color)]">
            {recipe.category}
          </Badge>
        </div>
        <p className="m-0 mb-1.5 text-sm text-[var(--text-secondary)] line-clamp-1">
          {recipe.description || '这道菜等你来完善描述。'}
        </p>
        <small className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
          <Clock size={12} />
          {recipe.cooking_time ? `${recipe.cooking_time} 分钟` : '快手菜'}
        </small>
      </div>
      {quantity ? (
        <QuantityStepper
          quantity={quantity}
          onDecrease={() => (onDecrease ? onDecrease(recipe.id) : undefined)}
          onIncrease={(target) => onAdd(recipe, target)}
        />
      ) : (
        <Button
          size="icon"
          className="rounded-full bg-[var(--brand)] hover:bg-[var(--brand-deep)] text-white w-10 h-10 flex-shrink-0"
          onClick={(event) => onAdd(recipe, event.currentTarget)}
        >
          <Plus size={18} />
        </Button>
      )}
    </div>
  );
}

export const RecipeListItem = memo(RecipeListItemComponent, (prev, next) => {
  return (
    prev.quantity === next.quantity &&
    prev.recipe.id === next.recipe.id &&
    prev.recipe.updated_at === next.recipe.updated_at &&
    prev.recipe.image_url === next.recipe.image_url &&
    prev.onAdd === next.onAdd &&
    prev.onDecrease === next.onDecrease
  );
});
