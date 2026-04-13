import { NavLink } from 'react-router-dom';
import { Home, BookOpen, ClipboardList, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { to: '/', label: '首页', icon: Home },
  { to: '/recipes', label: '菜谱', icon: BookOpen },
  { to: '/history', label: '历史', icon: ClipboardList },
  { to: '/profile', label: '我的', icon: User },
];

export function TabBar() {
  return (
    <nav className="fixed left-1/2 bottom-0 -translate-x-1/2 w-full max-w-[480px] grid grid-cols-4 gap-1 px-3.5 pt-2.5 pb-[calc(10px+var(--safe-bottom))] bg-white/90 backdrop-blur-xl border-t border-[#ebebeb] z-30">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-0.5 py-1 text-[11px] font-medium transition-colors',
              isActive ? 'text-[var(--brand)]' : 'text-[var(--text-secondary)]',
            )
          }
        >
          {({ isActive }) => (
            <>
              <item.icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
