import { Screen } from '@/components/Screen';
import { useBreakpoint } from '@/hooks/useBreakpoint';

export function ProfilePage() {
  const { isDesktop } = useBreakpoint();

  return (
    <Screen className={isDesktop ? 'profile-page profile-page--desktop' : 'profile-page'}>
      <div className={isDesktop ? 'desktop-profile-grid' : ''}>
        <div className="hero-card hero-card--welcome profile-card">
          <div className="avatar-badge">🍳</div>
          <div>
            <p className="eyebrow">Coming Soon</p>
            <h1>我的</h1>
            <p>v1 暂时保留为占位页，后续可扩展默认人数、AI 偏好和家庭资料。</p>
          </div>
        </div>
        {isDesktop ? (
          <>
            <div className="detail-card">
              <p className="eyebrow">Preferences</p>
              <h2>家庭偏好</h2>
              <p className="muted">后续可在这里设置默认人数、常用口味、AI 推荐偏好和家庭成员信息。</p>
            </div>
            <div className="detail-card">
              <p className="eyebrow">Workspace</p>
              <h2>厨房工作台</h2>
              <p className="muted">电脑端适合作为整理菜谱、编辑步骤和回顾历史菜单的主工作区。</p>
            </div>
          </>
        ) : null}
      </div>
    </Screen>
  );
}
