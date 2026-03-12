import { AnimatePresence, motion } from 'framer-motion';

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
  return (
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
          <motion.div
            className="action-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
          >
            <div className="bottom-sheet__grabber" />
            <div className="action-sheet__content">
              <h3>{title}</h3>
              {description ? <p>{description}</p> : null}
            </div>
            <div className="action-sheet__actions">
              <button type="button" className="action-sheet__button action-sheet__button--cancel" onClick={onCancel} disabled={pending}>
                {cancelLabel}
              </button>
              <button
                type="button"
                className={`action-sheet__button action-sheet__button--${confirmTone}`}
                onClick={onConfirm}
                disabled={pending}
              >
                {pending ? '处理中...' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
