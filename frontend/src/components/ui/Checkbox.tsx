import { useRef, useEffect } from 'react';
import styles from './Checkbox.module.css';

interface CheckboxProps {
  checked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  children?: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

export function Checkbox({
  checked = false,
  indeterminate = false,
  disabled = false,
  onChange,
  children,
  size = 'md',
  className,
}: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const isActive = checked || indeterminate;

  const boxClass = [
    styles.box,
    isActive && !disabled ? styles.checkedBox : '',
    disabled ? styles.disabledBox : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <label
      className={[styles.root, styles[size], disabled ? styles.disabled : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      <input
        ref={ref}
        type="checkbox"
        className={styles.nativeInput}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <span className={boxClass}>
        {isActive && (
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            aria-hidden
            className={disabled ? styles.disabledIcon : styles.icon}
          >
            {indeterminate ? (
              <line
                x1="2"
                y1="5"
                x2="8"
                y2="5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M1.5 5L3.8 7.5L8.5 2.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        )}
      </span>
      {children && <span className={styles.labelText}>{children}</span>}
    </label>
  );
}
