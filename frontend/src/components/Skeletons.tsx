export function RecipeGridSkeleton() {
  return (
    <div className="recipe-card skeleton">
      <div className="skeleton-box skeleton-box--image" />
      <div className="recipe-card__body">
        <div className="skeleton-box skeleton-box--title" />
        <div className="skeleton-box skeleton-box--text" />
      </div>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="recipe-list-item skeleton">
      <div className="skeleton-box skeleton-box--square" />
      <div className="recipe-list-item__body">
        <div className="skeleton-box skeleton-box--title" />
        <div className="skeleton-box skeleton-box--text" />
        <div className="skeleton-box skeleton-box--text short" />
      </div>
    </div>
  );
}
