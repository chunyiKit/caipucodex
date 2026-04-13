import { Link, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const titles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: '家庭餐桌工作台', subtitle: '今天吃什么，一眼安排明白' },
  '/order': { title: '开始点菜', subtitle: '左边筛菜，中间浏览，右边即时汇总' },
  '/recipes': { title: '菜谱总览', subtitle: '按分类管理家里的拿手菜' },
  '/history': { title: '历史菜单', subtitle: '回顾最近吃过的搭配与灵感' },
  '/profile': { title: '我的空间', subtitle: '保留后续扩展家庭偏好与设置' },
};

export function DesktopTopbar() {
  const location = useLocation();
  const current = titles[location.pathname] ?? { title: 'CaipuCodex', subtitle: '温暖、轻量、适合家庭使用' };

  return (
    <header className="flex items-start justify-between gap-6 px-1.5 pt-6 pb-4">
      <div>
        <h1 className="text-[28px] font-bold tracking-[-0.44px] leading-tight m-0 mb-1">{current.title}</h1>
        <p className="text-sm text-[var(--text-secondary)] m-0">{current.subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="px-4 py-2.5 rounded-lg bg-[var(--surface-secondary)] text-sm font-medium">
          {new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date())}
        </div>
        <Button asChild className="bg-[var(--brand)] hover:bg-[var(--brand-deep)] text-white rounded-lg">
          <Link to="/recipes/new">
            <Plus size={16} />
            新建菜谱
          </Link>
        </Button>
      </div>
    </header>
  );
}
