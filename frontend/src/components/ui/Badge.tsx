import type { HTMLAttributes } from 'react';
import styles from './Badge.module.css';

export type BadgeTone = 'accent' | 'success' | 'warn' | 'danger' | 'neutral' | 'info';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dot?: boolean;
}

export function Badge({
  tone = 'neutral',
  dot = false,
  className,
  children,
  ...rest
}: BadgeProps) {
  const cls = [styles.badge, styles[tone], className ?? ''].filter(Boolean).join(' ');
  return (
    <span className={cls} {...rest}>
      {dot && <span className={styles.dot} />}
      {children}
    </span>
  );
}
