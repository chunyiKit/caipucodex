import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { assetUrl } from '@/api/client';
import { Badge } from '@/components/ui/badge';
import { getPlaceholderImage } from '@/utils/placeholder';
import type { RecipeCard as RecipeCardType } from '@/types';

export function RecipeCard({ recipe }: { recipe: RecipeCardType }) {
  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className="group block overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-hover)]"
    >
      <div className="relative overflow-hidden">
        <img
          src={assetUrl(recipe.image_url) || getPlaceholderImage(recipe.name)}
          alt={recipe.name}
          loading="lazy"
          decoding="async"
          className="w-full aspect-[4/3] object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <Badge
          variant="secondary"
          className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm text-[var(--text-primary)] border-0 rounded-full text-xs font-semibold"
        >
          {recipe.category}
        </Badge>
      </div>
      <div className="p-3.5">
        <h3 className="m-0 mb-1.5 text-[15px] font-semibold tracking-[-0.18px] text-[var(--text-primary)]">
          {recipe.name}
        </h3>
        <p className="m-0 text-[13px] text-[var(--text-secondary)] flex items-center gap-1">
          <Clock size={12} />
          {recipe.cooking_time ? `${recipe.cooking_time} 分钟` : '家常美味'} · {recipe.difficulty}
        </p>
      </div>
    </Link>
  );
}
