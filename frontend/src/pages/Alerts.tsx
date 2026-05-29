// TODO: replace with fetch('/api/v1/alerts')
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { useToast } from '@/hooks/useToast';
import { relativeTime, formatDateTime } from '@/lib/time';
import { alertsSeed } from '@/mock/alerts';
import type { SecurityAlert, AlertStatus, AlertPriority, AlertType } from '@/types/alert';
import page from './Page.module.css';
import styles from './Alerts.module.css';

// ===== Risk level — 전문 용어 제거, 소상공인 친화적 =====
type RiskLevel = 'all' | 'danger' | 'caution' | 'info';

const PRIORITY_TO_RISK: Record<AlertPriority, RiskLevel> = {
  critical: 'danger',
  high: 'danger',
  mid: 'caution',
  low: 'info',
};

const RISK_LABEL: Record<RiskLevel, string> = {
  all: '전체',
  danger: '위험',
  caution: '주의',
  info: '알림',
};

const RISK_EMOJI: Record<Exclude<RiskLevel, 'all'>, string> = {
  danger: '🔴',
  caution: '🟡',
  info: '🔵',
};

const RISK_DISPLAY: Record<AlertPriority, string> = {
  critical: '위험',
  high: '위험',
  mid: '주의',
  low: '알림',
};

const STATUS_LABEL: Record<AlertStatus, string> = {
  open: '미확인',
  ack: '확인중',
  resolved: '처리완료',
  snoozed: '잠시꺼짐',
};

const TYPE_LABEL: Record<AlertType, string> = {
  intrusion: '침입',
  fire: '화재',
  emergency: '비상',
  offline: '오프라인',
  storage: '저장소',
  tamper: '탬퍼링',
};

const TYPE_ICON: Record<AlertType, string> = {
  intrusion: '🚨',
  fire: '🔥',
  emergency: '🆘',
  offline: '📷',
  storage: '💾',
  tamper: '⚠️',
};

// ===== CCTV mock view =====
function CctvView({
  seed,
  type,
  isLive,
  isDanger,
}: {
  seed: string;
  type: AlertType;
  isLive: boolean;
  isDanger: boolean;
}) {
  const hash = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0);
  const variant = hash % 3;
  return (
    <div className={[styles.cctvFrame, isDanger ? styles.cctvFrameDanger : ''].filter(Boolean).join(' ')}>
      <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" className={styles.cctvSvg}>
        <defs>
          <linearGradient id={`ccg-${seed}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0d0f15" />
            <stop offset="100%" stopColor="#060709" />
          </linearGradient>
          <pattern id={`ccp-${seed}`} width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M16 0H0V16" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="320" height="180" fill={`url(#ccg-${seed})`} />
        <rect width="320" height="180" fill={`url(#ccp-${seed})`} />
        {variant === 0 && (
          <g stroke="rgba(255,255,255,0.25)" fill="rgba(255,255,255,0.06)">
            <rect x="60" y="80" width="60" height="70" />
            <rect x="180" y="60" width="80" height="90" />
          </g>
        )}
        {variant === 1 && (
          <g stroke="rgba(255,255,255,0.22)" fill="rgba(255,255,255,0.06)">
            <polygon points="40,150 90,80 140,150" />
            <rect x="170" y="90" width="100" height="60" />
          </g>
        )}
        {variant === 2 && (
          <g stroke="rgba(255,255,255,0.22)" fill="rgba(255,255,255,0.06)">
            <rect x="20" y="110" width="280" height="40" />
            <rect x="40" y="80" width="60" height="70" />
            <rect x="220" y="70" width="60" height="80" />
          </g>
        )}
        <text
          x="160"
          y="168"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="10"
          fill="rgba(255,255,255,0.28)"
          letterSpacing="3"
        >
          {TYPE_LABEL[type].toUpperCase()} · NO SIGNAL
        </text>
      </svg>

      {isLive && <span className={styles.liveBadge}>● LIVE</span>}

      <span className={styles.cctvTimestamp}>
        {new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
    </div>
  );
}

// ===== Main component =====
export default function Alerts() {
  const toast = useToast();

  const [alerts, setAlerts] = useState<SecurityAlert[]>(() => alertsSeed);
  const [riskFilter, setRiskFilter] = useState<RiskLevel>('all');
  const [typeFilter, setTypeFilter] = useState<AlertType | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(alertsSeed[0]?.id ?? null);
  const [showLive, setShowLive] = useState(false);

  // ===== risk counts for tabs =====
  const riskCounts = useMemo(() => {
    const c: Record<RiskLevel, number> = { all: 0, danger: 0, caution: 0, info: 0 };
    for (const a of alerts) {
      c.all++;
      c[PRIORITY_TO_RISK[a.priority]]++;
    }
    return c;
  }, [alerts]);

  // ===== filtered + sorted list =====
  const filtered = useMemo(() => {
    const RISK_ORDER: Record<RiskLevel, number> = { all: 3, danger: 0, caution: 1, info: 2 };
    return alerts
      .filter((a) => (riskFilter === 'all' ? true : PRIORITY_TO_RISK[a.priority] === riskFilter))
      .filter((a) => (typeFilter === null ? true : a.type === typeFilter))
      .sort((a, b) => {
        const ra = PRIORITY_TO_RISK[a.priority];
        const rb = PRIORITY_TO_RISK[b.priority];
        if (RISK_ORDER[ra] !== RISK_ORDER[rb]) return RISK_ORDER[ra] - RISK_ORDER[rb];
        return Date.parse(b.occurredAt) - Date.parse(a.occurredAt);
      });
  }, [alerts, riskFilter, typeFilter]);

  const selected = useMemo(() => alerts.find((a) => a.id === selectedId) ?? null, [alerts, selectedId]);

  const isDanger =
    selected !== null && (selected.priority === 'critical' || selected.priority === 'high');

  // ===== handlers =====
  const updateAlert = (id: string, patch: Partial<SecurityAlert>) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };

  const handleAck = () => {
    if (!selected) return;
    if (selected.status === 'ack' || selected.status === 'resolved') {
      toast.warn('이미 확인한 알림입니다.');
      return;
    }
    updateAlert(selected.id, { status: 'ack' });
    toast.success('확인 완료', `${selected.cameraName} 알림을 확인했습니다.`);
  };

  const handleResolve = () => {
    if (!selected) return;
    if (selected.status === 'resolved') {
      toast.warn('이미 처리완료된 알림입니다.');
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
    toast.success('처리완료', '알림을 해결했습니다.');
  };

  const handleCapture = () => {
    toast.success('캡처 저장', '현재 화면이 저장되었습니다.');
  };

  const handleShare = () => {
    toast.info('영상 공유', '공유 링크가 클립보드에 복사되었습니다.');
  };

  const handleSelectAlert = (id: string) => {
    setSelectedId(id);
    setShowLive(false);
  };

  // ===== Render =====
  return (
    <div className={page.page}>
      {/* ===== 필터바 — 위험도 라인탭 + 유형 칩 ===== */}
      <div className={styles.filterBar}>
        {/* 위험도 라인탭 (DS Tabs variant="line") */}
        <Tabs
          variant="line"
          active={riskFilter}
          onChange={(k) => setRiskFilter(k as RiskLevel)}
          tabs={(['all', 'danger', 'caution', 'info'] as RiskLevel[]).map((level) => ({
            key: level,
            label: (
              <span className={styles.riskTabLabel}>
                {level !== 'all' && (
                  <span className={[styles.riskDot, styles[`riskDot_${level}`]].join(' ')} aria-hidden />
                )}
                {RISK_LABEL[level]}
                <span className={styles.riskTabCount}>{riskCounts[level]}</span>
              </span>
            ),
          }))}
        />

        {/* 유형 칩 */}
        <div className={styles.typeChips}>
          <button
            type="button"
            className={[styles.typeChip, typeFilter === null ? styles.typeChipActive : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => setTypeFilter(null)}
          >
            전체 유형
          </button>
          {(Object.keys(TYPE_LABEL) as AlertType[]).map((t) => (
            <button
              key={t}
              type="button"
              className={[styles.typeChip, typeFilter === t ? styles.typeChipActive : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => setTypeFilter(typeFilter === t ? null : t)}
            >
              {TYPE_ICON[t]} {TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      {/* ===== 2-column layout ===== */}
      <div className={styles.layout}>
        {/* ===== 알림 목록 ===== */}
        <section className={styles.list}>
          <div className={styles.listHeader}>
            <span className={styles.listCount}>
              {filtered.length === alerts.length
                ? `전체 ${alerts.length}건`
                : `${filtered.length}건 / 전체 ${alerts.length}건`}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className={styles.empty}>해당 조건의 알림이 없습니다.</div>
          ) : (
            filtered.map((a) => {
              const isSelected = a.id === selectedId;
              const risk = PRIORITY_TO_RISK[a.priority];
              return (
                <div
                  key={a.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectAlert(a.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectAlert(a.id);
                    }
                  }}
                  className={[
                    styles.alertCard,
                    isSelected ? styles.alertCardSelected : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <div className={styles.alertBody}>
                    <div className={styles.alertTopRow}>
                      <span
                        className={[styles.riskPill, styles[`riskPill_${risk}`]]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {risk !== 'all' && RISK_EMOJI[risk as Exclude<RiskLevel, 'all'>]}{' '}
                        {RISK_DISPLAY[a.priority]}
                      </span>
                      <span className={styles.typeTag}>
                        {TYPE_ICON[a.type]} {TYPE_LABEL[a.type]}
                      </span>
                      {a.status === 'open' && (
                        <span className={styles.unreadDot} aria-label="미확인" />
                      )}
                    </div>

                    <div className={styles.alertMsg}>{a.message}</div>

                    <div className={styles.alertMeta}>
                      <span>
                        {a.siteName} · {a.cameraName}
                      </span>
                      <span className={styles.alertTime}>{relativeTime(a.occurredAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* ===== 상세 패널 ===== */}
        <aside className={styles.detail}>
          {!selected ? (
            <div className={styles.detailEmpty}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>📋</span>
              알림을 선택하면 상세 내용이 표시됩니다.
            </div>
          ) : (
            <>
              {/* CCTV 뷰 */}
              <div className={styles.cctvSection}>
                <CctvView
                  seed={selected.snapshotSeed}
                  type={selected.type}
                  isLive={showLive}
                  isDanger={isDanger}
                />

                {/* CCTV 액션 버튼 */}
                <div className={styles.cctvActions}>
                  <button
                    type="button"
                    className={[styles.cctvBtn, showLive ? styles.cctvBtnLive : '']
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setShowLive((v) => !v)}
                  >
                    {showLive ? '📹 실시간 보는 중' : '📹 실시간 보기'}
                  </button>
                  <button type="button" className={styles.cctvBtn} onClick={handleCapture}>
                    📸 캡처 저장
                  </button>
                  <button type="button" className={styles.cctvBtn} onClick={handleShare}>
                    🔗 영상 공유
                  </button>
                </div>
              </div>

              {/* 알림 정보 */}
              <div className={styles.detailBody}>
                <div className={styles.detailTitleRow}>
                  <span
                    className={[
                      styles.riskPill,
                      styles[`riskPill_${PRIORITY_TO_RISK[selected.priority]}`],
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {RISK_EMOJI[PRIORITY_TO_RISK[selected.priority] as Exclude<RiskLevel, 'all'>]}{' '}
                    {RISK_DISPLAY[selected.priority]}
                  </span>
                  <span className={styles.detailStatus}>
                    {STATUS_LABEL[selected.status]}
                  </span>
                </div>

                <div className={styles.detailTitle}>{selected.message}</div>

                <div className={styles.detailMeta}>
                  <div className={styles.detailMetaRow}>
                    <span className={styles.detailMetaKey}>유형</span>
                    <span className={styles.detailMetaVal}>
                      {TYPE_ICON[selected.type]} {TYPE_LABEL[selected.type]}
                    </span>
                  </div>
                  <div className={styles.detailMetaRow}>
                    <span className={styles.detailMetaKey}>위치</span>
                    <span className={styles.detailMetaVal}>
                      {selected.siteName} · {selected.cameraName}
                    </span>
                  </div>
                  <div className={styles.detailMetaRow}>
                    <span className={styles.detailMetaKey}>발생 시각</span>
                    <span className={styles.detailMetaVal}>
                      {formatDateTime(selected.occurredAt)}
                    </span>
                  </div>
                </div>

                {/* 처리 버튼 */}
                <div className={styles.actionRow}>
                  <Button
                    variant={selected.status === 'open' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={handleAck}
                    disabled={selected.status === 'resolved'}
                  >
                    ✓ 확인
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleResolve}
                    disabled={selected.status === 'resolved'}
                  >
                    ✓ 해결
                  </Button>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
