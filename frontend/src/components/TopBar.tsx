import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <header className="grid grid-cols-[48px_1fr_48px] items-center gap-2 mb-4">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        onClick={() => (back ? (onBack ? onBack() : navigate(-1)) : undefined)}
        disabled={!back}
      >
        {back ? <ChevronLeft size={20} /> : null}
      </Button>
      <h1 className="m-0 text-center text-lg font-semibold tracking-[-0.18px]">{title}</h1>
      <div className="flex justify-end">{right}</div>
    </header>
  );
}
