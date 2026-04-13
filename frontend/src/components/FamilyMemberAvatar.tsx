import { assetUrl } from '@/api/client';

function getInitials(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return '新';
  return trimmed.length <= 2 ? trimmed : trimmed.slice(0, 2);
}

export function FamilyMemberAvatar({
  name,
  avatarUrl,
  large = false,
}: {
  name: string;
  avatarUrl?: string | null;
  large?: boolean;
}) {
  return (
    <div className={`family-avatar ${large ? 'family-avatar--large' : ''}`}>
      {avatarUrl ? <img src={assetUrl(avatarUrl)} alt={`${name}头像`} /> : <span>{getInitials(name)}</span>}
    </div>
  );
}
