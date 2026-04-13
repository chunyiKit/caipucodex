import { User, Heart, Settings, Upload, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Screen } from '@/components/Screen';
import { useBreakpoint } from '@/hooks/useBreakpoint';

export function ProfilePage() {
  const { isDesktop } = useBreakpoint();
  const navigate = useNavigate();

  return (
    <Screen>
      <div className={isDesktop ? 'grid grid-cols-3 gap-6' : ''}>
        {/* Profile card */}
        <div className="flex items-center gap-4 p-6 rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] mb-4 lg:mb-0 lg:col-span-1 lg:flex-col lg:items-start lg:min-h-[240px]">
          <div className="w-14 h-14 rounded-full bg-[var(--brand)] text-white grid place-items-center flex-shrink-0">
            <User size={24} />
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-wider uppercase text-[var(--brand)] mb-1">Coming Soon</p>
            <h1 className="m-0 text-xl font-bold tracking-[-0.18px] mb-1">我的</h1>
            <p className="m-0 text-sm text-[var(--text-secondary)] leading-relaxed">
              v1 暂时保留为占位页，后续可扩展 AI 偏好和家庭资料。
            </p>
          </div>
        </div>

        {/* Menu items */}
        <div className={isDesktop ? 'lg:col-span-3' : ''}>
          <button
            type="button"
            onClick={() => navigate('/recipes/import')}
            className="w-full flex items-center gap-4 p-4 rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] mb-3 text-left cursor-pointer border-none hover:shadow-[var(--shadow-hover)] transition-shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--brand-soft)] grid place-items-center flex-shrink-0">
              <Upload size={18} className="text-[var(--brand)]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="m-0 text-base font-semibold">导入菜谱</h3>
              <p className="m-0 text-sm text-[var(--text-secondary)]">批量导入 JSON 格式菜谱</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/recipes/dedup')}
            className="w-full flex items-center gap-4 p-4 rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] mb-4 text-left cursor-pointer border-none hover:shadow-[var(--shadow-hover)] transition-shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--brand-soft)] grid place-items-center flex-shrink-0">
              <Copy size={18} className="text-[var(--brand)]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="m-0 text-base font-semibold">菜谱去重</h3>
              <p className="m-0 text-sm text-[var(--text-secondary)]">扫描并清理名称重复的菜谱</p>
            </div>
          </button>
        </div>

        {isDesktop ? (
          <>
            <div className="p-5 rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)]">
              <div className="w-10 h-10 rounded-xl bg-[var(--brand-soft)] grid place-items-center mb-3">
                <Heart size={18} className="text-[var(--brand)]" />
              </div>
              <p className="text-[11px] font-semibold tracking-wider uppercase text-[var(--brand)] mb-1">Preferences</p>
              <h2 className="m-0 text-lg font-semibold mb-2">家庭偏好</h2>
              <p className="m-0 text-sm text-[var(--text-secondary)] leading-relaxed">
                后续可在这里设置常用口味、AI 推荐偏好和家庭成员信息。
              </p>
            </div>
            <div className="p-5 rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)]">
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-secondary)] grid place-items-center mb-3">
                <Settings size={18} className="text-[var(--text-secondary)]" />
              </div>
              <p className="text-[11px] font-semibold tracking-wider uppercase text-[var(--text-secondary)] mb-1">Workspace</p>
              <h2 className="m-0 text-lg font-semibold mb-2">厨房工作台</h2>
              <p className="m-0 text-sm text-[var(--text-secondary)] leading-relaxed">
                电脑端适合作为整理菜谱、编辑步骤和回顾历史菜单的主工作区。
              </p>
            </div>
          </>
        ) : null}
      </div>
    </Screen>
  );
}
