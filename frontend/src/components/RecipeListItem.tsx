import { memo } from 'react';
import { assetUrl } from '@/api/client';
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
    <div className="recipe-list-item pressable-card">
      <img
        src={assetUrl(recipe.image_url) || getPlaceholderImage(recipe.name)}
        alt={recipe.name}
        loading="lazy"
        decoding="async"
      />
      <div className="recipe-list-item__body">
        <div className="recipe-list-item__header">
          <h3>{recipe.name}</h3>
          <span className={`pill pill--${recipe.category}`}>{recipe.category}</span>
        </div>
        <p>{recipe.description || '这道菜等你来完善描述。'}</p>
        <small>{recipe.cooking_time ? `${recipe.cooking_time} 分钟` : '快手菜'}</small>
      </div>
      {quantity ? (
        <QuantityStepper
          quantity={quantity}
          onDecrease={() => (onDecrease ? onDecrease(recipe.id) : undefined)}
          onIncrease={(target) => onAdd(recipe, target)}
        />
      ) : (
        <button className="fab-mini" type="button" onClick={(event) => onAdd(recipe, event.currentTarget)}>
          +
        </button>
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
