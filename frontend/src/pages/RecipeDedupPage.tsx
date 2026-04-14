import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Trash2, Eye, Copy } from 'lucide-react';
import { assetUrl } from '@/api/client';
import { deleteRecipe, getRecipes } from '@/api/recipes';
import { ActionSheet } from '@/components/ActionSheet';
import { EmptyState } from '@/components/EmptyState';
import { RecipePreviewModal } from '@/components/RecipePreviewModal';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ToastProvider';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { getPlaceholderImage } from '@/utils/placeholder';
import type { RecipeCard } from '@/types';

interface DuplicateGroup {
  name: string;
  recipes: RecipeCard[];
}

export function RecipeDedupPage() {
  const { isDesktop } = useBreakpoint();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [scanned, setScanned] = useState(false);
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<RecipeCard | null>(null);

  const query = useQuery({
    queryKey: ['recipes'],
    queryFn: () => getRecipes({ limit: 100 }),
    enabled: scanned,
  });

  const duplicateGroups = useMemo<DuplicateGroup[]>(() => {
    if (!query.data?.items) return [];
    const grouped = new Map<string, RecipeCard[]>();
    for (const recipe of query.data.items) {
      const key = recipe.name.trim();
      const list = grouped.get(key) ?? [];
      grouped.set(key, [...list, recipe]);
    }
    return Array.from(grouped.entries())
      .filter(([, recipes]) => recipes.length > 1)
      .map(([name, recipes]) => ({ name, recipes }))
      .sort((a, b) => b.recipes.length - a.recipes.length);
  }, [query.data]);

  const totalDuplicates = useMemo(
    () => duplicateGroups.reduce((sum, g) => sum + g.recipes.length - 1, 0),
    [duplicateGroups],
  );

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteRecipe(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['recipes'] });
      showToast('菜谱已删除');
      setPendingDelete(null);
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : '删除失败', 'error');
      setPendingDelete(null);
    },
  });

  return (
    <Screen>
      <TopBar title="菜谱去重" />

      <div className={isDesktop ? 'max-w-3xl mx-auto' : ''}>
        {/* Hero section */}
        <div className="p-5 rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] mb-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[var(--brand-soft)] grid place-items-center mx-auto mb-3">
            <Copy size={24} className="text-[var(--brand)]" />
          </div>
          <h2 className="m-0 text-lg font-semibold mb-1">去重扫描</h2>
          <p className="m-0 text-sm text-[var(--text-secondary)] mb-4">
            扫描菜谱库中名称相同的菜品，快速清理重复项
          </p>

          {!scanned ? (
            <Button
              className="bg-[var(--brand)] hover:bg-[var(--brand-deep)] text-white rounded-xl h-11 px-8"
              onClick={() => setScanned(true)}
            >
              <Search size={16} />
              开始扫描
            </Button>
          ) : query.isLoading ? (
            <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)]">
              <div className="w-5 h-5 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
              扫描中...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <span className="text-sm text-[var(--text-secondary)]">
                发现 <span className="font-semibold text-[var(--brand)]">{duplicateGroups.length}</span> 组重复，
                共 <span className="font-semibold text-[var(--brand)]">{totalDuplicates}</span> 个可清理
              </span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['recipes'] })}
              >
                重新扫描
              </Button>
            </div>
          )}
        </div>

        {/* Results */}
        {scanned && !query.isLoading && duplicateGroups.length === 0 ? (
          <EmptyState icon="✨" title="没有重复菜谱" description="你的菜谱库很干净，没有发现重复项。" />
        ) : null}

        {duplicateGroups.map((group) => (
          <div
            key={group.name}
            className="p-4 rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] mb-3"
          >
            {/* Group header */}
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[var(--border-color)]">
              <h3 className="m-0 text-base font-semibold flex-1">{group.name}</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-[var(--brand-soft)] text-[var(--brand)] text-xs font-semibold">
                {group.recipes.length} 个重复
              </span>
            </div>

            {/* Recipe list */}
            <div className="space-y-2.5">
              {group.recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--surface-secondary)] hover:bg-[var(--surface-button)] transition-colors"
                >
                  <img
                    src={assetUrl(recipe.image_url) || getPlaceholderImage(recipe.name)}
                    alt={recipe.name}
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="m-0 text-sm font-medium truncate">{recipe.name}</p>
                    <p className="m-0 text-xs text-[var(--text-secondary)]">
                      {recipe.category} · {recipe.difficulty} · {new Date(recipe.created_at).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 rounded-full text-[var(--text-secondary)] hover:text-[var(--brand)]"
                      onClick={() => setPreviewId(recipe.id)}
                    >
                      <Eye size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 rounded-full text-[var(--text-secondary)] hover:text-[#c13515]"
                      onClick={() => setPendingDelete(recipe)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Preview modal */}
      <RecipePreviewModal recipeId={previewId} onClose={() => setPreviewId(null)} />

      {/* Delete confirmation */}
      <ActionSheet
        open={Boolean(pendingDelete)}
        title="删除这个菜谱？"
        description={pendingDelete ? `"${pendingDelete.name}" 将被永久删除，此操作不可撤销。` : ''}
        confirmLabel="确认删除"
        confirmTone="danger"
        pending={deleteMutation.isPending}
        onConfirm={() => {
          if (pendingDelete) deleteMutation.mutate(pendingDelete.id);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </Screen>
  );
}
