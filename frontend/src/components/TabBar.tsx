import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', label: '首页', icon: '🏠' },
  { to: '/recipes', label: '菜谱', icon: '📖' },
  { to: '/history', label: '历史', icon: '📋' },
  { to: '/profile', label: '我的', icon: '👤' },
];

export function TabBar() {
  return (
    <nav className="tab-bar">
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} className={({ isActive }) => `tab-item ${isActive ? 'is-active' : ''}`}>
          <span className="tab-item__icon">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
