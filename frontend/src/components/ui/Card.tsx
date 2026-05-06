import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';

/**
 * Card variant 정책 (design.md §9 / ARCHITECTURE.md §9.1)
 * - 'default' : hover 시 border-color 만 전환 (기본). Dashboard/Monitoring/CameraSettings/Settings/User 의 모든 카드.
 * - 'lift'    : hover 시 -1px translate + shadow-modal. SiteCard 한정.
 * `hoverLift` boolean 은 deprecated. variant='lift' 와 동일.
 */
export type CardVariant = 'default' | 'lift';

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  actions?: ReactNode;
  variant?: CardVariant;
  /** @deprecated use variant="lift" instead */
  hoverLift?: boolean;
}

export function Card({
  title,
  actions,
  variant = 'default',
  hoverLift = false,
  className,
  children,
  ...rest
}: CardProps) {
  const isLift = variant === 'lift' || hoverLift;
  const cls = [styles.card, isLift ? styles.cardLift : '', className ?? '']
    .filter(Boolean)
    .join(' ');
  return (
    <div className={cls} {...rest}>
      {(title || actions) && (
        <div className={styles.title}>
          <span>{title}</span>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
