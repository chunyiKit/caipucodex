import { useState } from 'react';
import { motion } from 'framer-motion';

const OPEN_OFFSET = -92;
const SNAP_THRESHOLD = -56;

export function SwipeActionRow({
  children,
  actionLabel,
  onAction,
  actionTone = 'danger',
}: {
  children: React.ReactNode;
  actionLabel: string;
  onAction: () => void;
  actionTone?: 'danger' | 'accent';
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`swipe-row swipe-row--${actionTone} ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className={`swipe-row__action swipe-row__action--${actionTone}`}
        onClick={() => {
          setOpen(false);
          onAction();
        }}
      >
        {actionLabel}
      </button>
      <motion.div
        className="swipe-row__content"
        drag="x"
        dragConstraints={{ left: OPEN_OFFSET, right: 0 }}
        dragElastic={0.04}
        dragDirectionLock
        animate={{ x: open ? OPEN_OFFSET : 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        onDragEnd={(_, info) => {
          setOpen(info.offset.x < SNAP_THRESHOLD);
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
