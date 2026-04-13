import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';

export function ActionSheet({
  open,
  title,
  description,
  confirmLabel = '确认',
  cancelLabel = '取消',
  onConfirm,
  onCancel,
  confirmTone = 'danger',
  pending = false,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmTone?: 'danger' | 'accent';
  pending?: boolean;
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
            onClick={onCancel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <div className="sheet-frame">
            <motion.div
              className="w-full max-w-[480px] bg-white rounded-t-[var(--radius-large)] shadow-[0_-8px_32px_rgba(0,0,0,0.12)] pointer-events-auto will-change-transform px-4 pt-2.5 pb-[calc(20px+var(--safe-bottom))]"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={sheetTransition}
            >
              <div className="w-10 h-1 rounded-full bg-[var(--border-color)] mx-auto mb-4" />
              <div className="px-1 pb-5 text-center">
                <h3 className="m-0 mb-2 text-xl font-semibold">{title}</h3>
                {description ? <p className="m-0 text-[var(--text-secondary)] leading-relaxed">{description}</p> : null}
              </div>
              <div className="grid gap-2.5">
                <Button
                  variant="outline"
                  className="w-full h-[52px] rounded-xl text-base font-semibold"
                  onClick={onCancel}
                  disabled={pending}
                >
                  {cancelLabel}
                </Button>
                <Button
                  className={`w-full h-[52px] rounded-xl text-base font-semibold text-white ${
                    confirmTone === 'danger'
                      ? 'bg-[#c13515] hover:bg-[#a82e12]'
                      : 'bg-[var(--brand)] hover:bg-[var(--brand-deep)]'
                  }`}
                  onClick={onConfirm}
                  disabled={pending}
                >
                  {pending ? '处理中...' : confirmLabel}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
