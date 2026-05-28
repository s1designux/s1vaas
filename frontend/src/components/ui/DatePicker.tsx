// DatePicker — SW Design System V2.4 (registry/components/date-picker.json 기준).
// Base Input 트리거 + PC popover 캘린더. 날짜 형식 YY.MM.DD(HD-10), weekStart=0(HD-9),
// 이전/다음 달 날짜 클릭 허용(HD-7). 내부 value 는 'YYYY-MM-DD'(ISO) 로 보관한다.
import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './DatePicker.module.css';

interface DatePickerProps {
  /** 'YYYY-MM-DD' 또는 '' */
  value: string;
  onChange: (v: string) => void;
  size?: 'sm' | 'md';
  placeholder?: string;
  min?: string;
  max?: string;
  className?: string;
  'aria-label'?: string;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']; // weekStart=0 (HD-9)

const pad = (n: number) => String(n).padStart(2, '0');
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** 트리거 표기: YY.MM.DD (HD-10, Figma 확인) */
const toDisplay = (d: Date) => `${pad(d.getFullYear() % 100)}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
function parseISO(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function DatePicker({
  value,
  onChange,
  size = 'sm',
  placeholder = '연도.월.일',
  min,
  max,
  className,
  'aria-label': ariaLabel,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = useMemo(() => parseISO(value), [value]);
  const [view, setView] = useState<Date>(() => selected ?? new Date());

  useEffect(() => {
    if (selected) setView(selected);
  }, [selected]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const minD = min ? parseISO(min) : null;
  const maxD = max ? parseISO(max) : null;
  const year = view.getFullYear();
  const month = view.getMonth();
  const startOffset = new Date(year, month, 1).getDay(); // weekStart=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rows = Math.ceil((startOffset + daysInMonth) / 7);
  // 첫 주 일요일부터 채운다(이전/다음 달 날짜 포함, HD-7).
  const cells = Array.from({ length: rows * 7 }, (_, i) => new Date(year, month, 1 - startOffset + i));
  const today = new Date();

  const isDisabled = (d: Date) => (!!minD && d < minD) || (!!maxD && d > maxD);
  const moveMonth = (delta: number) => setView(new Date(year, month + delta, 1));

  const pick = (d: Date) => {
    onChange(toISO(d)); // 이전/다음 달 클릭 시에도 해당 날짜 선택 → value 동기화로 해당 월 이동 (HD-7)
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={[styles.root, className].filter(Boolean).join(' ')}>
      <button
        type="button"
        className={[styles.trigger, styles[size], open ? styles.open : '', !selected ? styles.isPlaceholder : '']
          .filter(Boolean)
          .join(' ')}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className={styles.value}>{selected ? toDisplay(selected) : placeholder}</span>
        <svg
          className={styles.icon}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>

      {open && (
        <div className={styles.panel} role="dialog" aria-label="날짜 선택">
          <div className={styles.header}>
            <button type="button" className={styles.navBtn} onClick={() => moveMonth(-1)} aria-label="이전 달">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <span className={styles.monthLabel}>{year}.{pad(month + 1)}</span>
            <button type="button" className={styles.navBtn} onClick={() => moveMonth(1)} aria-label="다음 달">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          <div className={styles.weekdays}>
            {WEEKDAYS.map((w, i) => (
              <span
                key={w}
                className={[styles.weekday, i === 0 ? styles.sun : '', i === 6 ? styles.sat : ''].filter(Boolean).join(' ')}
              >
                {w}
              </span>
            ))}
          </div>

          <div className={styles.grid}>
            {cells.map((d, i) => {
              const otherMonth = d.getMonth() !== month;
              const innerCls = [
                styles.dayInner,
                selected && sameDay(d, selected) ? styles.isSelected : '',
                sameDay(d, today) ? styles.isToday : '',
                otherMonth ? styles.isOtherMonth : '',
                d.getDay() === 0 ? styles.sun : '',
                d.getDay() === 6 ? styles.sat : '',
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <button key={i} type="button" className={styles.day} disabled={isDisabled(d)} onClick={() => pick(d)}>
                  <span className={innerCls}>{d.getDate()}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
