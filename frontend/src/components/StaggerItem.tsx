import { motion } from 'framer-motion';

export function StaggerItem({
  children,
  index = 0,
  className,
}: {
  children: React.ReactNode;
  index?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: index * 0.05, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
    >
      {children}
    </motion.div>
  );
}
