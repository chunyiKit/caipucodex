import { motion, useReducedMotion } from 'framer-motion';
import { BookOpen, Search, ShoppingBasket, CalendarDays, FileText, Utensils } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  '📚': BookOpen,
  '📔': BookOpen,
  '🔎': Search,
  '🧺': ShoppingBasket,
  '🗓️': CalendarDays,
  '🗂️': CalendarDays,
  '📝': FileText,
  '🥬': Utensils,
};

export function EmptyState({
  title,
  description,
  action,
  icon = '🍲',
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: string;
  accent?: 'default' | 'calm' | 'warm';
}) {
  const prefersReducedMotion = useReducedMotion();
  const IconComponent = iconMap[icon];

  const content = (
    <div className="py-10 px-6 text-center rounded-[var(--radius-card)] border border-dashed border-[var(--border-color)] bg-[var(--surface-secondary)]">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white shadow-sm grid place-items-center">
        {IconComponent ? (
          <IconComponent size={28} className="text-[var(--text-secondary)]" />
        ) : (
          <span className="text-3xl">{icon}</span>
        )}
      </div>
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">{description}</p>
      {action}
    </div>
  );

  if (prefersReducedMotion) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {content}
    </motion.div>
  );
}
