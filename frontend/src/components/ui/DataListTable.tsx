import type { ReactNode } from 'react';
import styles from './DataListTable.module.css';

// ── Exported row / cell class names ───────────────────────────────
export const rowCls = {
  selected:  styles.rowSelected,
  bgGray:    styles.rowBgGray,
} as const;

export const cellCls = {
  link:    styles.cellLink,
  caution: styles.cellCaution,
} as const;

// ── Inline icons ──────────────────────────────────────────────────
function IconSetting() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="8" cy="8" r="2" />
      <path d="M8 1.5v1.1M8 13.4v1.1M1.5 8h1.1M13.4 8h1.1M3.2 3.2l.8.8M12 11.2l.8.8M12 3.2l-.8.8M4 11.2l-.8.8" />
    </svg>
  );
}

function IconWorry() {
  return (
    <svg className={styles.emptyIcon} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="32" cy="32" r="26" />
      <circle cx="23" cy="27" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="41" cy="27" r="2.5" fill="currentColor" stroke="none" />
      <path d="M22 44 Q32 37 42 44" />
      <path d="M25 22 L22 18M39 22 L42 18" />
    </svg>
  );
}

// ── Pagination ────────────────────────────────────────────────────
interface PaginationProps {
  total: number;
  page: number;
  pageSize: number;
  onChange: (page: number) => void;
}

function Pagination({ total, page, pageSize, onChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const GROUP = 5;
  const groupStart = Math.floor((page - 1) / GROUP) * GROUP + 1;
  const groupEnd = Math.min(groupStart + GROUP - 1, totalPages);
  const pages = Array.from({ length: groupEnd - groupStart + 1 }, (_, i) => groupStart + i);
  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  const navCls = (disabled: boolean) =>
    [styles.pagingNav, disabled ? styles.pagingNavDisabled : ''].filter(Boolean).join(' ');

  return (
    <div className={styles.paging}>
      <button type="button" className={navCls(isFirst)} onClick={() => onChange(1)} disabled={isFirst} aria-label="첫 페이지">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
        </svg>
      </button>
      <button type="button" className={navCls(isFirst)} onClick={() => onChange(page - 1)} disabled={isFirst} aria-label="이전 페이지">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={[styles.pagingPage, p === page ? styles.pagingPageActive : ''].filter(Boolean).join(' ')}
          onClick={() => onChange(p)}
          aria-current={p === page ? 'page' : undefined}
        >
          {p}
        </button>
      ))}

      <button type="button" className={navCls(isLast)} onClick={() => onChange(page + 1)} disabled={isLast} aria-label="다음 페이지">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
      <button type="button" className={navCls(isLast)} onClick={() => onChange(totalPages)} disabled={isLast} aria-label="마지막 페이지">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
        </svg>
      </button>
    </div>
  );
}

// ── EmptyRow ──────────────────────────────────────────────────────
interface EmptyRowProps {
  colSpan: number;
  message?: string;
}

function EmptyRow({ colSpan, message = '조회된 데이터가 없습니다.' }: EmptyRowProps) {
  return (
    <tr className={styles.emptyMessageRow}>
      <td colSpan={colSpan}>
        <IconWorry />
        {message}
      </td>
    </tr>
  );
}

// ── Header ────────────────────────────────────────────────────────
interface HeaderProps {
  title: ReactNode;
  count?: number;
  subtitle?: string;
  children?: ReactNode;
}

function Header({ title, count, subtitle, children }: HeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <div className={styles.titleBox}>{title}</div>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        {count !== undefined && (
          <div className={styles.infoBox}>
            <div className={styles.countBox}>
              <span className={styles.countLabel}>총</span>
              <span className={styles.countData}>{count.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
      {children && <div className={styles.headerRight}>{children}</div>}
    </div>
  );
}

// ── BtnIcon ───────────────────────────────────────────────────────
interface BtnIconProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

function BtnIcon({ children, ...rest }: BtnIconProps) {
  return (
    <button type="button" className={styles.btnIcon} {...rest}>
      {children}
    </button>
  );
}

// ── BtnSetting ────────────────────────────────────────────────────
interface BtnSettingProps {
  children?: ReactNode;
  onClick?: () => void;
}

function BtnSetting({ children = '설정', onClick }: BtnSettingProps) {
  return (
    <button type="button" className={styles.btnListSetting} onClick={onClick}>
      {children}
      <IconSetting />
    </button>
  );
}

// ── DividerV ──────────────────────────────────────────────────────
function DividerV() {
  return <span className={styles.dividerV} />;
}

// ── Table ─────────────────────────────────────────────────────────
interface TableProps {
  children: ReactNode;
  grid?: boolean;
  height?: string | number;
  className?: string;
}

function Table({ children, grid, height, className }: TableProps) {
  return (
    <div
      className={[styles.tableWrap, grid ? styles.typeGrid : '', className].filter(Boolean).join(' ')}
      style={height !== undefined ? { height } : undefined}
    >
      {children}
    </div>
  );
}

// ── Footer ────────────────────────────────────────────────────────
interface FooterProps {
  children?: ReactNode;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
}

function Footer({ children, pageSize, pageSizeOptions = [15, 30, 50], onPageSizeChange }: FooterProps) {
  return (
    <div className={styles.footer}>
      <div className={styles.footerRight}>
        {pageSize !== undefined && onPageSizeChange !== undefined && (
          <select
            className={styles.pageSizeSelect}
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>{n}개씩 보기</option>
            ))}
          </select>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────
interface DataListTableProps {
  children: ReactNode;
  className?: string;
}

type DataListTableType = React.FC<DataListTableProps> & {
  Header: typeof Header;
  Table: typeof Table;
  Footer: typeof Footer;
  Pagination: typeof Pagination;
  EmptyRow: typeof EmptyRow;
  BtnIcon: typeof BtnIcon;
  BtnSetting: typeof BtnSetting;
  DividerV: typeof DividerV;
  rowCls: typeof rowCls;
  cellCls: typeof cellCls;
};

const DataListTable: DataListTableType = ({ children, className }) => (
  <div className={[styles.root, className].filter(Boolean).join(' ')}>
    {children}
  </div>
);

DataListTable.Header    = Header;
DataListTable.Table     = Table;
DataListTable.Footer    = Footer;
DataListTable.Pagination = Pagination;
DataListTable.EmptyRow  = EmptyRow;
DataListTable.BtnIcon   = BtnIcon;
DataListTable.BtnSetting = BtnSetting;
DataListTable.DividerV  = DividerV;
DataListTable.rowCls    = rowCls;
DataListTable.cellCls   = cellCls;

export { DataListTable };
