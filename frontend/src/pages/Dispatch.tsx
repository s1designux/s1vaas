// TODO: replace with fetch('/api/v1/dispatch')
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { BtnGroup } from '@/components/ui/BtnGroup';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Drawer } from '@/components/ui/Drawer';
import { useCountUp } from '@/hooks/useCountUp';
import { useToast } from '@/hooks/useToast';
import { relativeTime, formatDateTime } from '@/lib/time';
import { dispatchSeed } from '@/mock/dispatches';
import type {
  DispatchTicket,
  DispatchState,
  DispatchReason,
  DispatchEvent,
} from '@/types/dispatch';
import page from './Page.module.css';
import styles from './Dispatch.module.css';

const REASON_LABEL: Record<DispatchReason, string> = {
  intrusion: '침입',
  fire: '화재',
  visitor: '방문',
  check: '점검',
  panic: '비상',
  maintenance: '정비',
};

const REASON_TONE: Record<DispatchReason, BadgeTone> = {
  intrusion: 'danger',
  fire: 'danger',
  visitor: 'info',
  check: 'neutral',
  panic: 'danger',
  maintenance: 'warn',
};

const STATE_LABEL: Record<DispatchState, string> = {
  received: '접수',
  en_route: '출발',
  on_scene: '현장 도착',
  closed: '상황 종료',
};

const STATE_ORDER: DispatchState[] = ['received', 'en_route', 'on_scene', 'closed'];
const STEPPER_LABELS: { state: DispatchState; short: string }[] = [
  { state: 'received', short: '접수' },
  { state: 'en_route', short: '출발' },
  { state: 'on_scene', short: '현장도착' },
  { state: 'closed', short: '상황종료' },
];

const NEXT_ACTION: Record<Exclude<DispatchState, 'closed'>, { label: string; next: DispatchState }> = {
  received: { label: '출발 처리', next: 'en_route' },
  en_route: { label: '현장 도착', next: 'on_scene' },
  on_scene: { label: '상황 종료', next: 'closed' },
};

type RangeKey = 'today' | 'week' | 'month';

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function isWithin(closedAtIso: string | undefined, key: RangeKey): boolean {
  if (!closedAtIso) return false;
  const t = Date.parse(closedAtIso);
  if (Number.isNaN(t)) return false;
  const now = Date.now();
  const today = startOfToday();
  if (key === 'today') return t >= today;
  if (key === 'week') return now - t <= 7 * 24 * 60 * 60 * 1000;
  return now - t <= 31 * 24 * 60 * 60 * 1000;
}

function KpiBadge({ variant }: { variant: 'live' | 'eta' | 'closed' | 'sla' }) {
  const p = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  const svg =
    variant === 'live' ? (
      <svg {...p}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6l4 2" />
      </svg>
    ) : variant === 'eta' ? (
      <svg {...p}>
        <path d="M3 13l3-7h12l3 7" />
        <circle cx="7" cy="17" r="2" />
        <circle cx="17" cy="17" r="2" />
      </svg>
    ) : variant === 'closed' ? (
      <svg {...p}>
        <path d="M5 12l4 4L19 7" />
      </svg>
    ) : (
      <svg {...p}>
        <path d="M12 3l8 4v5c0 5-4 9-8 10-4-1-8-5-8-10V7z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    );
  return (
    <div className={[page.kpiIconBadge, styles[`badge_${variant}`]].join(' ')}>{svg}</div>
  );
}

function Kpi({
  label,
  value,
  suffix,
  meta,
  variant,
}: {
  label: string;
  value: number;
  suffix?: string;
  meta?: string;
  variant: 'live' | 'eta' | 'closed' | 'sla';
}) {
  const v = useCountUp(value);
  return (
    <div className={page.kpi}>
      <div className={page.kpiRowTop}>
        <div className={page.kpiLabel}>{label}</div>
        <KpiBadge variant={variant} />
      </div>
      <div className={`${page.kpiValue} tabular`}>
        {v.toLocaleString()}
        {suffix && <span className={styles.kpiSuffix}>{suffix}</span>}
      </div>
      {meta && <div className={page.kpiMeta}>{meta}</div>}
    </div>
  );
}

function Stepper({ current }: { current: DispatchState }) {
  const currentIdx = STATE_ORDER.indexOf(current);
  return (
    <div className={styles.stepper}>
      {STEPPER_LABELS.map((step, i) => {
        const isDone = i < currentIdx;
        const isActive = i === currentIdx;
        const dotCls = [
          styles.stepDot,
          isDone ? styles.stepDone : '',
          isActive ? styles.stepActive : '',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <div key={step.state} className={styles.stepItem}>
            <div className={styles.stepDotWrap}>
              <span className={dotCls} aria-hidden="true" />
              {i < STEPPER_LABELS.length - 1 && (
                <span
                  className={[styles.stepLine, i < currentIdx ? styles.stepLineDone : '']
                    .filter(Boolean)
                    .join(' ')}
                  aria-hidden="true"
                />
              )}
            </div>
            <span
              className={[
                styles.stepLabel,
                isDone ? styles.stepLabelDone : '',
                isActive ? styles.stepLabelActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {step.short}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ResponderIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export default function Dispatch() {
  const [tickets, setTickets] = useState<DispatchTicket[]>(dispatchSeed);
  const [range, setRange] = useState<RangeKey>('today');
  const [drawerTicket, setDrawerTicket] = useState<DispatchTicket | null>(null);
  const toast = useToast();

  const inProgress = useMemo(
    () => tickets.filter((t) => t.state !== 'closed'),
    [tickets],
  );

  const closedAll = useMemo(
    () => tickets.filter((t) => t.state === 'closed'),
    [tickets],
  );

  const kpiInProgress = inProgress.length;

  const kpiAvgEta = useMemo(() => {
    const samples: number[] = [];
    for (const t of closedAll) {
      const en = t.events.find((e) => e.state === 'en_route');
      const on = t.events.find((e) => e.state === 'on_scene');
      if (en && on) {
        const min = (Date.parse(on.at) - Date.parse(en.at)) / 60000;
        if (min >= 0 && min < 240) samples.push(min);
      }
    }
    if (samples.length === 0) return 0;
    return Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
  }, [closedAll]);

  const kpiClosedToday = useMemo(
    () => closedAll.filter((t) => isWithin(t.closedAt, 'today')).length,
    [closedAll],
  );

  const kpiSla = useMemo(() => {
    if (closedAll.length === 0) return 0;
    let ok = 0;
    for (const t of closedAll) {
      if (!t.arrivedAt) continue;
      const actual = (Date.parse(t.arrivedAt) - Date.parse(t.receivedAt)) / 60000;
      if (actual <= t.etaMin) ok += 1;
    }
    return Math.round((ok / closedAll.length) * 100);
  }, [closedAll]);

  const filteredHistory = useMemo(
    () => closedAll.filter((t) => isWithin(t.closedAt, range)),
    [closedAll, range],
  );

  const advance = (ticket: DispatchTicket) => {
    if (ticket.state === 'closed') return;
    const action = NEXT_ACTION[ticket.state];
    if (!action) return;
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticket.id) return t;
        const newEvent: DispatchEvent = {
          state: action.next,
          at: new Date().toISOString(),
          by: t.responder,
          note:
            action.next === 'en_route'
              ? '출동 차량 출발'
              : action.next === 'on_scene'
                ? '현장 도착, 상황 확인 중'
                : '상황 종료 처리',
        };
        const next: DispatchTicket = {
          ...t,
          state: action.next,
          events: [...t.events, newEvent],
          arrivedAt: action.next === 'on_scene' ? newEvent.at : t.arrivedAt,
          closedAt: action.next === 'closed' ? newEvent.at : t.closedAt,
        };
        return next;
      }),
    );
    toast.success(
      `${ticket.id} ${action.label} 완료`,
      `${ticket.siteName} · ${ticket.responder} 대원`,
    );
  };

  return (
    <div className={page.page}>
      <div className={page.header}>
        <div className={page.actions}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toast.info('지도 모듈 연결 예정', '추후 GIS 연동 시 활성화됩니다.')}
          >
            지도에서 보기
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              toast.warn('긴급 출동 요청', '관제 콜센터로 라우팅됩니다 (모의 동작).')
            }
          >
            긴급 출동 요청
          </Button>
        </div>
      </div>

      <div className={page.kpiRow}>
        <Kpi label="진행 중" value={kpiInProgress} suffix="건" meta="현재 진행 중인 출동" variant="live" />
        <Kpi
          label="평균 도착(분)"
          value={kpiAvgEta}
          suffix="분"
          meta="출발 → 현장 도착"
          variant="eta"
        />
        <Kpi
          label="오늘 종결"
          value={kpiClosedToday}
          suffix="건"
          meta="자정 이후 종결"
          variant="closed"
        />
        <Kpi
          label="SLA 준수율"
          value={kpiSla}
          suffix="%"
          meta="ETA 내 도착 비율"
          variant="sla"
        />
      </div>

      <div className={styles.sectionHead}>
        <div className={styles.sectionTitle}>진행 중 출동 ({inProgress.length})</div>
        <div className={styles.sectionSub}>
          단계 카드를 클릭하지 말고 우측 액션 버튼으로 다음 상태를 진행하세요.
        </div>
      </div>

      <div className={styles.cardGrid}>
        {inProgress.map((t) => {
          const elapsed = relativeTime(t.receivedAt);
          const action = t.state !== 'closed' ? NEXT_ACTION[t.state] : null;
          return (
            <div key={t.id} className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.cardId}>{t.id}</span>
                <Badge tone={REASON_TONE[t.reason]} dot>
                  {REASON_LABEL[t.reason]}
                </Badge>
              </div>
              <div className={styles.cardSite}>{t.siteName}</div>

              <Stepper current={t.state} />

              <div className={styles.cardMeta}>
                <div className={styles.metaRow}>
                  <span className={styles.metaIcon}>
                    <ResponderIcon />
                  </span>
                  <span className={styles.metaLabel}>담당</span>
                  <span className={styles.metaVal}>{t.responder}</span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaIcon}>
                    <PhoneIcon />
                  </span>
                  <span className={styles.metaLabel}>연락</span>
                  <span className={`${styles.metaVal} tabular`}>{t.responderPhone}</span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaIcon}>
                    <ClockIcon />
                  </span>
                  <span className={styles.metaLabel}>경과</span>
                  <span className={styles.metaVal}>
                    {elapsed} <span className={styles.metaSub}>· ETA {t.etaMin}분</span>
                  </span>
                </div>
              </div>

              <div className={styles.cardNote}>{t.notes}</div>

              <div className={styles.cardFoot}>
                {t.alertId ? (
                  <button
                    type="button"
                    className={styles.linkBtn}
                    onClick={() =>
                      toast.info('원본 알림', `${t.alertId} 알림으로 이동 (라우팅 연결 예정).`)
                    }
                  >
                    원본 알림 {t.alertId}
                  </button>
                ) : (
                  <span className={styles.linkPlaceholder}>—</span>
                )}
                {action && (
                  <Button variant="primary" size="sm" onClick={() => advance(t)}>
                    {action.label}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        {inProgress.length === 0 && (
          <div className={styles.emptyCard}>현재 진행 중인 출동이 없습니다.</div>
        )}
      </div>

      <div className={styles.historyCard}>
        <div className={styles.historyHead}>
          <div>
            <div className={styles.sectionTitle}>출동 이력</div>
            <div className={styles.sectionSub}>완료된 출동 건의 처리 결과 및 도착 소요 시간.</div>
          </div>
          <BtnGroup>
            {(
              [
                { k: 'today', label: '오늘' },
                { k: 'week', label: '이번 주' },
                { k: 'month', label: '이번 달' },
              ] as { k: RangeKey; label: string }[]
            ).map((opt) => (
              <BtnGroup.Btn key={opt.k} active={range === opt.k} onClick={() => setRange(opt.k)}>
                {opt.label}
              </BtnGroup.Btn>
            ))}
          </BtnGroup>
        </div>

        <table className={page.dataTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>사이트</th>
              <th>사유</th>
              <th>대원</th>
              <th>접수 시각</th>
              <th>도착(분)</th>
              <th>처리 결과</th>
              <th style={{ width: 84 }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.length === 0 && (
              <tr>
                <td colSpan={8} className={styles.tableEmpty}>
                  선택한 기간에 종결된 출동이 없습니다.
                </td>
              </tr>
            )}
            {filteredHistory.map((t) => {
              const eta =
                t.arrivedAt && t.receivedAt
                  ? Math.round((Date.parse(t.arrivedAt) - Date.parse(t.receivedAt)) / 60000)
                  : null;
              const onTime = eta != null && eta <= t.etaMin;
              return (
                <tr key={t.id} onClick={() => setDrawerTicket(t)}>
                  <td className="tabular" style={{ fontFamily: 'var(--font-mono)' }}>
                    {t.id}
                  </td>
                  <td style={{ fontWeight: 600 }}>{t.siteName}</td>
                  <td>
                    <Badge tone={REASON_TONE[t.reason]} dot={false}>
                      {REASON_LABEL[t.reason]}
                    </Badge>
                  </td>
                  <td>{t.responder}</td>
                  <td
                    className="tabular"
                    style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
                  >
                    {formatDateTime(t.receivedAt)}
                  </td>
                  <td className="tabular" style={{ fontFamily: 'var(--font-mono)' }}>
                    {eta != null ? `${eta}분` : '—'}
                  </td>
                  <td>
                    <Badge tone={onTime ? 'success' : 'warn'} dot>
                      {onTime ? 'SLA 준수' : 'SLA 초과'}
                    </Badge>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <Button variant="secondary" size="sm" onClick={() => setDrawerTicket(t)}>
                      상세
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Drawer
        open={!!drawerTicket}
        onClose={() => setDrawerTicket(null)}
        title={drawerTicket ? `출동 상세 ${drawerTicket.id}` : ''}
        subtitle={drawerTicket?.siteName}
        footer={
          <Button variant="secondary" size="sm" onClick={() => setDrawerTicket(null)}>
            닫기
          </Button>
        }
      >
        {drawerTicket && (
          <>
            <div className={styles.kvList}>
              <div className={styles.kvRow}>
                <span className={styles.kvLabel}>출동 사유</span>
                <span className={styles.kvVal}>
                  <Badge tone={REASON_TONE[drawerTicket.reason]} dot>
                    {REASON_LABEL[drawerTicket.reason]}
                  </Badge>
                </span>
              </div>
              <div className={styles.kvRow}>
                <span className={styles.kvLabel}>담당 대원</span>
                <span className={styles.kvVal}>
                  {drawerTicket.responder} · {drawerTicket.responderPhone}
                </span>
              </div>
              <div className={styles.kvRow}>
                <span className={styles.kvLabel}>접수</span>
                <span className={styles.kvVal}>{formatDateTime(drawerTicket.receivedAt)}</span>
              </div>
              <div className={styles.kvRow}>
                <span className={styles.kvLabel}>도착</span>
                <span className={styles.kvVal}>
                  {drawerTicket.arrivedAt ? formatDateTime(drawerTicket.arrivedAt) : '—'}
                </span>
              </div>
              <div className={styles.kvRow}>
                <span className={styles.kvLabel}>종결</span>
                <span className={styles.kvVal}>
                  {drawerTicket.closedAt ? formatDateTime(drawerTicket.closedAt) : '—'}
                </span>
              </div>
              <div className={styles.kvRow}>
                <span className={styles.kvLabel}>현재 상태</span>
                <span className={styles.kvVal}>{STATE_LABEL[drawerTicket.state]}</span>
              </div>
              {drawerTicket.alertId && (
                <div className={styles.kvRow}>
                  <span className={styles.kvLabel}>원본 알림</span>
                  <span className={styles.kvVal}>{drawerTicket.alertId}</span>
                </div>
              )}
            </div>

            <div className={styles.timelineHead}>상태 변화 이력</div>
            <ol className={styles.timeline}>
              {drawerTicket.events.map((e, idx) => (
                <li key={idx} className={styles.timelineItem}>
                  <span className={styles.timelineDot} aria-hidden="true" />
                  {idx < drawerTicket.events.length - 1 && (
                    <span className={styles.timelineLine} aria-hidden="true" />
                  )}
                  <div className={styles.timelineBody}>
                    <div className={styles.timelineTitle}>
                      {STATE_LABEL[e.state]}
                      {e.by && <span className={styles.timelineBy}> · {e.by}</span>}
                    </div>
                    <div className={styles.timelineTime}>{formatDateTime(e.at)}</div>
                    {e.note && <div className={styles.timelineNote}>{e.note}</div>}
                  </div>
                </li>
              ))}
            </ol>

            <div className={styles.timelineHead}>현장 메모</div>
            <div className={styles.notesBox}>{drawerTicket.notes}</div>
          </>
        )}
      </Drawer>
    </div>
  );
}
