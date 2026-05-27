import styles from './TopSearch.module.css';

/* ── Sub-component prop types ── */
interface RowProps {
  children: React.ReactNode;
}

interface FieldProps {
  label?: string;
  small?: boolean;
  stretch?: boolean;
  wide?: boolean;
  children: React.ReactNode;
}

interface DateRangeProps {
  children: React.ReactNode;
}

/* ── Root prop types ── */
interface TopSearchProps {
  /** Form fields — pass <TopSearch.Row> children */
  children?: React.ReactNode;
  /** Title variant: shows title + optional subtitle instead of form */
  title?: string;
  subtitle?: string;
  /** Right-side buttons */
  buttons?: React.ReactNode;
  /** Called on form submit (Enter or button click). Wraps children in <form> when provided. */
  onSubmit?: () => void;
}

type TopSearchType = React.FC<TopSearchProps> & {
  Row: React.FC<RowProps>;
  Field: React.FC<FieldProps>;
  DateRange: React.FC<DateRangeProps>;
  Between: React.FC;
  Divider: React.FC;
};

/* ── Root ── */
const TopSearch: TopSearchType = ({ children, title, subtitle, buttons, onSubmit }) => {
  const isTitle = !!title;

  return (
    <div className={[styles.root, isTitle ? styles.titleMode : ''].filter(Boolean).join(' ')}>
      {isTitle ? (
        <div className={styles.titleBox}>
          <strong className={styles.title}>{title}</strong>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </div>
      ) : children ? (
        <div className={styles.forms}>
          {onSubmit ? (
            <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
              {children}
            </form>
          ) : (
            children
          )}
        </div>
      ) : null}

      {buttons && (
        <div className={[styles.btns, isTitle ? styles.btnsAuto : ''].filter(Boolean).join(' ')}>
          {buttons}
        </div>
      )}
    </div>
  );
};

/* ── Row ── */
TopSearch.Row = function TopSearchRow({ children }: RowProps) {
  return <div className={styles.row}>{children}</div>;
};

/* ── Field ── */
TopSearch.Field = function TopSearchField({ label, small, stretch, wide, children }: FieldProps) {
  return (
    <div className={[styles.inputGroup, small ? styles.small : '', stretch ? styles.stretch : '', wide ? styles.wide : ''].filter(Boolean).join(' ')}>
      {label && <span className={styles.legend}>{label}</span>}
      <div className={styles.inputWrap}>{children}</div>
    </div>
  );
};

/* ── Date range wrapper ── */
TopSearch.DateRange = function TopSearchDateRange({ children }: DateRangeProps) {
  return <div className={styles.dateRange}>{children}</div>;
};

/* ── ~ between date inputs ── */
TopSearch.Between = function TopSearchBetween() {
  return <span className={styles.between} aria-hidden>~</span>;
};

/* ── Vertical divider between field groups ── */
TopSearch.Divider = function TopSearchDivider() {
  return <span className={styles.dividerV} aria-hidden />;
};

export { TopSearch };
