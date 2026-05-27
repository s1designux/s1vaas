import { useRef, useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import styles from './Input.module.css';

type InputSize = 'md' | 'sm' | 'xs';
type InputState = 'default' | 'error' | 'correct';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize;
  label?: string;
  helperText?: string;
  state?: InputState;
  clearable?: boolean;
}

export function Input({
  size = 'md',
  label,
  helperText,
  state = 'default',
  clearable = false,
  disabled = false,
  className,
  defaultValue,
  value,
  onChange,
  ...rest
}: InputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const clearBtnRef = useRef<HTMLButtonElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(Boolean(value ?? defaultValue));

  const wrapCls = [
    styles.wrap,
    isFocused ? styles.isFocus : '',
    state === 'error' ? styles.isError : '',
    state === 'correct' ? styles.isCorrect : '',
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
        <input
          ref={inputRef}
          disabled={disabled}
          defaultValue={defaultValue}
          value={value}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            if (e.relatedTarget === clearBtnRef.current) return;
            setIsFocused(false);
          }}
          onChange={(e) => {
            setHasValue(e.target.value.length > 0);
            onChange?.(e);
          }}
          {...rest}
        />

        {clearable && hasValue && !disabled && (
          <button
            ref={clearBtnRef}
            type="button"
            className={styles.clearBtn}
            aria-label="지우기"
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (!inputRef.current) return;
              inputRef.current.value = '';
              setHasValue(false);
              inputRef.current.focus();
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="8" fill="currentColor" />
              <path
                d="M5.3 5.3l5.4 5.4M10.7 5.3l-5.4 5.4"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      {helperText && <span className={styles.helperText}>{helperText}</span>}
    </div>
  );
}
