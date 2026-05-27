import { useState } from 'react';
import type { SelectHTMLAttributes } from 'react';
import styles from './Select.module.css';

type SelectSize = 'md' | 'sm' | 'xs';
type SelectState = 'default' | 'error' | 'correct';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'onChange'> {
  size?: SelectSize;
  label?: string;
  helperText?: string;
  state?: SelectState;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** S1 DS Select — native dropdown trigger. Input과 동일한 field shell. */
export function Select({
  size = 'md',
  label,
  helperText,
  state = 'default',
  options,
  value,
  onChange,
  disabled = false,
  placeholder,
  className,
  ...rest
}: SelectProps) {
  const [isFocused, setIsFocused] = useState(false);

  const wrapCls = [
    styles.wrap,
    isFocused ? styles.isFocus : '',
    state === 'error' ? styles.isError : '',
    disabled ? styles.isDisabled : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const fieldCls = [
    styles.field,
    size === 'sm' ? styles.sm : '',
    size === 'xs' ? styles.xs : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapCls}>
      {label && <span className={styles.label}>{label}</span>}

      <div className={fieldCls}>
        <select
          disabled={disabled}
          value={value}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => onChange(e.target.value)}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className={styles.chevron} aria-hidden>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </div>

      {helperText && <span className={styles.helperText}>{helperText}</span>}
    </div>
  );
}
