// Toggle — SW Design System V2.4 (registry/components/toggle.json). on·off·disabled.
import styles from './Toggle.module.css';

interface ToggleProps {
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
  'aria-label'?: string;
}

export function Toggle({ on, onToggle, disabled = false, 'aria-label': ariaLabel }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      disabled={disabled}
      className={[styles.track, on ? styles.on : '', disabled ? styles.disabled : ''].filter(Boolean).join(' ')}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onToggle();
      }}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') e.stopPropagation();
      }}
    >
      <span className={styles.knob} />
    </button>
  );
}
