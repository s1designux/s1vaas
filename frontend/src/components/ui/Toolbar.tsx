import type { ReactNode } from 'react';
import styles from './Toolbar.module.css';

interface ToolbarProps {
  children: ReactNode;
  onReset?: () => void;
  onSearch?: () => void;
  resetLabel?: string;
  searchLabel?: string;
}

export function Toolbar({ children, onReset, onSearch, resetLabel = '초기화', searchLabel = '검색' }: ToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.fields}>{children}</div>
      <div className={styles.actions}>
        {onReset && (
          <button type="button" className={styles.resetBtn} onClick={onReset}>
            {resetLabel}
          </button>
        )}
        {onSearch && (
          <button type="button" className={styles.searchBtn} onClick={onSearch}>
            {searchLabel}
          </button>
        )}
      </div>
    </div>
  );
}

interface ToolbarFieldProps {
  label: string;
  children: ReactNode;
}

export function ToolbarField({ label, children }: ToolbarFieldProps) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <div className={styles.fieldControl}>{children}</div>
    </div>
  );
}
