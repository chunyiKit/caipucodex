import { Link, useLocation } from 'react-router-dom';

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
    <header className="desktop-topbar">
      <div>
        <p className="eyebrow">Desktop View</p>
        <h1>{current.title}</h1>
        <p>{current.subtitle}</p>
      </div>
      <div className="desktop-topbar__actions">
        <div className="desktop-topbar__date">{new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date())}</div>
        <Link className="desktop-topbar__quick" to="/recipes/new">+ 新建菜谱</Link>
      </div>
    </header>
  );
}
