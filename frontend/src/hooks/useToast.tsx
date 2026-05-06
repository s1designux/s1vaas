import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from '@/components/ui/Toast.module.css';

export type ToastTone = 'success' | 'info' | 'warn' | 'danger';

export interface ToastItem {
  id: number;
  tone: ToastTone;
  title: string;
  message?: string;
}

interface ToastCtx {
  push: (t: Omit<ToastItem, 'id'>) => void;
  success: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warn: (title: string, message?: string) => void;
  danger: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastCtx | null>(null);

const MAX_STACK = 3;
const AUTO_DISMISS_MS = 3000;

const ICONS: Record<ToastTone, string> = {
  success: '✓',
  info: 'i',
  warn: '!',
  danger: '×',
};

function ToastView({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onClose, AUTO_DISMISS_MS);
    return () => window.clearTimeout(t);
  }, [onClose]);
  return (
    <div className={[styles.toast, styles[toast.tone]].join(' ')} role="status">
      <span className={styles.icon}>{ICONS[toast.tone]}</span>
      <div className={styles.body}>
        <div className={styles.title}>{toast.title}</div>
        {toast.message && <div className={styles.msg}>{toast.message}</div>}
      </div>
      <button type="button" className={styles.close} onClick={onClose} aria-label="닫기">
        ×
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((t: Omit<ToastItem, 'id'>) => {
    setItems((prev) => {
      const next = [...prev, { ...t, id: Date.now() + Math.random() }];
      return next.slice(-MAX_STACK);
    });
  }, []);

  const api: ToastCtx = {
    push,
    success: (title, message) => push({ tone: 'success', title, message }),
    info: (title, message) => push({ tone: 'info', title, message }),
    warn: (title, message) => push({ tone: 'warn', title, message }),
    danger: (title, message) => push({ tone: 'danger', title, message }),
  };

  const close = (id: number) => setItems((prev) => prev.filter((it) => it.id !== id));

  return (
    <ToastContext.Provider value={api}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div className={styles.stack} aria-live="polite">
            {items.map((t) => (
              <ToastView key={t.id} toast={t} onClose={() => close(t.id)} />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }
  return ctx;
}
