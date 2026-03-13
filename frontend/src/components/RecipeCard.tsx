import { Link } from 'react-router-dom';
import { assetUrl } from '@/api/client';
import { getPlaceholderImage } from '@/utils/placeholder';
import type { RecipeCard as RecipeCardType } from '@/types';

export function RecipeCard({ recipe }: { recipe: RecipeCardType }) {
  return (
    <Link to={`/recipes/${recipe.id}`} className="recipe-card">
      <img
        src={assetUrl(recipe.image_url) || getPlaceholderImage(recipe.name)}
        alt={recipe.name}
        loading="lazy"
        decoding="async"
      />
      <div className="recipe-card__overlay">{recipe.category}</div>
      <div className="recipe-card__body">
        <h3>{recipe.name}</h3>
        <p>{recipe.cooking_time ? `${recipe.cooking_time} 分钟` : '家常美味'} · {recipe.difficulty}</p>
      </div>
    </Link>
  );
}
