import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', label: '首页', icon: '🏠', hint: '今日入口' },
  { to: '/order', label: '点菜', icon: '🍽️', hint: '家庭点菜' },
  { to: '/recipes', label: '菜谱', icon: '📖', hint: '我的收藏' },
  { to: '/history', label: '历史', icon: '📋', hint: '菜单记录' },
  { to: '/profile', label: '我的', icon: '👤', hint: '偏好与设置' },
];

export function DesktopSidebar() {
  return (
    <aside className="desktop-sidebar">
      <div className="desktop-sidebar__brand">
        <div className="desktop-sidebar__logo">🍲</div>
        <div>
          <strong>CaipuCodex</strong>
          <p>家庭餐桌工作台</p>
        </div>
      </div>
      <nav className="desktop-sidebar__nav">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `desktop-nav-item ${isActive ? 'is-active' : ''}`}>
            <span className="desktop-nav-item__icon">{item.icon}</span>
            <span className="desktop-nav-item__text">
              <strong>{item.label}</strong>
              <small>{item.hint}</small>
            </span>
          </NavLink>
        ))}
      </nav>
      <div className="desktop-sidebar__footer">
        <p className="eyebrow">Kitchen Mode</p>
        <h3>今天也做顿好饭</h3>
        <p>左侧导航负责去处，右侧内容负责灵感和效率。</p>
      </div>
    </aside>
  );
}
