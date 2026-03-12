import { motion } from 'framer-motion';

export function EmptyState({
  title,
  description,
  action,
  icon = '🍲',
  accent = 'default',
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: string;
  accent?: 'default' | 'calm' | 'warm';
}) {
  return (
    <motion.div
      className={`empty-state empty-state--${accent}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="empty-state__icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </motion.div>
  );
}
