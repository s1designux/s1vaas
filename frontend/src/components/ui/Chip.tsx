import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Chip.module.css';

interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** 선택 상태 (line type: 선택 시 action-primary border/text) */
  selected?: boolean;
  /** 라벨 앞 카테고리 색 점. 생략 시 점 없음. */
  dotColor?: string;
  children: ReactNode;
}

/** S1 DS Chip — Line type. 선택/필터 칩. */
export function Chip({ selected = false, dotColor, disabled, className, children, ...rest }: ChipProps) {
  const cls = [styles.chip, selected ? styles.selected : '', className ?? '']
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" className={cls} aria-pressed={selected} disabled={disabled} {...rest}>
      {dotColor && <span className={styles.dot} style={{ background: dotColor }} aria-hidden />}
      {children}
    </button>
  );
}
