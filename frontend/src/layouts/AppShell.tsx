import { useLocation } from 'react-router-dom';
import { DesktopSidebar } from '@/components/DesktopSidebar';
import { DesktopTopbar } from '@/components/DesktopTopbar';
import { TabBar } from '@/components/TabBar';
import { useBreakpoint } from '@/hooks/useBreakpoint';

const tabVisibleRoutes = ['/', '/recipes', '/history', '/profile'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { isDesktop } = useBreakpoint();
  const showTabBar = tabVisibleRoutes.includes(location.pathname);

  if (isDesktop) {
    return (
      <div className="app-shell--desktop min-h-screen">
        <DesktopSidebar />
        <div className="min-w-0 flex flex-col">
          <DesktopTopbar />
          <main className="flex-1 px-6 pb-10">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <main className={showTabBar ? 'pb-[calc(92px+var(--safe-bottom))]' : ''}>{children}</main>
      {showTabBar ? <TabBar /> : null}
    </div>
  );
}
