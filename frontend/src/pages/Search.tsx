// TODO: replace with POST /api/v1/search
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/hooks/useToast';
import { relativeTime } from '@/lib/time';
import {
  MOCK_RESULTS_BY_QUERY,
  RECENT_QUERIES,
} from '@/mock/searchResults';
import type { SearchResult, SearchSensitivity } from '@/types/search';
import page from './Page.module.css';
import styles from './Search.module.css';

type SearchPhase = 'idle' | 'loading' | 'results';
type SortKey = 'score' | 'time';
type ObjType = 'all' | 'person' | 'vehicle';

/* ── 상수 ── */

const COLOR_SWATCHES: { value: string; label: string; bg: string; border?: boolean }[] = [
  { value: '빨간색', label: '빨간색', bg: '#E53E3E' },
  { value: '주황색', label: '주황색', bg: '#ED8936' },
  { value: '노란색', label: '노란색', bg: '#ECC94B' },
  { value: '초록색', label: '초록색', bg: '#48BB78' },
  { value: '파란색', label: '파란색', bg: '#4299E1' },
  { value: '보라색', label: '보라색', bg: '#9F7AEA' },
  { value: '검정색', label: '검정색', bg: '#2D3748' },
  { value: '흰색',   label: '흰색',   bg: '#F7FAFC', border: true },
  { value: '회색',   label: '회색',   bg: '#718096' },
  { value: '갈색',   label: '갈색',   bg: '#9C6644' },
];

const MOCK_EVENTS = [
  { id: 'ev-1', cam: '강남본점 1F 로비',  type: '미확인 인물 감지',   hoursAgo: 2,  query: '야간에 들어온 사람' },
  { id: 'ev-2', cam: '서초지점 출입구',    type: '야간 침입 경보',     hoursAgo: 4,  query: '야간에 들어온 사람' },
  { id: 'ev-3', cam: '송파 지하창고',      type: '배회 감지 알림',     hoursAgo: 6,  query: '야간에 들어온 사람' },
  { id: 'ev-4', cam: '판교 R&D 서버룸',   type: '비인가 접근 시도',   hoursAgo: 12, query: '마스크 쓴 사람' },
  { id: 'ev-5', cam: '강남본점 주차장',    type: '장시간 주정차 감지', hoursAgo: 18, query: '검은색 SUV' },
];

const EXAMPLE_SEARCHES = {
  person: [
    { label: '빨간 옷 입은 여성', query: '빨간 옷 입은 사람' },
    { label: '마스크 착용자',      query: '마스크 쓴 사람' },
    { label: '야간 침입자',        query: '야간에 들어온 사람' },
    { label: '20대 여성',          query: '20대 여성' },
    { label: '넘어진 사람',        query: '넘어진 사람' },
  ],
  vehicle: [
    { label: '노란색 차량',  query: '검은색 SUV' },
    { label: '검은 SUV',     query: '검은색 SUV' },
    { label: '번호판 12가',  query: '흰색 차량 번호 12가' },
    { label: '오토바이',     query: '오토바이' },
  ],
};

/* ── SVG 썸네일 ── */

const SEED_PALETTES: Record<string, [string, string, string]> = {
  red:     ['var(--color-danger)', 'var(--color-warn)', 'var(--color-video-bg)'],
  suv:     ['var(--color-text)', 'var(--color-text-muted)', 'var(--color-video-bg)'],
  night:   ['var(--color-brand)', 'var(--color-text)', 'var(--color-video-bg)'],
  fall:    ['var(--color-warn)', 'var(--color-danger)', 'var(--color-video-bg)'],
  w20:     ['var(--color-accent)', 'var(--color-brand)', 'var(--color-video-bg)'],
  lpr:     ['var(--color-info)', 'var(--color-accent-hover)', 'var(--color-video-bg)'],
  moto:    ['var(--color-text-muted)', 'var(--color-text)', 'var(--color-video-bg)'],
  mask:    ['var(--color-success)', 'var(--color-info)', 'var(--color-video-bg)'],
  default: ['var(--color-accent)', 'var(--color-brand)', 'var(--color-video-bg)'],
};

function pickPalette(seed: string): [string, string, string] {
  const prefix = seed.split('-')[0];
  return SEED_PALETTES[prefix] ?? SEED_PALETTES.default;
}

function ThumbSvg({ seed }: { seed: string }) {
  const [c1, c2, c3] = pickPalette(seed);
  const id = `g-${seed}`;
  const hash = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const cx = 30 + (hash % 40);
  return (
    <svg className={styles.thumbSvg} viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor={c1} />
          <stop offset="55%"  stopColor={c2} />
          <stop offset="100%" stopColor={c3} />
        </linearGradient>
      </defs>
      <rect width="160" height="90" fill={`url(#${id})`} />
      <g fill="white" stroke="white">
        <line x1="0" y1="68" x2="160" y2="68" strokeOpacity="0.18" strokeWidth="0.6" />
        <ellipse cx={cx} cy="48" rx="6" ry="6" fillOpacity="0.55" stroke="none" />
        <rect x={cx - 6} y="54" width="12" height="18" rx="3" fillOpacity="0.55" stroke="none" />
        <rect x="100" y="20" width="44" height="34" rx="2" fillOpacity="0.08" stroke="none" />
        <rect x="106" y="26" width="10" height="8" fillOpacity="0.16" stroke="none" />
        <rect x="120" y="26" width="10" height="8" fillOpacity="0.16" stroke="none" />
        <rect x="106" y="38" width="10" height="8" fillOpacity="0.16" stroke="none" />
      </g>
    </svg>
  );
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m === 0 ? `${s}초` : `${m}:${s.toString().padStart(2, '0')}`;
}

function ResultCard({ result, onClick }: { result: SearchResult; onClick: () => void }) {
  return (
    <button type="button" className={styles.card} onClick={onClick}>
      <div className={styles.thumb}>
        <ThumbSvg seed={result.thumbnailSeed} />
        <span className={styles.scoreBadge}>{result.score.toFixed(2)}</span>
        <span className={styles.durBadge}>{formatDuration(result.durationSec)}</span>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardMetaRow}>
          <span className={styles.cardCam}>{result.cameraName} · {result.siteName}</span>
          <span className={styles.cardTime}>{relativeTime(result.occurredAt)}</span>
        </div>
        <div className={styles.cardCaption}>{result.caption}</div>
        <div className={styles.attrRow}>
          {result.matchedAttributes.slice(0, 4).map((a) => (
            <Badge key={a} tone="info">{a}</Badge>
          ))}
        </div>
      </div>
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonThumb} />
      <div className={styles.skeletonBody}>
        <div className={styles.skeletonLine} />
        <div className={[styles.skeletonLine, styles.skeletonLineShort].join(' ')} />
      </div>
    </div>
  );
}

/* ── 헬퍼 ── */

const PERSON_KW  = ['남성', '여성', '20대', '30대', '노년', '낙상', '마스크', '후드', '야간'];
const VEHICLE_KW = ['차량', 'SUV', '오토바이', '세단', '번호판'];

function matchObjType(r: SearchResult, type: ObjType): boolean {
  if (type === 'all') return true;
  const joined = r.matchedAttributes.join(' ');
  return type === 'person'
    ? PERSON_KW.some((k) => joined.includes(k))
    : VEHICLE_KW.some((k) => joined.includes(k));
}

function SwatchBtn({ item, active, onClick }: {
  item: (typeof COLOR_SWATCHES)[number];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={item.label}
      className={[styles.swatch, active ? styles.swatchActive : ''].filter(Boolean).join(' ')}
      style={{ background: item.bg, ...(item.border ? { border: '1px solid var(--color-border)' } : {}) }}
      onClick={onClick}
    />
  );
}

/* ── 메인 컴포넌트 ── */

export default function Search() {
  const toast = useToast();

  const [input, setInput]         = useState('');
  const [phase, setPhase]         = useState<SearchPhase>('idle');
  const [results, setResults]     = useState<SearchResult[]>([]);
  const [activeQuery, setActiveQuery] = useState('');
  const [elapsedMs, setElapsedMs] = useState(0);

  const [sensitivity]             = useState<SearchSensitivity>('mid');
  const [sortKey, setSortKey]     = useState<SortKey>('score');
  const [objType, setObjType]     = useState<ObjType>('all');

  // 색상 검색
  const [topColor, setTopColor]       = useState('');
  const [bottomColor, setBottomColor] = useState('');

  // 이미지 업로드
  const [uploadedFile, setUploadedFile]   = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver]       = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const timerRef = useRef<number | null>(null);
  useEffect(() => () => { if (timerRef.current !== null) window.clearTimeout(timerRef.current); }, []);

  const runSearch = useCallback((query: string) => {
    const q = query.trim();
    if (!q || phase === 'loading') return;
    setActiveQuery(q);
    setPhase('loading');
    setElapsedMs(0);
    setObjType('all');
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    const start = performance.now();
    timerRef.current = window.setTimeout(() => {
      const threshold = sensitivity === 'low' ? 0.78 : sensitivity === 'mid' ? 0.65 : 0;
      const next = [...(MOCK_RESULTS_BY_QUERY[q] ?? MOCK_RESULTS_BY_QUERY['빨간 옷 입은 사람'] ?? [])]
        .filter((r) => r.score >= threshold);
      setResults(next);
      setElapsedMs(Math.round(performance.now() - start));
      setPhase('results');
    }, 600);
  }, [phase, sensitivity]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    setUploadPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file?.type.startsWith('image/')) return;
    setUploadedFile(file);
    setUploadPreview(URL.createObjectURL(file));
  };

  const clearUpload = () => {
    setUploadedFile(null);
    setUploadPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const runColorSearch = () => {
    const parts: string[] = [];
    if (topColor)    parts.push(`${topColor} 상의`);
    if (bottomColor) parts.push(`${bottomColor} 하의`);
    if (!parts.length) return;
    setInput(parts.join(' '));
    const mockKey = topColor === '빨간색' || topColor === '주황색'
      ? '빨간 옷 입은 사람'
      : topColor === '검정색' ? '야간에 들어온 사람' : '빨간 옷 입은 사람';
    runSearch(mockKey);
  };

  const runImageSearch = () => {
    if (!uploadedFile) return;
    setInput(`이미지: ${uploadedFile.name}`);
    runSearch('빨간 옷 입은 사람');
  };

  const handleReset = () => {
    setInput(''); setPhase('idle'); setResults([]);
    setActiveQuery(''); setTopColor(''); setBottomColor('');
    clearUpload();
  };

  const sortedResults = useMemo(() => {
    const arr = [...results].filter((r) => matchObjType(r, objType));
    return sortKey === 'score'
      ? arr.sort((a, b) => b.score - a.score)
      : arr.sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
  }, [results, sortKey, objType]);

  const personCount  = useMemo(() => results.filter((r) => matchObjType(r, 'person')).length,  [results]);
  const vehicleCount = useMemo(() => results.filter((r) => matchObjType(r, 'vehicle')).length, [results]);

  const handleCardClick = (r: SearchResult) =>
    toast.info('재생 페이지는 준비 중입니다', `${r.cameraName} · ${r.caption}`);

  return (
    <div className={[page.page, styles.searchPage].join(' ')}>

      {/* ═══ 검색 바 ═══ */}
      <div className={styles.searchBarWrap}>
        <div className={styles.searchBarInner}>
          <div className={styles.searchInputWrap}>
            <svg className={styles.searchIconInside} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              className={styles.searchInputNew}
              type="text"
              placeholder="카메라 영상에서 찾고 싶은 내용을 입력하세요 — 예: 빨간 옷 입은 여성, 검은 SUV"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') runSearch(input); }}
            />
            {input && (
              <button type="button" className={styles.searchClearBtn} onClick={() => setInput('')} aria-label="지우기">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            )}
          </div>
          {phase !== 'idle' && (
            <button type="button" className={styles.resetBtn} onClick={handleReset}>초기화</button>
          )}
          <button type="button" className={styles.searchSubmit} onClick={() => runSearch(input)} disabled={phase === 'loading'}>
            검색
          </button>
        </div>
      </div>

      {/* ═══ 콘텐츠 영역 ═══ */}
      <section className={styles.results}>

        {/* ── IDLE: 검색 런치패드 ── */}
        {phase === 'idle' && (
          <div className={styles.launchpad}>

            <div className={styles.launchHero}>
              <div className={styles.launchTitle}>어떻게 찾으시겠어요?</div>
              <div className={styles.launchSub}>검색 방법을 선택하거나 위 검색창에 직접 입력하세요</div>
            </div>

            <div className={styles.tileGrid}>

              {/* Tile 1: 자연어 검색 */}
              <div className={styles.tile}>
                <div className={styles.tileHeader}>
                  <div className={styles.tileIconWrap}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <div className={styles.tileTitleBox}>
                    <div className={styles.tileTitle}>자연어 검색</div>
                    <div className={styles.tileDesc}>일상 언어로 찾고 싶은 장면을 설명하세요</div>
                  </div>
                </div>
                <div className={styles.tileBody}>
                  <div className={styles.exBlock}>
                    <span className={styles.exLabel}>
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/></svg>
                      인물
                    </span>
                    <div className={styles.exChips}>
                      {EXAMPLE_SEARCHES.person.map((ex) => (
                        <button key={ex.label} type="button" className={styles.exChip}
                          onClick={() => { setInput(ex.label); runSearch(ex.query); }}>
                          {ex.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={styles.exBlock}>
                    <span className={styles.exLabel}>
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                      차량
                    </span>
                    <div className={styles.exChips}>
                      {EXAMPLE_SEARCHES.vehicle.map((ex) => (
                        <button key={ex.label} type="button" className={styles.exChip}
                          onClick={() => { setInput(ex.label); runSearch(ex.query); }}>
                          {ex.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tile 2: 이미지 업로드 */}
              <div className={styles.tile}>
                <div className={styles.tileHeader}>
                  <div className={styles.tileIconWrap}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                  <div className={styles.tileTitleBox}>
                    <div className={styles.tileTitle}>이미지 업로드</div>
                    <div className={styles.tileDesc}>사진으로 유사한 인물·차량을 찾습니다</div>
                  </div>
                </div>
                <div className={styles.tileBody}>
                  {uploadPreview ? (
                    <div className={styles.uploadPreviewWrap}>
                      <img src={uploadPreview} className={styles.uploadPreviewImg} alt="업로드된 이미지" />
                      <div className={styles.uploadPreviewName}>{uploadedFile?.name}</div>
                      <div className={styles.uploadPreviewActions}>
                        <button type="button" className={styles.uploadActionBtn} onClick={runImageSearch}>이미지로 검색</button>
                        <button type="button" className={styles.uploadActionBtnSec} onClick={clearUpload}>다시 선택</button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={[styles.uploadZone, isDragOver ? styles.uploadZoneActive : ''].filter(Boolean).join(' ')}
                      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <svg viewBox="0 0 24 24" className={styles.uploadZoneIcon} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <div className={styles.uploadZoneText}>이미지를 드래그하거나 클릭해서 업로드</div>
                      <div className={styles.uploadZoneHint}>JPG · PNG · WEBP</div>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                </div>
              </div>

              {/* Tile 3: 색상으로 찾기 */}
              <div className={styles.tile}>
                <div className={styles.tileHeader}>
                  <div className={styles.tileIconWrap}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
                      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
                      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
                      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.476-1.13C12.896 18.86 12.73 18.4 12.73 18c0-.92.747-1.667 1.668-1.667h1.96C18.942 16.333 21 14.276 21 11.8 21 6.48 17.005 2 12 2z" />
                    </svg>
                  </div>
                  <div className={styles.tileTitleBox}>
                    <div className={styles.tileTitle}>색상으로 찾기</div>
                    <div className={styles.tileDesc}>상의·하의 색상으로 인물을 필터링합니다</div>
                  </div>
                </div>
                <div className={styles.tileBody}>
                  <div className={styles.colorPickSection}>
                    <div className={styles.colorPickLabel}>상의 색상</div>
                    <div className={styles.swatchRow}>
                      {COLOR_SWATCHES.map((c) => (
                        <SwatchBtn key={c.value} item={c} active={topColor === c.value} onClick={() => setTopColor(topColor === c.value ? '' : c.value)} />
                      ))}
                    </div>
                  </div>
                  <div className={styles.colorPickSection}>
                    <div className={styles.colorPickLabel}>하의 색상</div>
                    <div className={styles.swatchRow}>
                      {COLOR_SWATCHES.map((c) => (
                        <SwatchBtn key={c.value} item={c} active={bottomColor === c.value} onClick={() => setBottomColor(bottomColor === c.value ? '' : c.value)} />
                      ))}
                    </div>
                  </div>
                  {(topColor || bottomColor) && (
                    <div className={styles.colorSelected}>
                      {topColor    && <span className={styles.colorTag}>상의: {topColor}</span>}
                      {bottomColor && <span className={styles.colorTag}>하의: {bottomColor}</span>}
                    </div>
                  )}
                  <button type="button" className={styles.colorSearchBtn} disabled={!topColor && !bottomColor} onClick={runColorSearch}>
                    이 색상으로 검색
                  </button>
                </div>
              </div>

              {/* Tile 4: 이벤트에서 찾기 */}
              <div className={styles.tile}>
                <div className={styles.tileHeader}>
                  <div className={styles.tileIconWrap}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </div>
                  <div className={styles.tileTitleBox}>
                    <div className={styles.tileTitle}>이벤트에서 찾기</div>
                    <div className={styles.tileDesc}>최근 알림을 클릭해 관련 영상을 추적합니다</div>
                  </div>
                </div>
                <div className={styles.tileBody}>
                  <div className={styles.eventList}>
                    {MOCK_EVENTS.map((ev) => (
                      <button key={ev.id} type="button" className={styles.eventItem}
                        onClick={() => { setInput(ev.type); runSearch(ev.query); }}>
                        <span className={styles.eventDot} />
                        <div className={styles.eventInfo}>
                          <span className={styles.eventType}>{ev.type}</span>
                          <span className={styles.eventMeta}>{ev.cam} · {ev.hoursAgo}시간 전</span>
                        </div>
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.eventArrow}>
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 최근 검색어 */}
            <div className={styles.recentBlock}>
              <div className={styles.recentLabel}>최근 검색어</div>
              <div className={styles.recentChips}>
                {RECENT_QUERIES.map((q) => (
                  <button type="button" key={q} className={styles.recentChip}
                    onClick={() => { setInput(q); runSearch(q); }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── LOADING ── */}
        {phase === 'loading' && (
          <>
            <div className={styles.resultsHead}>
              <div className={styles.resultsCount}>검색 중…</div>
            </div>
            <div className={styles.grid}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </>
        )}

        {/* ── RESULTS ── */}
        {phase === 'results' && (
          <>
            <div className={styles.resultsHead}>
              <div className={styles.resultsLeft}>
                <div className={styles.resultsCount}>
                  <span className={styles.resultsCountStrong}>"{activeQuery}"</span> 검색결과{' '}
                  <span className={styles.resultsCountStrong}>{results.length}건</span>
                  <span className={styles.elapsedText}>{(elapsedMs / 1000).toFixed(2)}s</span>
                </div>
                <div className={styles.objTypeTabs}>
                  {([
                    ['all',     '전체', results.length],
                    ['person',  '인물', personCount],
                    ['vehicle', '차량', vehicleCount],
                  ] as [ObjType, string, number][]).map(([type, label, count]) => (
                    <button key={type} type="button"
                      className={[styles.objTypeTab, objType === type ? styles.objTypeTabActive : ''].filter(Boolean).join(' ')}
                      onClick={() => setObjType(type)}>
                      {label}<span className={styles.objTypeCount}>{count}</span>
                    </button>
                  ))}
                </div>
              </div>
              <Select
                size="sm"
                value={sortKey}
                options={[{ value: 'score', label: '점수순' }, { value: 'time', label: '시각순' }]}
                onChange={(v) => setSortKey(v as SortKey)}
              />
            </div>
            {sortedResults.length === 0 ? (
              <div className={styles.empty}>검색 결과가 없습니다. 다른 키워드를 시도해 보세요.</div>
            ) : (
              <div className={styles.grid}>
                {sortedResults.map((r) => (
                  <ResultCard key={r.id} result={r} onClick={() => handleCardClick(r)} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
