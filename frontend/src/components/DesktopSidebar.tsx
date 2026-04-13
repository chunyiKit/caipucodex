import { NavLink } from 'react-router-dom';
import { Home, UtensilsCrossed, BookOpen, ClipboardList, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { to: '/', label: '首页', hint: '今日入口', icon: Home },
  { to: '/order', label: '点菜', hint: '家庭点菜', icon: UtensilsCrossed },
  { to: '/recipes', label: '菜谱', hint: '我的收藏', icon: BookOpen },
  { to: '/history', label: '历史', hint: '菜单记录', icon: ClipboardList },
  { to: '/profile', label: '我的', hint: '偏好与设置', icon: User },
];

export function DesktopSidebar() {
  return (
    <aside className="sticky top-0 self-start h-screen flex flex-col gap-6 px-5 py-6 border-r border-[#ebebeb] bg-white">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[var(--brand)] text-white grid place-items-center text-lg font-bold">
          C
        </div>
        <div>
          <strong className="text-[15px] font-semibold tracking-[-0.18px]">CaipuCodex</strong>
          <p className="text-xs text-[var(--text-secondary)] m-0">家庭餐桌工作台</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors',
                isActive
                  ? 'bg-[var(--brand-soft)] text-[var(--brand)]'
                  : 'text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]',
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                <span className="flex flex-col">
                  <strong className="text-sm font-medium">{item.label}</strong>
                  <small className="text-xs text-[var(--text-secondary)]">{item.hint}</small>
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto p-4 rounded-2xl bg-[var(--surface-secondary)]">
        <p className="text-[11px] font-semibold tracking-wider uppercase text-[var(--brand)] mb-1">Kitchen Mode</p>
        <h3 className="text-base font-semibold m-0 mb-1">今天也做顿好饭</h3>
        <p className="text-xs text-[var(--text-secondary)] m-0 leading-relaxed">
          左侧导航负责去处，右侧内容负责灵感和效率。
        </p>
      </div>
    </aside>
  );
}
