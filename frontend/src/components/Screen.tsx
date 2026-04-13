import { cn } from '@/lib/utils';

export function Screen({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('w-full max-w-[480px] mx-auto px-4 py-5 lg:max-w-none lg:mx-0 lg:px-1.5 lg:pb-10 lg:pt-0', className)}>
      {children}
    </div>
  );
}
