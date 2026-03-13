import { useNavigate } from 'react-router-dom';

export function TopBar({
  title,
  right,
  back = true,
  onBack,
}: {
  title: string;
  right?: React.ReactNode;
  back?: boolean;
  onBack?: () => void;
}) {
  const navigate = useNavigate();
  return (
    <header className="top-bar">
      <button className="ghost-button" onClick={() => (back ? (onBack ? onBack() : navigate(-1)) : undefined)} disabled={!back}>
        {back ? '←' : ''}
      </button>
      <h1>{title}</h1>
      <div className="top-bar__right">{right}</div>
    </header>
  );
}
