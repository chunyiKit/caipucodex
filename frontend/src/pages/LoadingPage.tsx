import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { recommendMenu } from '@/api/ai';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/ToastProvider';
import { useMenuDraftStore } from '@/store/menuDraftStore';

export function LoadingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { setDraft } = useMenuDraftStore();
  const state = (location.state as { preferences?: string[] } | null) ?? null;

  const mutation = useMutation({
    mutationFn: recommendMenu,
    onSuccess: (response, variables) => {
      setDraft({
        title: 'AI 推荐菜单',
        menu_date: new Date().toISOString().slice(0, 10),
        is_ai_generated: true,
        ai_preferences: { preferences: variables.preferences },
        items: response.dishes.map((dish, index) => ({
          recipe_id: dish.recipe_id,
          recipe_name: dish.name,
          recipe_category: dish.category,
          image_url: null,
          cooking_time: null,
          quantity: 1,
          ai_reason: dish.reason,
          sort_order: index,
        })),
      });
      navigate('/menus/preview', { replace: true });
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : '推荐失败，请重试', 'error');
      navigate('/', { replace: true });
    },
  });

  useEffect(() => {
    if (!state) {
      navigate('/', { replace: true });
      return;
    }
    mutation.mutate({ preferences: state.preferences ?? [] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen className="flex items-center justify-center min-h-[70vh]">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--brand-soft)] grid place-items-center">
          <Loader2 size={36} className="text-[var(--brand)] animate-spin-slow" />
        </div>
        <h1 className="m-0 text-2xl font-bold tracking-[-0.44px] mb-2">
          AI 正在为您搭配菜单...
        </h1>
        <p className="text-[var(--text-secondary)] m-0">
          {mutation.isPending ? '好的搭配让每一餐都有期待。' : '准备跳转到菜单预览...'}
        </p>
      </div>
    </Screen>
  );
}
