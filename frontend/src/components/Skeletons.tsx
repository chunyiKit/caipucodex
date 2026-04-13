import { Skeleton } from '@/components/ui/skeleton';

export function RecipeGridSkeleton() {
  return (
    <div className="rounded-[var(--radius-card)] overflow-hidden shadow-[var(--shadow-card)]">
      <Skeleton className="w-full aspect-[4/3]" />
      <div className="p-3.5">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-3.5 w-full" />
      </div>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="flex items-center gap-3.5 p-3 rounded-[var(--radius-card)] shadow-[var(--shadow-card)]">
      <Skeleton className="w-[88px] h-[88px] rounded-xl flex-shrink-0" />
      <div className="flex-1">
        <Skeleton className="h-5 w-3/4 mb-2.5" />
        <Skeleton className="h-3.5 w-full mb-2" />
        <Skeleton className="h-3 w-3/5" />
      </div>
    </div>
  );
}
