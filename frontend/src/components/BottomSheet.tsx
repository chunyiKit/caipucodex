import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BottomSheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (typeof document === 'undefined') return null;
  const prefersReducedMotion = useReducedMotion();
  const sheetTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.28, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] };

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            className="sheet-backdrop"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <div className="sheet-frame">
            <motion.div
              className="w-full max-w-[480px] bg-white rounded-t-[var(--radius-large)] shadow-[0_-8px_32px_rgba(0,0,0,0.12)] pointer-events-auto will-change-transform px-4 pt-2.5 pb-[calc(24px+var(--safe-bottom))]"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={sheetTransition}
            >
              {/* Grabber */}
              <div className="w-10 h-1 rounded-full bg-[var(--border-color)] mx-auto mb-4" />
              {/* Header */}
              {title ? (
                <div className="flex items-center justify-between mb-4">
                  <h3 className="m-0 text-lg font-semibold">{title}</h3>
                  <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
                    <X size={18} />
                  </Button>
                </div>
              ) : null}
              {children}
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
