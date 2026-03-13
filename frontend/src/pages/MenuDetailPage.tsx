import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getMenu } from '@/api/menus';
import { assetUrl } from '@/api/client';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { useToast } from '@/components/ToastProvider';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { formatDateLong, groupMenuItems } from '@/utils/format';
import { getPlaceholderImage } from '@/utils/placeholder';

const CATEGORY_ICON_MAP: Record<string, string> = {
  '荤菜': '🥩',
  '素菜': '🥬',
  '汤类': '🍲',
  '主食': '🍚',
  '凉菜': '🥗',
  '甜点': '🍮',
};

export function MenuDetailPage() {
  const { id = '' } = useParams();
  const { showToast } = useToast();
  const { isDesktop } = useBreakpoint();
  const query = useQuery({ queryKey: ['menu', id], queryFn: () => getMenu(id) });
  const menu = query.data;
  if (!menu) {
    return (
      <Screen>
        <TopBar title="菜单详情" />
        <EmptyState title="没有找到菜单" description="这份菜单可能已经被删除。" />
      </Screen>
    );
  }
  const grouped = groupMenuItems(menu.items);

  return (
    <Screen className={isDesktop ? 'menu-detail-page menu-detail-page--desktop' : 'menu-detail-page'}>
      <TopBar
        title="菜单详情"
        right={
          <button
            className="ghost-link"
            onClick={async () => {
              await navigator.clipboard.writeText(window.location.href);
              showToast('菜单链接已复制');
            }}
          >
            分享
          </button>
        }
      />
      <div className={isDesktop ? 'desktop-content-with-aside' : ''}>
        <div className="desktop-content-with-aside__main">
          <section className="detail-card">
            <p className="eyebrow">{menu.is_ai_generated ? '✨ AI 推荐' : '家庭菜单'}</p>
            <h1>{menu.title || '今日菜单'}</h1>
            <p>{formatDateLong(menu.menu_date)}</p>
          </section>
          {Object.entries(grouped).map(([category, items]) => (
            <section className={`detail-card ${isDesktop ? '' : 'menu-preview-section'}`.trim()} key={category}>
              <div className={`section-title ${isDesktop ? '' : 'menu-preview-section__header'}`.trim()}>
                <h2>{category}</h2>
                <span className={`pill pill--${category} menu-preview-section__count`}>{items.length} 道</span>
              </div>
              <div className={isDesktop ? 'menu-item-list' : 'menu-item-list menu-item-list--preview'}>
                {items.map((item) => (
                  isDesktop ? (
                    <div key={`${item.recipe_name}-${item.sort_order}`} className="menu-item-card">
                      <img src={assetUrl(item.image_url) || getPlaceholderImage(item.recipe_name)} alt={item.recipe_name} />
                      <div>
                        <strong>{item.recipe_name}</strong>
                        <p>{item.ai_reason || `${item.quantity} 份 · ${item.cooking_time || 20} 分钟`}</p>
                        {item.recipe_id ? <Link className="ghost-link" to={`/recipes/${item.recipe_id}`}>查看菜谱</Link> : null}
                      </div>
                    </div>
                  ) : (
                    <div key={`${item.recipe_name}-${item.sort_order}`} className="menu-item-card menu-item-card--preview">
                      <div className="menu-item-card__icon" aria-hidden="true">{CATEGORY_ICON_MAP[item.recipe_category] || '🍽️'}</div>
                      <div className="menu-item-card__body">
                        <div className="menu-item-card__title-row">
                          <strong>{item.recipe_name}</strong>
                          <span className="menu-item-card__hint">已保存</span>
                        </div>
                        <p className="menu-item-card__reason">{item.ai_reason || `${item.recipe_category} · 家常搭配更顺手`}</p>
                        <div className="menu-item-card__meta">
                          <span className="pill pill--plain">{item.quantity} 份</span>
                          <span className="pill pill--plain">{item.cooking_time || 20} 分钟</span>
                          {item.recipe_id ? <Link className="ghost-link menu-item-card__link" to={`/recipes/${item.recipe_id}`}>查看菜谱</Link> : null}
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </section>
          ))}
        </div>
        <aside className={isDesktop ? 'desktop-panel desktop-content-with-aside__side' : ''}>
          {isDesktop ? (
            <>
              <p className="eyebrow">Summary</p>
              <h2>菜单概览</h2>
              <div className="desktop-summary-list">
                <div><span>日期</span><strong>{formatDateLong(menu.menu_date)}</strong></div>
                <div><span>菜品数</span><strong>{menu.items.length} 道</strong></div>
                <div><span>来源</span><strong>{menu.is_ai_generated ? 'AI 推荐' : '手动生成'}</strong></div>
              </div>
            </>
          ) : null}
          <div className="bottom-actions sticky desktop-actions-stack">
            <Link className="secondary-button" to={`/menus/${menu.id}/ingredients`}>查看采购清单</Link>
          </div>
        </aside>
      </div>
    </Screen>
  );
}
