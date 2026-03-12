import { createContext, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type ToastContextValue = {
  showToast: (message: string, tone?: 'success' | 'error') => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  const value = useMemo(
    () => ({
      showToast(message: string, tone: 'success' | 'error' = 'success') {
        setToast({ message, tone });
        window.clearTimeout((window as unknown as { __toastTimer?: number }).__toastTimer);
        (window as unknown as { __toastTimer?: number }).__toastTimer = window.setTimeout(() => setToast(null), 2200);
      },
    }),
    [],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {toast ? (
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className={`toast toast--${toast.tone}`}
          >
            {toast.message}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
