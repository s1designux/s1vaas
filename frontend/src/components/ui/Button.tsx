import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'blue-line';
type Size = 'md' | 'xsm' | 'sm';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
}

const variantClass: Record<Variant, string> = {
  primary: styles.primary,
  secondary: styles.secondary,
  'blue-line': styles.blueLine,
};

const sizeClass: Record<Size, string> = {
  md: styles.md,
  xsm: '',
  sm: styles.sm,
};

export function Button({
  variant = 'primary',
  size = 'xsm',
  block = false,
  className,
  ...rest
}: ButtonProps) {
  const cls = [
    styles.btn,
    variantClass[variant],
    sizeClass[size],
    block ? styles.block : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  return <button className={cls} {...rest} />;
}
