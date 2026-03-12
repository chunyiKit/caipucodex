import { assetUrl } from '@/api/client';
import { getPlaceholderImage } from '@/utils/placeholder';
import type { RecipeCard } from '@/types';
import { QuantityStepper } from './QuantityStepper';

export function RecipeListItem({
  recipe,
  quantity,
  onAdd,
  onDecrease,
}: {
  recipe: RecipeCard;
  quantity?: number;
  onAdd: (target?: HTMLElement | null) => void;
  onDecrease?: () => void;
}) {
  return (
    <div className="recipe-list-item pressable-card">
      <img src={assetUrl(recipe.image_url) || getPlaceholderImage(recipe.name)} alt={recipe.name} />
      <div className="recipe-list-item__body">
        <div className="recipe-list-item__header">
          <h3>{recipe.name}</h3>
          <span className={`pill pill--${recipe.category}`}>{recipe.category}</span>
        </div>
        <p>{recipe.description || '这道菜等你来完善描述。'}</p>
        <small>{recipe.cooking_time ? `${recipe.cooking_time} 分钟` : '快手菜'}</small>
      </div>
      {quantity ? (
        <QuantityStepper quantity={quantity} onDecrease={onDecrease || (() => undefined)} onIncrease={onAdd} />
      ) : (
        <button className="fab-mini" type="button" onClick={(event) => onAdd(event.currentTarget)}>
          +
        </button>
      )}
    </div>
  );
}
