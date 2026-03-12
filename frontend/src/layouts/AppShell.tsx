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
      <div className="app-shell app-shell--desktop">
        <DesktopSidebar />
        <div className="app-shell__desktop-main">
          <DesktopTopbar />
          <main className="app-shell__content app-shell__content--desktop">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <main className={`app-shell__content ${showTabBar ? 'with-tab-bar' : ''}`}>{children}</main>
      {showTabBar ? <TabBar /> : null}
    </div>
  );
}
