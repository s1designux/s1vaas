// TODO: replace with POST /api/v1/search
import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { BtnGroup } from '@/components/ui/BtnGroup';
import { TopSearch } from '@/components/ui/TopSearch';
import { useToast } from '@/hooks/useToast';
import { relativeTime } from '@/lib/time';
import {
  MOCK_RESULTS_BY_QUERY,
  RECENT_QUERIES,
  SITE_OPTIONS,
} from '@/mock/searchResults';
import type { SearchMode, SearchResult, SearchSensitivity } from '@/types/search';
import page from './Page.module.css';
import styles from './Search.module.css';

type SearchPhase = 'idle' | 'loading' | 'results';
type SortKey = 'score' | 'time';

const MODE_LABEL: Record<SearchMode, string> = {
  natural: '자연어',
  person: '인물',
  vehicle: '차량',
  lpr: '번호판',
};

const MODE_PLACEHOLDER: Record<SearchMode, string> = {
  natural: '예: 빨간 옷 입은 사람이 1층에 들어온 장면',
  person: '예: 20대 남성, 검은 모자',
  vehicle: '예: 흰색 SUV',
  lpr: '예: 12가 3456',
};

const MODES: SearchMode[] = ['natural', 'person', 'vehicle', 'lpr'];

const SEED_PALETTES: Record<string, [string, string, string]> = {
  red: ['var(--color-danger)', 'var(--color-warn)', 'var(--color-video-bg)'],
  suv: ['var(--color-text)', 'var(--color-text-muted)', 'var(--color-video-bg)'],
  night: ['var(--color-brand)', 'var(--color-text)', 'var(--color-video-bg)'],
  fall: ['var(--color-warn)', 'var(--color-danger)', 'var(--color-video-bg)'],
  w20: ['var(--color-accent)', 'var(--color-brand)', 'var(--color-video-bg)'],
  lpr: ['var(--color-info)', 'var(--color-accent-hover)', 'var(--color-video-bg)'],
  moto: ['var(--color-text-muted)', 'var(--color-text)', 'var(--color-video-bg)'],
  mask: ['var(--color-success)', 'var(--color-info)', 'var(--color-video-bg)'],
  default: ['var(--color-accent)', 'var(--color-brand)', 'var(--color-video-bg)'],
};

function pickPalette(seed: string): [string, string, string] {
  const prefix = seed.split('-')[0];
  return SEED_PALETTES[prefix] ?? SEED_PALETTES.default;
}

function ThumbSvg({ seed }: { seed: string }) {
  const [c1, c2, c3] = pickPalette(seed);
  const id = `g-${seed}`;
  // hash seed → silhouette x position
  const hash = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const cx = 30 + (hash % 40);
  return (
    <svg
      className={styles.thumbSvg}
      viewBox="0 0 160 90"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="55%" stopColor={c2} />
          <stop offset="100%" stopColor={c3} />
        </linearGradient>
      </defs>
      <rect width="160" height="90" fill={`url(#${id})`} />
      <g fill="white" stroke="white">
        {/* horizontal floor line */}
        <line x1="0" y1="68" x2="160" y2="68" strokeOpacity="0.18" strokeWidth="0.6" />
        {/* silhouette body */}
        <ellipse cx={cx} cy="48" rx="6" ry="6" fillOpacity="0.55" stroke="none" />
        <rect x={cx - 6} y="54" width="12" height="18" rx="3" fillOpacity="0.55" stroke="none" />
        {/* bg accents */}
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
  if (m === 0) return `${s}초`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function ResultCard({
  result,
  onClick,
}: {
  result: SearchResult;
  onClick: () => void;
}) {
  return (
    <button type="button" className={styles.card} onClick={onClick}>
      <div className={styles.thumb}>
        <ThumbSvg seed={result.thumbnailSeed} />
        <span className={styles.scoreBadge}>{result.score.toFixed(2)}</span>
        <span className={styles.durBadge}>{formatDuration(result.durationSec)}</span>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardMetaRow}>
          <span className={styles.cardCam}>
            {result.cameraName} · {result.siteName}
          </span>
          <span className={styles.cardTime}>{relativeTime(result.occurredAt)}</span>
        </div>
        <div className={styles.cardCaption}>{result.caption}</div>
        <div className={styles.attrRow}>
          {result.matchedAttributes.slice(0, 4).map((a) => (
            <Badge key={a} tone="info">
              {a}
            </Badge>
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

export default function Search() {
  const toast = useToast();
  const [mode, setMode] = useState<SearchMode>('natural');
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<SearchPhase>('idle');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeQuery, setActiveQuery] = useState<string>('');
  const [elapsedMs, setElapsedMs] = useState(0);

  const [siteIds, setSiteIds] = useState<string[]>([]);
  const [cameraIds, setCameraIds] = useState<string[]>([]);
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [sensitivity, setSensitivity] = useState<SearchSensitivity>('mid');
  const [sortKey, setSortKey] = useState<SortKey>('score');

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const runSearch = (query: string) => {
    const q = query.trim();
    if (phase === 'loading') return;
    setActiveQuery(q);
    setPhase('loading');
    setElapsedMs(0);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    const start = performance.now();
    timerRef.current = window.setTimeout(() => {
      const base = MOCK_RESULTS_BY_QUERY[q] ?? [];
      let next = base;
      if (siteIds.length > 0) next = next.filter((r) => siteIds.includes(r.siteId));
      if (cameraIds.length > 0) next = next.filter((r) => cameraIds.includes(r.cameraId));
      // sensitivity threshold (low: 0.78+, mid: 0.65+, high: 0)
      const threshold = sensitivity === 'low' ? 0.78 : sensitivity === 'mid' ? 0.65 : 0;
      next = next.filter((r) => r.score >= threshold);
      setResults(next);
      setElapsedMs(Math.round(performance.now() - start));
      setPhase('results');
    }, 600);
  };

  const sortedResults = useMemo(() => {
    const arr = [...results];
    if (sortKey === 'score') {
      arr.sort((a, b) => b.score - a.score);
    } else {
      arr.sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
    }
    return arr;
  }, [results, sortKey]);

  const handleCardClick = (r: SearchResult) => {
    toast.info('재생 페이지는 준비 중입니다 (mockup)', `${r.cameraName} · ${r.caption}`);
  };

  const handleReset = () => {
    setInput('');
    setFrom('');
    setTo('');
    setSiteIds([]);
    setCameraIds([]);
    setSensitivity('mid');
    setPhase('idle');
    setResults([]);
    setActiveQuery('');
  };

  return (
    <div className={page.page}>
      {/* Filter bar */}
      <div className={styles.filterWrap}>
        <TopSearch
          onSubmit={() => runSearch(input)}
          buttons={
            <>
              <button type="button" className={styles.resetBtn} onClick={handleReset}>초기화</button>
              <button
                type="button"
                className={styles.searchSubmit}
                onClick={() => runSearch(input)}
                disabled={phase === 'loading'}
              >
                검색
              </button>
            </>
          }
        >
          <TopSearch.Row>
            <BtnGroup>
              {MODES.map((m) => (
                <BtnGroup.Btn key={m} active={mode === m} onClick={() => setMode(m)}>
                  {MODE_LABEL[m]}
                </BtnGroup.Btn>
              ))}
            </BtnGroup>
            <TopSearch.Field stretch>
              <input
                type="text"
                className={styles.filterInput}
                placeholder={MODE_PLACEHOLDER[mode]}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') runSearch(input); }}
              />
            </TopSearch.Field>
            <TopSearch.Divider />
            <TopSearch.Field label="기간" wide>
              <TopSearch.DateRange>
                <input
                  type="date"
                  className={styles.filterDate}
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  aria-label="시작일"
                />
                <TopSearch.Between />
                <input
                  type="date"
                  className={styles.filterDate}
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  aria-label="종료일"
                />
              </TopSearch.DateRange>
            </TopSearch.Field>
            <TopSearch.Field label="위치">
              <select
                className={styles.filterSelect}
                value={siteIds[0] ?? ''}
                onChange={(e) => setSiteIds(e.target.value ? [e.target.value] : [])}
              >
                <option value="">전체</option>
                {SITE_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </TopSearch.Field>
          </TopSearch.Row>
        </TopSearch>
      </div>

      {/* Results */}
      <section className={styles.results}>
          {phase === 'idle' && (
            <div className={styles.idle}>
              <svg
                className={styles.idleIllust}
                viewBox="0 0 96 96"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="42" cy="42" r="26" />
                <path d="M62 62l18 18" />
                <path d="M30 42h24" />
                <path d="M42 30v24" opacity="0.4" />
              </svg>
              <div className={styles.idleTitle}>무엇을 찾고 계신가요?</div>
              <div className={styles.idleSub}>
                자연어로 사람·차량·이벤트를 검색하세요. 색상, 시간대, 사이트를 함께 입력하면 정확도가 높아집니다.
              </div>
              <div className={styles.recentBlock}>
                <div className={styles.recentLabel}>최근 검색어</div>
                <div className={styles.recentChips}>
                  {RECENT_QUERIES.map((q) => (
                    <button
                      type="button"
                      key={q}
                      className={styles.recentChip}
                      onClick={() => {
                        setInput(q);
                        runSearch(q);
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.tip}>
                <span aria-hidden>💡</span>
                팁: 옷 색상, 시간대, 사이트를 함께 입력하면 더 정확합니다
              </div>
            </div>
          )}

          {phase === 'loading' && (
            <>
              <div className={styles.resultsHead}>
                <div className={styles.resultsCount}>검색 중…</div>
              </div>
              <div className={styles.grid}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            </>
          )}

          {phase === 'results' && (
            <>
              <div className={styles.resultsHead}>
                <div className={styles.resultsCount}>
                  쿼리 “<span className={styles.resultsCountStrong}>{activeQuery}</span>” 결과{' '}
                  <span className={styles.resultsCountStrong}>{sortedResults.length}건</span> · 처리시간{' '}
                  {(elapsedMs / 1000).toFixed(2)}s
                </div>
                <select
                  className={styles.sortSelect}
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  aria-label="정렬"
                >
                  <option value="score">점수순</option>
                  <option value="time">시각순</option>
                </select>
              </div>
              {sortedResults.length === 0 ? (
                <div className={styles.empty}>
                  검색 결과가 없습니다. 다른 키워드를 시도해 보세요.
                </div>
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
