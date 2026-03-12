export function Screen({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`screen ${className}`.trim()}>{children}</div>;
}
