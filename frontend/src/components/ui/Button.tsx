import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'md' | 'sm';
  block?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  className,
  ...rest
}: ButtonProps) {
  const cls = [
    styles.btn,
    styles[variant],
    size === 'sm' ? styles.sm : '',
    block ? styles.block : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  return <button className={cls} {...rest} />;
}
