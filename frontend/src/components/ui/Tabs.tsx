import type { ReactNode } from 'react';
import styles from './Tabs.module.css';

export interface TabDef {
  key: string;
  label: ReactNode;
}

interface TabsProps {
  tabs: TabDef[];
  active: string;
  onChange: (key: string) => void;
  variant?: 'default' | 'line';
}

export function Tabs({ tabs, active, onChange, variant = 'default' }: TabsProps) {
  return (
    <div className={[styles.tabs, variant === 'line' ? styles.line : ''].filter(Boolean).join(' ')} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={active === t.key}
          className={[styles.tab, active === t.key ? styles.active : ''].join(' ')}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
