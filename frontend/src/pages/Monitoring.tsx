// TODO: replace with fetch('/api/v1/cameras/live')
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { Button } from '@/components/ui/Button';
import { BtnGroup } from '@/components/ui/BtnGroup';
import { Tabs } from '@/components/ui/Tabs';
import { useToast } from '@/hooks/useToast';
import type { AppEvent, Camera, EventType, Site } from '@/types';
import styles from './Monitoring.module.css';

// ── Constants ────────────────────────────────────────────────────
type Layout = 2 | 3 | 4;
const LAYOUTS: Layout[] = [2, 3, 4];

const INITIAL_ZONES = ['전체', '출입구', '매장', '주차장', '사무실'];

const MOCK_CUSTOMERS = [
  { id: 'c1', num: 'N1****6', label: '강남물산(주)', siteIds: ['s-01', 's-02'] },
  { id: 'c2', num: 'N2****7', label: '서울유통(주)', siteIds: ['s-03', 's-04'] },
  { id: 'c3', num: 'N3****8', label: '부산상사(주)', siteIds: ['s-05', 's-06'] },
];

function cameraZone(name: string): string {
  if (name.includes('출입') || name.includes('정문') || name.includes('옥외') || name.includes('적재')) return '출입구';
  if (name.includes('주차')) return '주차장';
  if (name.includes('매장') || name.includes('로비') || name.includes('카페')) return '매장';
  if (name.includes('서버') || name.includes('R&D') || name.includes('사무')) return '사무실';
  return '전체';
}

const EVENT_FILTER_DEFS: { type: EventType; label: string }[] = [
  { type: 'motion', label: '움직임 감지' },
  { type: 'intrusion', label: '침입' },
  { type: 'line_crossing', label: '라인 크로스' },
  { type: 'face_match', label: '얼굴 인식' },
  { type: 'lpr', label: '번호판 인식' },
];

type EventPeriod = 'today' | '24h' | '7d' | '30d';
const PERIOD_LABELS: Record<EventPeriod, string> = { today: '오늘', '24h': '24시간', '7d': '7일', '30d': '30일' };

const PANEL_TABS = [
  { key: 'events', label: '이벤트' },
  { key: 'info', label: '정보' },
  { key: 'settings', label: '설정' },
];

const EVENT_TYPE_LABELS: Partial<Record<EventType, string>> = {
  motion: '움직임 감지', intrusion: '침입 감지', line_crossing: '라인 크로스',
  face_match: '얼굴 매칭', lpr: '번호판 인식',
  offline: '오프라인', online: '온라인', storage_warn: '저장소 경고',
};

const EVENT_DOT_COLOR: Partial<Record<EventType, string>> = {
  motion: 'var(--color-accent)', intrusion: 'var(--color-danger)',
  line_crossing: 'var(--color-info)', face_match: 'var(--color-success)',
  lpr: 'var(--color-warn)', offline: 'var(--color-danger)',
  online: 'var(--color-success)', storage_warn: 'var(--color-warn)',
};

const TIMELINE_LABELS = ['00:00', '06:00', '12:00', '18:00', '24:00'];

// ── Helpers ──────────────────────────────────────────────────────
function pad2(n: number) { return n.toString().padStart(2, '0'); }

function formatCountdown(sec: number) {
  return `${Math.floor(sec / 60)}:${pad2(sec % 60)}`;
}

function fractionOfDay(dateStr: string) {
  const d = new Date(dateStr);
  return (d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()) / 86400;
}

function nowFraction() {
  const d = new Date();
  return (d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()) / 86400;
}

function fmtAbsTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function relTime(dateStr: string) {
  const diffSec = Math.floor((Date.now() - Date.parse(dateStr)) / 1000);
  if (diffSec < 60) return `${diffSec}초 전`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}분 전`;
  return `${Math.floor(diffSec / 3600)}시간 전`;
}

function mockConfidence(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return 60 + (h % 40);
}

function mockDuration(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 17 + id.charCodeAt(i)) & 0xffff;
  return ['4초 지속', '12초 지속', '22초 지속', '8초 지속', '정상 처리', '녹화 진행중'][h % 6];
}

function snapshotAge(idx: number) {
  return ['5초 전', '3초 전', '2초 전', '8초 전', '1초 전', '4초 전'][idx % 6];
}

function timestampStr() {
  const d = new Date();
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
}

// ── CameraActionBar ───────────────────────────────────────────────
interface ActionBarProps {
  cam: Camera | null;
  site: string;
  countdown: number;
  mode: 'multi' | 'single';
  onBack?: () => void;
  onSnapshot: () => void;
  onStartLive?: () => void;
  onFullscreen?: () => void;
  onMore?: () => void;
  moreOpen?: boolean;
  moreRef?: React.RefObject<HTMLDivElement | null>;
  onMoreAction?: (action: string) => void;
}

function CameraActionBar({
  cam, site, countdown, mode,
  onBack, onSnapshot, onStartLive, onFullscreen,
  onMore, moreOpen, moreRef, onMoreAction,
}: ActionBarProps) {
  return (
    <div className={styles.actionBar}>
      {onBack && (
        <button type="button" className={styles.actionBackBtn} onClick={onBack} aria-label="멀티뷰로 돌아가기">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}
      <div className={styles.actionLeft}>
        <div className={styles.actionThumb}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="14" height="12" rx="2" /><path d="M16 10l5-3v10l-5-3z" />
          </svg>
        </div>
        <div className={styles.actionCamInfo}>
          <div className={styles.actionCamName}>
            {cam?.name ?? '—'}
            {cam && cam.status !== 'offline' && <span className={styles.liveBadge}>● LIVE</span>}
          </div>
          <div className={styles.actionCamMeta}>
            {cam ? `${cam.resolution} · ${cam.fps}fps · ${cam.codec}` : '—'}
            {mode === 'single' && site && ` · ${site}`}
          </div>
        </div>
      </div>

      <div className={styles.actionCenter}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
        </svg>
        <span>라이브 자동 종료 <strong>{formatCountdown(countdown)}</strong></span>
      </div>

      <div className={styles.actionRight}>
        <Button variant="secondary" size="sm" onClick={onSnapshot}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="12" cy="12" r="3.5" /><path d="M8 5l1.5-2h5L16 5" />
          </svg>
          스냅샷 저장
        </Button>
        {mode === 'single' ? (
          <Button variant="primary" size="sm" onClick={onFullscreen}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
            </svg>
            전체화면
          </Button>
        ) : (
          <Button variant="primary" size="sm" onClick={onStartLive}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polygon points="5,3 19,12 5,21" fill="currentColor" />
            </svg>
            라이브 시작
          </Button>
        )}
        {mode === 'single' && (
          <div className={styles.moreWrap} ref={moreRef}>
            <button type="button" className={[styles.moreBtn, moreOpen ? styles.moreBtnOpen : ''].join(' ')} onClick={onMore} aria-label="더보기">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="5" cy="12" r="1.5" fill="currentColor" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /><circle cx="19" cy="12" r="1.5" fill="currentColor" />
              </svg>
            </button>
            {moreOpen && (
              <div className={styles.moreMenu}>
                <button type="button" onClick={() => onMoreAction?.('replay')}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="5,3 19,12 5,21" /></svg>
                  녹화 영상 재생
                </button>
                <button type="button" onClick={() => onMoreAction?.('case')}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M12 11v6M9 14h6" /></svg>
                  사건철 추가
                </button>
                <button type="button" onClick={() => onMoreAction?.('download')}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7,10 12,15 17,10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  다운로드
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── CameraPickerModal ─────────────────────────────────────────────
interface CameraPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (cameraId: string) => void;
  sites: Site[];
  cameras: Camera[];
}

function CameraPickerModal({ open, onClose, onSelect, sites, cameras }: CameraPickerProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [customerId, setCustomerId] = useState('');
  const [siteId, setSiteId] = useState('');

  useEffect(() => {
    if (!open) { setStep(1); setCustomerId(''); setSiteId(''); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const customer = MOCK_CUSTOMERS.find((c) => c.id === customerId);
  const availableSites = customer ? sites.filter((s) => customer.siteIds.includes(s.id)) : [];
  const availableCams = siteId ? cameras.filter((c) => c.siteId === siteId && c.status !== 'offline') : [];

  const stepLabel = (n: 1 | 2 | 3, label: string) => (
    <div className={[styles.pickerStep, step === n ? styles.pickerStepActive : step > n ? styles.pickerStepDone : ''].join(' ')}>
      <span className={styles.pickerStepNum}>{step > n ? '✓' : n}</span>
      <span className={styles.pickerStepLabel}>{label}</span>
    </div>
  );

  return (
    <div className={styles.pickerOverlay} onClick={onClose}>
      <div className={styles.pickerModal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.pickerHeader}>
          <span className={styles.pickerTitle}>카메라 추가</span>
          <button type="button" className={styles.pickerClose} onClick={onClose} aria-label="닫기">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step indicators */}
        <div className={styles.pickerSteps}>
          {stepLabel(1, '고객 선택')}
          <span className={styles.pickerStepArrow}>›</span>
          {stepLabel(2, '지점 선택')}
          <span className={styles.pickerStepArrow}>›</span>
          {stepLabel(3, '카메라 선택')}
        </div>

        {/* Body */}
        <div className={styles.pickerBody}>
          {step === 1 && (
            <ul className={styles.pickerList}>
              {MOCK_CUSTOMERS.map((c) => (
                <li key={c.id}>
                  <button type="button" className={styles.pickerItem} onClick={() => { setCustomerId(c.id); setStep(2); }}>
                    <span className={styles.pickerItemNum}>{c.num}</span>
                    <span className={styles.pickerItemName}>{c.label}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {step === 2 && (
            <ul className={styles.pickerList}>
              {availableSites.map((s) => (
                <li key={s.id}>
                  <button type="button" className={styles.pickerItem} onClick={() => { setSiteId(s.id); setStep(3); }}>
                    <span className={styles.pickerItemName}>{s.name}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {step === 3 && (
            <ul className={styles.pickerList}>
              {availableCams.map((c) => (
                <li key={c.id}>
                  <button type="button" className={styles.pickerItem} onClick={() => { onSelect(c.id); onClose(); }}>
                    <span className={styles.pickerItemIcon}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="6" width="14" height="12" rx="2" /><path d="M16 10l5-3v10l-5-3z" />
                      </svg>
                    </span>
                    <span className={styles.pickerItemName}>{c.name}</span>
                    <span className={[styles.pickerItemBadge, c.status === 'recording' ? styles.pickerItemBadgeLive : ''].join(' ')}>
                      {c.status === 'recording' ? 'REC' : 'ON'}
                    </span>
                  </button>
                </li>
              ))}
              {availableCams.length === 0 && (
                <li className={styles.pickerEmpty}>배치 가능한 카메라가 없습니다.</li>
              )}
            </ul>
          )}
        </div>

        {/* Footer nav */}
        {step > 1 && (
          <div className={styles.pickerFooter}>
            <button type="button" className={styles.pickerBackBtn} onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}>
              ← 이전
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── VideoCell ────────────────────────────────────────────────────
interface VideoCellProps {
  cam: Camera | null;
  slotIdx: number;
  isSelected: boolean;
  isDragOver: boolean;
  displayMode: 'snap' | 'live';
  onSelect: () => void;
  onDoubleClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onRemove: () => void;
  onAddCamera: () => void;
}

function VideoCell({ cam, slotIdx, isSelected, isDragOver, displayMode, onSelect, onDoubleClick, onDragStart, onDragOver, onDragLeave, onDrop, onRemove, onAddCamera }: VideoCellProps) {
  const isLive = displayMode === 'live' && !!cam?.recording && cam?.status !== 'offline';
  const isSnapshot = !!(cam && displayMode === 'snap' && cam.status !== 'offline');
  const isOffline = cam?.status === 'offline';
  const isEmpty = !cam;
  const videoIdx = (slotIdx % 6) + 1;
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isLive) { v.play().catch(() => {}); } else { v.pause(); }
  }, [isLive]);

  const cls = [
    styles.cell,
    isOffline ? styles.cellOffline : '',
    isEmpty ? styles.cellEmpty : '',
    isDragOver ? styles.cellDragOver : '',
    isSelected && !isEmpty ? styles.cellSelected : '',
  ].filter(Boolean).join(' ');

  if (isEmpty) {
    return (
      <div className={cls} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
        <button type="button" className={styles.cellAddBtn} onClick={onAddCamera}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          카메라 추가
        </button>
      </div>
    );
  }

  return (
    <div
      className={cls}
      draggable={!isOffline}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
    >
      {!isOffline && (
        <video ref={videoRef} className={styles.cellVideo} src={`/mock-cctv/cam_0${videoIdx}.mp4`} loop muted playsInline preload="auto" />
      )}
      {isOffline && <span className={styles.cellOfflineLabel}>⊘ offline</span>}

      {/* Status dot: top-left */}
      {!isOffline && <span className={styles.liveDot} />}

      {/* Top-right: REC badge or snapshot age */}
      {isLive && <span className={styles.recBadge}><span />REC</span>}
      {isSnapshot && <span className={styles.snapAge}>{snapshotAge(slotIdx)}</span>}

      {/* Bottom-left: label */}
      <span className={styles.cellLabel}>
        {cam!.name.split(' ').slice(0, 2).join(' ')} · LIVE
      </span>

      {/* Remove button (hover only) */}
      <button type="button" className={styles.cellRemove} onClick={(e) => { e.stopPropagation(); onRemove(); }} aria-label="슬롯 비우기">×</button>
    </div>
  );
}

// ── PtzControl ───────────────────────────────────────────────────
function PtzControl() {
  const dirs = ['↖', '↑', '↗', '←', '·', '→', '↙', '↓', '↘'];
  const labels = ['좌상', '상', '우상', '좌', '홈', '우', '좌하', '하', '우하'];
  return (
    <div className={styles.ptz}>
      <span className={styles.ptzLabel}>PTZ</span>
      <div className={styles.ptzPad}>
        {dirs.map((d, i) => (
          <button key={d} type="button" className={[styles.ptzBtn, d === '·' ? styles.ptzBtnHome : ''].join(' ')} aria-label={labels[i]}>{d}</button>
        ))}
      </div>
      <div className={styles.ptzZoom}>
        <button type="button" className={styles.ptzZoomBtn} aria-label="줌 아웃">−</button>
        <button type="button" className={styles.ptzZoomBtn} aria-label="줌 인">+</button>
      </div>
    </div>
  );
}

// ── Timeline24h ──────────────────────────────────────────────────
interface TimelineProps {
  dateStr: string;
  cursor: number;
  markers: { fraction: number; level: string }[];
  selectedMarkerFraction: number | null;
  onCursorChange: (f: number) => void;
  onShiftHour: (delta: number) => void;
}

function Timeline24h({ dateStr, cursor, markers, selectedMarkerFraction, onCursorChange, onShiftHour }: TimelineProps) {
  const barRef = useRef<HTMLDivElement>(null);

  function handleBarClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    onCursorChange(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
  }

  const totalSec = Math.round(cursor * 86400);
  const timeStr = `${pad2(Math.floor(totalSec / 3600))}:${pad2(Math.floor((totalSec % 3600) / 60))}:${pad2(totalSec % 60)}`;

  return (
    <div className={styles.timeline}>
      <div className={styles.tlHeader}>
        <span className={styles.tlTitle}>타임라인 — {dateStr}</span>
        <span className={styles.tlCurrent}>현재 위치 <strong>{timeStr}</strong> · 이벤트 {markers.length}건</span>
        <div className={styles.tlNavBtns}>
          <button type="button" className={styles.tlNavBtn} onClick={() => onShiftHour(-1)}>⏮ 1H</button>
          <button type="button" className={styles.tlNavBtn} onClick={() => onShiftHour(1)}>⏭ 1H</button>
        </div>
      </div>
      <div ref={barRef} className={styles.tlBar} onClick={handleBarClick} role="slider" tabIndex={0} aria-valuenow={Math.round(cursor * 100)} aria-label="타임라인">
        <div className={styles.tlGrad} />
        {markers.map((m, i) => (
          <span
            key={i}
            className={[styles.tlMark, m.level === 'danger' ? styles.tlMarkDanger : styles.tlMarkWarn, selectedMarkerFraction === m.fraction ? styles.tlMarkActive : ''].filter(Boolean).join(' ')}
            style={{ left: `${m.fraction * 100}%` }}
          />
        ))}
        <div className={styles.tlCursor} style={{ left: `${cursor * 100}%` }}>
          <span className={styles.tlCursorDot} />
          <span className={styles.tlCursorLine} />
          <span className={styles.tlCursorDot} />
        </div>
      </div>
      <div className={styles.tlLabels}>
        {TIMELINE_LABELS.map((h) => <span key={h}>{h}</span>)}
      </div>
    </div>
  );
}

// ── EventItem ────────────────────────────────────────────────────
function EventItem({ ev, isActive, onClick }: { ev: AppEvent; isActive: boolean; onClick: () => void }) {
  const isDanger = ev.level === 'danger';
  return (
    <button
      type="button"
      className={[styles.eventItem, isDanger ? styles.eventItemDanger : '', isActive ? styles.eventItemActive : ''].filter(Boolean).join(' ')}
      onClick={onClick}
    >
      <div className={styles.eventThumb}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="14" height="12" rx="1.5" /><path d="M16 10l5-3v10l-5-3z" />
        </svg>
      </div>
      <div className={styles.eventBody}>
        <div className={styles.eventRow1}>
          <span className={styles.eventDot} style={{ background: EVENT_DOT_COLOR[ev.type] ?? 'var(--color-accent)' }} />
          <span className={styles.eventTypeName}>{EVENT_TYPE_LABELS[ev.type] ?? ev.type}</span>
        </div>
        <div className={styles.eventRow2}>
          <span className={styles.eventAbsTime}>{fmtAbsTime(ev.occurredAt)}</span>
          <span className={styles.eventRelTime}>{relTime(ev.occurredAt)}</span>
        </div>
        <div className={styles.eventRow3}>
          <span className={styles.eventConf}>{mockConfidence(ev.id)}%</span>
          <span className={styles.eventDur}>· {mockDuration(ev.id)}</span>
        </div>
      </div>
    </button>
  );
}

// ── Main Component ───────────────────────────────────────────────
export default function Monitoring() {
  const sites = useDataStore((s) => s.sites);
  const cameras = useDataStore((s) => s.cameras);
  const events = useDataStore((s) => s.events);
  const patchCamera = useDataStore((s) => s.patchCamera);
  const toast = useToast();

  const [selectedSiteId, setSelectedSiteId] = useState<string>(() => sites[0]?.id ?? '');

  // shared view state
  const [viewMode, setViewMode] = useState<'multi' | 'single'>('multi');
  const [selectedCamId, setSelectedCamId] = useState(cameras[0]?.id ?? '');
  const [layout, setLayout] = useState<Layout>(3);
  const [zone, setZone] = useState('전체');
  const [zones, setZones] = useState<string[]>(INITIAL_ZONES);
  const [addingZone, setAddingZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [displayMode, setDisplayMode] = useState<'snap' | 'live'>('snap');
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);

  // countdown
  const [countdown, setCountdown] = useState(268);
  useEffect(() => {
    const id = setInterval(() => setCountdown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  // drag/drop slots
  const siteCams = useMemo(
    () => cameras.filter((c) => c.siteId === selectedSiteId && (zone === '전체' || cameraZone(c.name) === zone)),
    [cameras, selectedSiteId, zone],
  );
  const slotCount = layout * layout;
  const [slotMap, setSlotMap] = useState<(string | null)[]>([]);
  const [dragOver, setDragOver] = useState<number | null>(null);

  useEffect(() => {
    const arr: (string | null)[] = siteCams.slice(0, slotCount).map((c) => c.id);
    while (arr.length < slotCount) arr.push(null);
    setSlotMap(arr);
  }, [selectedSiteId, slotCount, zone, siteCams.length]); // eslint-disable-line

  const slots = useMemo(
    () => slotMap.map((id) => (id ? cameras.find((c) => c.id === id) ?? null : null)),
    [slotMap, cameras],
  );


  // single-view state
  const [panelTab, setPanelTab] = useState('events');
  const [cursorFraction, setCursorFraction] = useState(nowFraction);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeEventTypes, setActiveEventTypes] = useState<Set<EventType>>(
    new Set<EventType>(['motion', 'intrusion', 'line_crossing', 'face_match', 'lpr']),
  );
  const [eventPeriod, setEventPeriod] = useState<EventPeriod>('24h');
  const [ptzVisible, setPtzVisible] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // ESC → back to multi
  useEffect(() => {
    if (viewMode !== 'single') return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setViewMode('multi'); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewMode]);

  // close more menu on outside click
  useEffect(() => {
    if (!moreOpen) return;
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [moreOpen]);

  const selectedCam = cameras.find((c) => c.id === selectedCamId) ?? null;
  const selectedSite = sites.find((s) => s.id === selectedSiteId);

  function enterSingleView(camId: string) {
    const cam = cameras.find((c) => c.id === camId);
    if (cam && cam.status === 'online') patchCamera(camId, { status: 'recording', recording: true });
    setSelectedCamId(camId);
    setViewMode('single');
    setPtzVisible(false);
    setSelectedEventId(null);
  }

  // filtered events for right panel
  const camEvents = useMemo(() => {
    const cutoffs: Record<EventPeriod, number> = {
      today: new Date().setHours(0, 0, 0, 0),
      '24h': Date.now() - 86400000,
      '7d': Date.now() - 7 * 86400000,
      '30d': Date.now() - 30 * 86400000,
    };
    return [...events]
      .filter((e) => e.cameraId === selectedCamId && activeEventTypes.has(e.type) && Date.parse(e.occurredAt) >= cutoffs[eventPeriod])
      .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
  }, [events, selectedCamId, activeEventTypes, eventPeriod]);

  const timelineMarkers = useMemo(
    () => events.filter((e) => e.cameraId === selectedCamId).map((e) => ({ fraction: fractionOfDay(e.occurredAt), level: e.level })),
    [events, selectedCamId],
  );

  const selectedEventFraction = useMemo(
    () => selectedEventId ? fractionOfDay(events.find((e) => e.id === selectedEventId)?.occurredAt ?? '') : null,
    [events, selectedEventId],
  );

  // drag handlers
  function handleDragStart(e: React.DragEvent, camId: string, fromSlot?: number) {
    e.dataTransfer.setData('text/plain', JSON.stringify({ camId, fromSlot: fromSlot ?? null }));
    e.dataTransfer.effectAllowed = 'move';
  }
  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOver !== i) setDragOver(i);
  }
  function handleDrop(e: React.DragEvent, toSlot: number) {
    e.preventDefault();
    setDragOver(null);
    try {
      const { camId, fromSlot } = JSON.parse(e.dataTransfer.getData('text/plain')) as { camId: string; fromSlot: number | null };
      setSlotMap((prev) => {
        const next = [...prev];
        if (fromSlot != null && fromSlot !== toSlot) { next[toSlot] = camId; next[fromSlot] = prev[toSlot] ?? null; }
        else if (fromSlot == null) { next[toSlot] = camId; }
        return next;
      });
    } catch { /* ignore */ }
  }

  function handleSnapshot() {
    if (!selectedCam) return;
    toast.success('스냅샷 저장', `${selectedCam.name}_${timestampStr()}.jpg`);
  }
  const todayStr = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '');

  // ── Single view ──────────────────────────────────────────────
  if (viewMode === 'single') {
    const videoIdx = (cameras.findIndex((c) => c.id === selectedCamId) % 6) + 1;

    return (
      <div className={styles.singlePage}>
        {/* Action bar */}
        <CameraActionBar
          cam={selectedCam} site={selectedSite?.name ?? ''} countdown={countdown} mode="single"
          onBack={() => setViewMode('multi')}
          onSnapshot={handleSnapshot}
          onFullscreen={() => { (document.querySelector(`.${styles.videoFrame}`) as HTMLElement | null)?.requestFullscreen?.(); }}
          onMore={() => setMoreOpen((v) => !v)}
          moreOpen={moreOpen} moreRef={moreRef}
          onMoreAction={(action) => {
            setMoreOpen(false);
            const msgs: Record<string, [string, string]> = {
              replay: ['재생', '녹화 영상 재생을 시작합니다.'],
              case: ['사건철 추가', '현재 클립이 사건철에 추가됩니다.'],
              download: ['다운로드', '영상 다운로드를 준비 중입니다.'],
            };
            if (msgs[action]) toast.info(...msgs[action]);
          }}
        />

        {/* Main: canvas + right panel */}
        <div className={styles.singleContent}>
          {/* Left: video + timeline */}
          <div className={styles.canvasArea}>
            <div className={styles.videoFrame}>
              {selectedCam && selectedCam.status !== 'offline' ? (
                <video className={styles.singleVideo} src={`/mock-cctv/cam_0${videoIdx}.mp4`} autoPlay loop muted playsInline />
              ) : (
                <div className={styles.videoOffline}>⊘ offline</div>
              )}
              {selectedCam && selectedCam.status !== 'offline' && (
                <div className={styles.videoBottomBar}>
                  <span className={styles.videoLabel}>{selectedCam.name} · LIVE {selectedCam.resolution} · {todayStr}</span>
                </div>
              )}
              {selectedCam?.recording && <span className={styles.videoRec}><span />REC</span>}
              {ptzVisible && <PtzControl />}
            </div>
            <Timeline24h
              dateStr={todayStr}
              cursor={cursorFraction}
              markers={timelineMarkers}
              selectedMarkerFraction={selectedEventFraction}
              onCursorChange={setCursorFraction}
              onShiftHour={(delta) => setCursorFraction((f) => Math.max(0, Math.min(1, f + (delta * 3600) / 86400)))}
            />
          </div>

          {/* Right: tabs + content */}
          <div className={styles.rightPanel}>
            <Tabs tabs={PANEL_TABS} active={panelTab} onChange={setPanelTab} />

            {panelTab === 'events' && (
              <div className={styles.eventPanelContent}>
                {/* Filter card */}
                <div className={styles.filterCard}>
                  <div className={styles.filterSection}>
                    <span className={styles.filterLabel}>이벤트 유형</span>
                    <div className={styles.filterChips}>
                      {EVENT_FILTER_DEFS.map((f) => {
                        const active = activeEventTypes.has(f.type);
                        return (
                          <button
                            key={f.type}
                            type="button"
                            className={[styles.filterChip, active ? styles.filterChipActive : ''].join(' ')}
                            onClick={() =>
                              setActiveEventTypes((prev) => {
                                const next = new Set(prev);
                                next.has(f.type) ? next.delete(f.type) : next.add(f.type);
                                return next;
                              })
                            }
                          >
                            <span className={styles.filterChipDot} style={{ background: active ? (EVENT_DOT_COLOR[f.type] ?? 'var(--color-accent)') : 'var(--color-border)' }} />
                            {f.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className={styles.filterSection}>
                    <span className={styles.filterLabel}>기간</span>
                    <BtnGroup>
                      {(['today', '24h', '7d', '30d'] as EventPeriod[]).map((p) => (
                        <BtnGroup.Btn key={p} active={eventPeriod === p} onClick={() => setEventPeriod(p)}>
                          {PERIOD_LABELS[p]}
                        </BtnGroup.Btn>
                      ))}
                    </BtnGroup>
                  </div>
                </div>

                {/* Event list */}
                <div className={styles.eventListHeader}>
                  <span className={styles.eventCount}>총 {camEvents.length}건</span>
                  <span className={styles.eventSort}>최신순 ↓</span>
                </div>
                <div className={styles.eventList}>
                  {camEvents.map((ev) => (
                    <EventItem
                      key={ev.id}
                      ev={ev}
                      isActive={ev.id === selectedEventId}
                      onClick={() => { setSelectedEventId(ev.id); setCursorFraction(fractionOfDay(ev.occurredAt)); }}
                    />
                  ))}
                  {camEvents.length === 0 && <div className={styles.eventEmpty}>해당 조건의 이벤트가 없습니다.</div>}
                </div>
              </div>
            )}

            {panelTab === 'info' && selectedCam && (
              <div className={styles.infoPanel}>
                {([['카메라명', selectedCam.name], ['IP 주소', selectedCam.ip], ['모델', selectedCam.model], ['펌웨어', selectedCam.firmware], ['코덱', selectedCam.codec], ['해상도', selectedCam.resolution], ['FPS', `${selectedCam.fps}fps`], ['저장소', `${selectedCam.storageGb} GB`], ['상태', selectedCam.status]] as [string, string][]).map(([k, v]) => (
                  <div key={k} className={styles.infoRow}>
                    <span className={styles.infoKey}>{k}</span>
                    <span className={styles.infoVal}>{v}</span>
                  </div>
                ))}
              </div>
            )}

            {panelTab === 'settings' && (
              <div className={styles.settingsPanel}>
                <p className={styles.settingsHint}>카메라 상세 설정은 카메라 설정 페이지에서 변경하세요.</p>
                <Button variant="secondary" size="sm" block>카메라 설정으로 이동</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Multi view ────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* 사이트 선택 */}
      <div className={styles.siteRow}>
        {sites.map((s) => (
          <button
            key={s.id}
            type="button"
            className={[styles.siteChip, selectedSiteId === s.id ? styles.siteChipActive : ''].join(' ')}
            onClick={() => setSelectedSiteId(s.id)}
          >
            {s.name}
            <span className={styles.siteChipCount}>{s.cameraCount}</span>
          </button>
        ))}
      </div>

      {/* Toolbar: view toggle + zone chips + layout selector */}
      <div className={styles.toolbarWrap}>
        <div className={styles.toolbarRow}>
          {/* 보기 toggle */}
          <div className={styles.toolbarField}>
            <span className={styles.toolbarLabel}>보기</span>
            <BtnGroup>
              {(['snap', 'live'] as const).map((key) => (
                <BtnGroup.Btn
                  key={key}
                  active={displayMode === key}
                  onClick={() => {
                    if (displayMode === key) return;
                    setDisplayMode(key);
                    if (key === 'live') {
                      siteCams.forEach((c) => patchCamera(c.id, { recording: true, status: 'recording' }));
                    } else {
                      siteCams.forEach((c) => patchCamera(c.id, { recording: false, status: 'online' }));
                    }
                  }}
                >
                  {key === 'snap' ? '스냅샷' : '라이브'}
                </BtnGroup.Btn>
              ))}
            </BtnGroup>
          </div>

          {/* 구역 chips */}
          <div className={styles.toolbarFieldStretch}>
            <span className={styles.toolbarLabel}>구역</span>
              <div className={styles.chipGroup}>
                {zones.map((z) => (
                  <button
                    key={z}
                    type="button"
                    className={[styles.zoneChip, zone === z ? styles.zoneChipActive : ''].join(' ')}
                    onClick={() => setZone(z)}
                  >{z}</button>
                ))}
                {addingZone ? (
                  <input
                    autoFocus
                    className={styles.zoneAddInput}
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const name = newZoneName.trim();
                        if (name && !zones.includes(name)) setZones((prev) => [...prev, name]);
                        setNewZoneName('');
                        setAddingZone(false);
                      }
                      if (e.key === 'Escape') { setNewZoneName(''); setAddingZone(false); }
                    }}
                    onBlur={() => {
                      const name = newZoneName.trim();
                      if (name && !zones.includes(name)) setZones((prev) => [...prev, name]);
                      setNewZoneName('');
                      setAddingZone(false);
                    }}
                    placeholder="구역명 입력"
                    maxLength={10}
                  />
                ) : (
                  <button type="button" className={styles.addCamBtn} onClick={() => setAddingZone(true)}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
                    구역 추가
                  </button>
                )}
              </div>
            </div>

          {/* 레이아웃 선택 */}
          <BtnGroup>
            {LAYOUTS.map((n) => (
              <BtnGroup.Btn key={n} active={layout === n} onClick={() => setLayout(n)}>
                {n}×{n}
              </BtnGroup.Btn>
            ))}
          </BtnGroup>
        </div>
      </div>

      {/* Video grid */}
      <div className={[styles.grid, layout === 2 ? styles.grid2 : layout === 4 ? styles.grid4 : styles.grid3].join(' ')}>
        {slots.map((cam, i) => (
          <VideoCell
            key={cam ? `${cam.id}-${i}` : `empty-${i}`}
            cam={cam} slotIdx={i}
            displayMode={displayMode}
            isSelected={cam?.id === selectedCamId}
            isDragOver={dragOver === i}
            onSelect={() => cam && setSelectedCamId(cam.id)}
            onDoubleClick={() => cam && enterSingleView(cam.id)}
            onDragStart={(e) => cam && handleDragStart(e, cam.id, i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => handleDrop(e, i)}
            onRemove={() => setSlotMap((prev) => { const next = [...prev]; next[i] = null; return next; })}
            onAddCamera={() => setPickerSlot(i)}
          />
        ))}
      </div>

      <CameraPickerModal
        open={pickerSlot !== null}
        onClose={() => setPickerSlot(null)}
        onSelect={(cameraId) => {
          if (pickerSlot === null) return;
          setSlotMap((prev) => { const next = [...prev]; next[pickerSlot] = cameraId; return next; });
        }}
        sites={sites}
        cameras={cameras}
      />
    </div>
  );
}
