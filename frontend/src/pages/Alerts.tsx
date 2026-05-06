// TODO: replace with fetch('/api/v1/alerts')
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useCountUp } from '@/hooks/useCountUp';
import { useToast } from '@/hooks/useToast';
import { relativeTime, formatDateTime } from '@/lib/time';
import { alertsSeed } from '@/mock/alerts';
import type {
  SecurityAlert,
  AlertStatus,
  AlertPriority,
  AlertType,
} from '@/types/alert';
import page from './Page.module.css';
import styles from './Alerts.module.css';

type StatusFilter = 'all' | AlertStatus;

const PRIORITY_OPTIONS: { value: AlertPriority; label: string }[] = [
  { value: 'critical', label: '긴급' },
  { value: 'high', label: '높음' },
  { value: 'mid', label: '중간' },
  { value: 'low', label: '낮음' },
];

const TYPE_OPTIONS: { value: AlertType; label: string }[] = [
  { value: 'intrusion', label: '침입' },
  { value: 'fire', label: '화재' },
  { value: 'emergency', label: '비상' },
  { value: 'offline', label: '오프라인' },
  { value: 'storage', label: '저장소' },
  { value: 'tamper', label: '탬퍼링' },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'open', label: '미확인' },
  { value: 'ack', label: '확인됨' },
  { value: 'snoozed', label: '스누즈' },
  { value: 'resolved', label: '종결' },
];

const PRIORITY_TONE: Record<AlertPriority, 'danger' | 'warn' | 'accent' | 'neutral'> = {
  critical: 'danger',
  high: 'warn',
  mid: 'accent',
  low: 'neutral',
};

const STATUS_TONE: Record<AlertStatus, 'danger' | 'warn' | 'success' | 'neutral'> = {
  open: 'danger',
  ack: 'warn',
  resolved: 'success',
  snoozed: 'neutral',
};

const STATUS_LABEL: Record<AlertStatus, string> = {
  open: '미확인',
  ack: '확인됨',
  resolved: '종결',
  snoozed: '스누즈',
};

const TYPE_LABEL: Record<AlertType, string> = {
  intrusion: '침입',
  fire: '화재',
  emergency: '비상',
  offline: '오프라인',
  storage: '저장소',
  tamper: '탬퍼링',
};

const PRIORITY_LABEL: Record<AlertPriority, string> = {
  critical: '긴급',
  high: '높음',
  mid: '중간',
  low: '낮음',
};

/** Snapshot SVG fallback — seed로 결정적인 도형 생성 */
function SnapshotSvg({ seed, type }: { seed: string; type: AlertType }) {
  const hash = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0);
  const variant = hash % 3;
  return (
    <svg
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      className={styles.snapshotSvg}
    >
      <defs>
        <linearGradient id={`snap-${seed}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-video-bg)" />
          <stop offset="100%" stopColor="var(--color-bg-app)" />
        </linearGradient>
        <pattern id={`snap-grid-${seed}`} width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M16 0H0V16" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="320" height="180" fill={`url(#snap-${seed})`} />
      <rect width="320" height="180" fill={`url(#snap-grid-${seed})`} />
      {variant === 0 && (
        <g stroke="rgba(255,255,255,0.32)" fill="rgba(255,255,255,0.08)">
          <rect x="60" y="80" width="60" height="70" />
          <rect x="180" y="60" width="80" height="90" />
        </g>
      )}
      {variant === 1 && (
        <g stroke="rgba(255,255,255,0.28)" fill="rgba(255,255,255,0.08)">
          <polygon points="40,150 90,80 140,150" />
          <rect x="170" y="90" width="100" height="60" />
        </g>
      )}
      {variant === 2 && (
        <g stroke="rgba(255,255,255,0.28)" fill="rgba(255,255,255,0.08)">
          <rect x="20" y="110" width="280" height="40" />
          <rect x="40" y="80" width="60" height="70" />
          <rect x="220" y="70" width="60" height="80" />
        </g>
      )}
      <text
        x="160"
        y="95"
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="11"
        fill="rgba(255,255,255,0.55)"
        letterSpacing="2"
      >
        {TYPE_LABEL[type].toUpperCase()}
      </text>
    </svg>
  );
}

interface KpiProps {
  label: string;
  value: number;
  suffix?: string;
  meta?: string;
}

function Kpi({ label, value, suffix, meta }: KpiProps) {
  const v = useCountUp(value);
  return (
    <div className={page.kpi}>
      <div className={page.kpiLabel}>{label}</div>
      <div className={`${page.kpiValue} tabular`}>
        {v.toLocaleString()}
        {suffix && (
          <span
            style={{
              fontSize: 16,
              color: 'var(--color-text-muted)',
              marginLeft: 4,
              fontWeight: 500,
            }}
          >
            {suffix}
          </span>
        )}
      </div>
      {meta && <div className={page.kpiMeta}>{meta}</div>}
    </div>
  );
}

const SLA_THRESHOLD_MIN = 10;

export default function Alerts() {
  const toast = useToast();

  // in-page mutable copy
  const [alerts, setAlerts] = useState<SecurityAlert[]>(() => alertsSeed);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<AlertPriority[]>([]);
  const [typeFilter, setTypeFilter] = useState<AlertType[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(alertsSeed[0]?.id ?? null);
  const [noteDraft, setNoteDraft] = useState('');

  // ===== KPI =====
  const today0 = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const todayCount = alerts.filter((a) => Date.parse(a.occurredAt) >= today0).length;
  const openCount = alerts.filter((a) => a.status === 'open').length;
  const resolvedWithResp = alerts.filter(
    (a) => a.status === 'resolved' && typeof a.responseMin === 'number',
  );
  const avgResponse =
    resolvedWithResp.length > 0
      ? Math.round(
          resolvedWithResp.reduce((s, a) => s + (a.responseMin ?? 0), 0) /
            resolvedWithResp.length,
        )
      : 0;
  const slaBreaches = alerts.filter(
    (a) => typeof a.responseMin === 'number' && (a.responseMin ?? 0) > SLA_THRESHOLD_MIN,
  ).length;

  // ===== filter status counts (for left panel) =====
  const statusCounts = useMemo(() => {
    const c: Record<StatusFilter, number> = {
      all: alerts.length,
      open: 0,
      ack: 0,
      resolved: 0,
      snoozed: 0,
    };
    for (const a of alerts) {
      c[a.status] += 1;
    }
    return c;
  }, [alerts]);

  // ===== filtered list =====
  const filtered = useMemo(() => {
    return alerts
      .filter((a) => (statusFilter === 'all' ? true : a.status === statusFilter))
      .filter((a) => (priorityFilter.length === 0 ? true : priorityFilter.includes(a.priority)))
      .filter((a) => (typeFilter.length === 0 ? true : typeFilter.includes(a.type)))
      .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
  }, [alerts, statusFilter, priorityFilter, typeFilter]);

  const selected = useMemo(
    () => alerts.find((a) => a.id === selectedId) ?? null,
    [alerts, selectedId],
  );

  // ===== handlers =====
  const togglePriority = (p: AlertPriority) => {
    setPriorityFilter((prev) =>
      prev.includes(p) ? prev.filter((v) => v !== p) : [...prev, p],
    );
  };
  const toggleType = (t: AlertType) => {
    setTypeFilter((prev) => (prev.includes(t) ? prev.filter((v) => v !== t) : [...prev, t]));
  };
  const resetFilters = () => {
    setStatusFilter('all');
    setPriorityFilter([]);
    setTypeFilter([]);
    toast.info('필터 초기화', '모든 필터를 해제했습니다.');
  };

  const updateAlert = (id: string, patch: Partial<SecurityAlert>) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };

  const handleAck = () => {
    if (!selected) return;
    if (selected.status === 'ack' || selected.status === 'resolved') {
      toast.warn('이미 확인 처리된 알림입니다.');
      return;
    }
    updateAlert(selected.id, { status: 'ack' });
    toast.success('확인 처리됨', `${selected.cameraName} 알림을 확인했습니다.`);
  };

  const handleAssign = () => {
    if (!selected) return;
    const nextOwner = selected.assignedTo ? selected.assignedTo : '김민수';
    updateAlert(selected.id, { assignedTo: nextOwner });
    toast.info('담당자 배정', `${nextOwner} 님에게 배정되었습니다.`);
  };

  const handleResolve = () => {
    if (!selected) return;
    if (selected.status === 'resolved') {
      toast.warn('이미 종결된 알림입니다.');
      return;
    }
    const minutesElapsed = Math.max(
      1,
      Math.round((Date.now() - Date.parse(selected.occurredAt)) / 60_000),
    );
    updateAlert(selected.id, {
      status: 'resolved',
      responseMin: selected.responseMin ?? minutesElapsed,
    });
    toast.success('종결 처리', '알림을 정상 종결했습니다.');
  };

  const handleEscalate = () => {
    if (!selected) return;
    updateAlert(selected.id, { priority: 'critical' });
    toast.danger('에스컬레이션', '관제센터 책임자에게 통보되었습니다.');
  };

  const handleAddNote = () => {
    if (!selected) return;
    const text = noteDraft.trim();
    if (!text) {
      toast.warn('노트 내용을 입력해 주세요.');
      return;
    }
    const next = {
      at: new Date().toISOString(),
      by: selected.assignedTo ?? '관제 담당',
      text,
    };
    updateAlert(selected.id, { notes: [...selected.notes, next] });
    setNoteDraft('');
    toast.success('노트 추가', '대응 노트가 기록되었습니다.');
  };

  return (
    <div className={page.page}>
      <div className={page.header}>
        <div>
          <div className={page.headerKicker}>OPERATIONS</div>
          <div className={page.headerTitle}>알림 센터</div>
          <div className={page.headerSubtitle}>
            보안 이벤트 알림과 대응을 한곳에서
          </div>
        </div>
        <div className={page.actions}>
          <Button variant="secondary" size="sm" onClick={resetFilters}>
            필터 초기화
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toast.info('내보내기', `${filtered.length}건을 CSV로 내보냅니다.`)}
          >
            내보내기
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => toast.info('룰 만들기', '룰 빌더 모듈은 추후 연결됩니다.')}
          >
            + 룰 만들기
          </Button>
        </div>
      </div>

      <div className={page.kpiRow}>
        <Kpi label="오늘 발생" value={todayCount} suffix="건" meta="자정 ~ 현재" />
        <Kpi label="미처리" value={openCount} suffix="건" meta="status = open" />
        <Kpi
          label="평균 응답"
          value={avgResponse}
          suffix="분"
          meta={`종결 ${resolvedWithResp.length}건 평균`}
        />
        <Kpi
          label="SLA 위반"
          value={slaBreaches}
          suffix="건"
          meta={`> ${SLA_THRESHOLD_MIN}분 응답`}
        />
      </div>

      <div className={styles.layout}>
        {/* ===== Left filter ===== */}
        <aside className={styles.filter}>
          <div className={styles.filterGroup}>
            <div className={styles.filterTitle}>상태</div>
            {STATUS_OPTIONS.map((opt) => (
              <label key={opt.value} className={styles.filterRow}>
                <input
                  type="radio"
                  name="alert-status"
                  checked={statusFilter === opt.value}
                  onChange={() => setStatusFilter(opt.value)}
                />
                <span>{opt.label}</span>
                <span className={styles.filterCount}>{statusCounts[opt.value]}</span>
              </label>
            ))}
          </div>

          <div className={styles.filterGroup}>
            <div className={styles.filterTitle}>우선순위</div>
            {PRIORITY_OPTIONS.map((opt) => (
              <label key={opt.value} className={styles.filterRow}>
                <input
                  type="checkbox"
                  checked={priorityFilter.includes(opt.value)}
                  onChange={() => togglePriority(opt.value)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>

          <div className={styles.filterGroup}>
            <div className={styles.filterTitle}>유형</div>
            {TYPE_OPTIONS.map((opt) => (
              <label key={opt.value} className={styles.filterRow}>
                <input
                  type="checkbox"
                  checked={typeFilter.includes(opt.value)}
                  onChange={() => toggleType(opt.value)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>

          <Button variant="ghost" size="sm" block onClick={resetFilters}>
            초기화
          </Button>
        </aside>

        {/* ===== Center list ===== */}
        <section className={styles.list}>
          <div className={styles.listHeader}>
            <span className={styles.listCount}>
              {filtered.length}건 표시 / 전체 {alerts.length}건
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className={styles.empty}>조건에 맞는 알림이 없습니다.</div>
          ) : (
            filtered.map((a) => {
              const isSelected = a.id === selectedId;
              return (
                <div
                  key={a.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedId(a.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedId(a.id);
                    }
                  }}
                  className={[
                    styles.alertCard,
                    isSelected ? styles.alertCardSelected : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <span
                    className={[styles.statusBar, styles[`statusBar_${a.status}`]].join(' ')}
                  />
                  <div className={styles.alertBody}>
                    <div className={styles.alertTopRow}>
                      <span className={styles.alertTime}>{relativeTime(a.occurredAt)}</span>
                      <Badge tone={PRIORITY_TONE[a.priority]} dot>
                        {PRIORITY_LABEL[a.priority]}
                      </Badge>
                      <Badge tone="info">{TYPE_LABEL[a.type]}</Badge>
                    </div>
                    <div className={styles.alertMsg} title={a.message}>
                      {a.message}
                    </div>
                    <div className={styles.alertMeta}>
                      <span>
                        {a.siteName} · {a.cameraName}
                      </span>
                      <span className={styles.alertMetaSep}>|</span>
                      <span>담당자: {a.assignedTo ?? '미배정'}</span>
                      <span className={styles.alertMetaSep}>|</span>
                      <span>룰: {a.ruleName}</span>
                    </div>
                  </div>
                  <div className={styles.alertRight}>
                    <Badge tone={STATUS_TONE[a.status]} dot>
                      {STATUS_LABEL[a.status]}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* ===== Right detail ===== */}
        <aside className={styles.detail}>
          {!selected ? (
            <div className={styles.detailEmpty}>알림을 선택하면 상세가 표시됩니다.</div>
          ) : (
            <>
              <div className={styles.snapshot}>
                <SnapshotSvg seed={selected.snapshotSeed} type={selected.type} />
                <span className={styles.snapshotBadge}>{selected.cameraId.toUpperCase()}</span>
              </div>

              <div className={styles.detailTitle}>{selected.message}</div>

              <div className={styles.detailMetaGrid}>
                <span className={styles.detailMetaKey}>상태</span>
                <span className={styles.detailMetaVal}>
                  <Badge tone={STATUS_TONE[selected.status]} dot>
                    {STATUS_LABEL[selected.status]}
                  </Badge>
                </span>
                <span className={styles.detailMetaKey}>우선순위</span>
                <span className={styles.detailMetaVal}>
                  <Badge tone={PRIORITY_TONE[selected.priority]} dot>
                    {PRIORITY_LABEL[selected.priority]}
                  </Badge>
                </span>
                <span className={styles.detailMetaKey}>유형</span>
                <span className={styles.detailMetaVal}>{TYPE_LABEL[selected.type]}</span>
                <span className={styles.detailMetaKey}>사이트</span>
                <span className={styles.detailMetaVal}>
                  {selected.siteName} · {selected.cameraName}
                </span>
                <span className={styles.detailMetaKey}>발생</span>
                <span className={styles.detailMetaVal}>
                  {formatDateTime(selected.occurredAt)}
                </span>
                <span className={styles.detailMetaKey}>담당자</span>
                <span className={styles.detailMetaVal}>
                  {selected.assignedTo ?? '미배정'}
                  {typeof selected.responseMin === 'number' && (
                    <span style={{ color: 'var(--color-text-muted)', marginLeft: 8 }}>
                      · 응답 {selected.responseMin}분
                    </span>
                  )}
                </span>
              </div>

              <div className={styles.actionGrid}>
                <Button variant="primary" size="sm" onClick={handleAck}>
                  Acknowledge
                </Button>
                <Button variant="secondary" size="sm" onClick={handleAssign}>
                  Assign
                </Button>
                <Button variant="secondary" size="sm" onClick={handleResolve}>
                  Resolve
                </Button>
                <Button variant="danger" size="sm" onClick={handleEscalate}>
                  Escalate
                </Button>
              </div>

              <div className={styles.notesSection}>
                <div className={styles.notesLabel}>대응 노트</div>
                {selected.notes.length === 0 ? (
                  <div className={styles.noteEmpty}>아직 등록된 노트가 없습니다.</div>
                ) : (
                  selected.notes.map((n, i) => (
                    <div key={`${selected.id}-note-${i}`} className={styles.noteItem}>
                      <div className={styles.noteHead}>
                        <span className={styles.noteHeadBy}>{n.by}</span>
                        <span>{relativeTime(n.at)}</span>
                      </div>
                      <div className={styles.noteText}>{n.text}</div>
                    </div>
                  ))
                )}
                <div className={styles.noteInputRow}>
                  <textarea
                    className={styles.noteTextarea}
                    placeholder="대응 메모를 남겨주세요…"
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="secondary" size="sm" onClick={handleAddNote}>
                      추가
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
