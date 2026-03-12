import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { recommendMenu } from '@/api/ai';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/ToastProvider';
import { useMenuDraftStore } from '@/store/menuDraftStore';

export function LoadingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { setDraft } = useMenuDraftStore();
  const state = (location.state as { peopleCount?: number; preferences?: string[] } | null) ?? null;

  const mutation = useMutation({
    mutationFn: recommendMenu,
    onSuccess: (response, variables) => {
      setDraft({
        title: 'AI 推荐菜单',
        menu_date: new Date().toISOString().slice(0, 10),
        people_count: response.people_count,
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
    if (!state?.peopleCount) {
      navigate('/', { replace: true });
      return;
    }
    mutation.mutate({ people_count: state.peopleCount, preferences: state.preferences ?? [] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen className="loading-screen">
      <div className="loading-pot">🍳</div>
      <h1>AI 正在为您搭配菜单...</h1>
      <p>{mutation.isPending ? '好的搭配让每一餐都有期待。' : '准备跳转到菜单预览...'}</p>
    </Screen>
  );
}
