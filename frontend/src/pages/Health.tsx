// TODO: replace with fetch('/api/v1/devices/health')
import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Drawer } from '@/components/ui/Drawer';
import { useCountUp } from '@/hooks/useCountUp';
import { useToast } from '@/hooks/useToast';
import { formatDateTime } from '@/lib/time';
import { camerasSeed } from '@/mock/cameras';
import { sitesSeed } from '@/mock/sites';
import {
  MOCK_HEALTH_BY_CAMERA,
  MOCK_STORAGE_BUCKETS,
  siteHealthSummaries,
} from '@/mock/health';
import type { DeviceHealthMeta, HealthSeverity } from '@/types/health';
import type { Camera } from '@/types/camera';
import page from './Page.module.css';
import s from './Health.module.css';

/* ============================ KPI ============================ */

type KpiVariant = 'total' | 'online' | 'off' | 'fw';

function KpiBadgeIcon({ variant }: { variant: KpiVariant }) {
  const p = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  const svg =
    variant === 'total' ? (
      <svg {...p}>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M3 10h18" />
      </svg>
    ) : variant === 'online' ? (
      <svg {...p}>
        <path d="M5 13l4 4L19 7" />
      </svg>
    ) : variant === 'off' ? (
      <svg {...p}>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12h8" />
      </svg>
    ) : (
      <svg {...p}>
        <path d="M12 9v4" />
        <path d="M12 17h0.01" />
        <path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      </svg>
    );
  return <div className={[page.kpiIconBadge, s[`kpiBadge_${variant}`]].join(' ')}>{svg}</div>;
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
  variant: KpiVariant;
}) {
  const v = useCountUp(value);
  return (
    <div className={page.kpi}>
      <div className={page.kpiRowTop}>
        <div className={page.kpiLabel}>{label}</div>
        <KpiBadgeIcon variant={variant} />
      </div>
      <div className={`${page.kpiValue} tabular`}>
        {v.toLocaleString()}
        {suffix && (
          <span
            style={{
              fontSize: 16,
              color: 'var(--color-text-muted)',
              marginLeft: 4,
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

/* ============================ 도넛 SVG ============================ */

const BUCKET_VAR: Record<string, string> = {
  accent: 'var(--color-accent)',
  success: 'var(--color-success)',
  warn: 'var(--color-warn)',
  danger: 'var(--color-danger)',
  neutral: 'var(--color-border)',
};

function StorageDonut() {
  const buckets = MOCK_STORAGE_BUCKETS;
  const totalGb = buckets.reduce((acc, b) => acc + b.bytes, 0);
  const usedGb = buckets.filter((b) => b.label !== '여유 공간').reduce((acc, b) => acc + b.bytes, 0);
  const usedPct = totalGb > 0 ? Math.round((usedGb / totalGb) * 100) : 0;

  // SVG 도넛 — viewBox 100x100, r=40, gap=2deg between segments
  const cx = 50;
  const cy = 50;
  const r = 40;
  const C = 2 * Math.PI * r;
  let offset = 0;
  const segments = buckets.map((b) => {
    const frac = b.bytes / totalGb;
    const length = C * frac;
    const node = (
      <circle
        key={b.label}
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={BUCKET_VAR[b.color] ?? 'var(--color-border)'}
        strokeWidth={14}
        strokeDasharray={`${Math.max(0, length - 1.5)} ${C}`}
        strokeDashoffset={-offset}
      />
    );
    offset += length;
    return node;
  });

  return (
    <Card title="저장소 사용량">
      <div className={s.donutCard}>
        <div className={s.donutWrap}>
          <svg className={s.donutSvg} viewBox="0 0 100 100">
            {/* track */}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="var(--color-surface-alt)"
              strokeWidth={14}
            />
            <g transform={`rotate(-90 ${cx} ${cy})`}>{segments}</g>
            <text
              x="50"
              y="48"
              textAnchor="middle"
              className={s.donutCenter}
              style={{ fontSize: 16 }}
            >
              {usedPct}%
            </text>
            <text
              x="50"
              y="62"
              textAnchor="middle"
              className={s.donutSub}
              style={{ fontSize: 7, letterSpacing: '0.08em' }}
            >
              총 {(totalGb / 1000).toFixed(1)}TB
            </text>
          </svg>
        </div>
        <div className={s.donutLegend}>
          {buckets.map((b) => (
            <div key={b.label} className={s.donutLegendRow}>
              <span
                className={s.legendSwatch}
                style={{ background: BUCKET_VAR[b.color] ?? 'var(--color-border)' }}
              />
              <span className={s.legendLabel}>{b.label}</span>
              <span className={s.legendVal}>
                {b.bytes >= 1000 ? `${(b.bytes / 1000).toFixed(1)}TB` : `${b.bytes}GB`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/* ============================ 사이트 막대 ============================ */

function SiteOnlineBars() {
  const summaries = useMemo(() => siteHealthSummaries(camerasSeed, MOCK_HEALTH_BY_CAMERA), []);
  return (
    <Card title="사이트별 온라인 비율">
      <div className={s.barChart}>
        {summaries.map((row) => {
          const pct = row.total > 0 ? Math.round((row.online / row.total) * 100) : 0;
          const tone =
            pct >= 95
              ? 'var(--color-success)'
              : pct >= 80
                ? 'var(--color-accent)'
                : pct >= 60
                  ? 'var(--color-warn)'
                  : 'var(--color-danger)';
          return (
            <div key={row.siteId} className={s.barRow}>
              <span className={s.barLabel} title={row.siteName}>
                {row.siteName}
              </span>
              <span className={s.barTrack}>
                <span
                  className={s.barFill}
                  style={{ width: `${pct}%`, background: tone }}
                />
              </span>
              <span className={s.barPct}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ============================ 시스템 indicator ============================ */

interface IndicatorDef {
  label: string;
  meta: string;
  value: string;
  tone: HealthSeverity;
}

function SystemIndicators({ avgCpu }: { avgCpu: number }) {
  const items: IndicatorDef[] = [
    {
      label: 'CPU 평균',
      meta: '전체 카메라 가중 평균',
      value: `${avgCpu}%`,
      tone: avgCpu >= 70 ? 'critical' : avgCpu >= 50 ? 'warn' : 'ok',
    },
    {
      label: '네트워크',
      meta: 'IoT VPN 터널 RTT 12ms',
      value: '정상',
      tone: 'ok',
    },
    {
      label: 'IoT Hub 연결',
      meta: 'Azure IoT Hub kr-central',
      value: '연결됨',
      tone: 'ok',
    },
    {
      label: '녹화 큐',
      meta: '백로그 24건 처리 중',
      value: '주의',
      tone: 'warn',
    },
  ];
  return (
    <Card title="시스템 상태">
      <div className={s.indicatorList}>
        {items.map((it) => (
          <div key={it.label} className={s.indicatorRow}>
            <span className={[s.indDot, s[`indDot_${it.tone}`]].join(' ')} />
            <div>
              <div className={s.indLabel}>{it.label}</div>
              <div className={s.indMeta}>{it.meta}</div>
            </div>
            <div className={s.indVal}>{it.value}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ============================ 테이블 ============================ */

type SortKey = 'severity' | 'site' | 'uptime' | 'disk';

const SEVERITY_ORDER: Record<HealthSeverity, number> = { critical: 0, warn: 1, ok: 2 };

function fmtUptime(sec: number): string {
  if (sec <= 0) return '—';
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  if (d > 0) return `${d}일 ${h}시간`;
  return `${h}시간`;
}

interface Row {
  cam: Camera;
  meta: DeviceHealthMeta;
  siteName: string;
}

function severityTone(sev: HealthSeverity): 'success' | 'warn' | 'danger' {
  return sev === 'ok' ? 'success' : sev === 'warn' ? 'warn' : 'danger';
}

function severityLabel(sev: HealthSeverity): string {
  return sev === 'ok' ? '정상' : sev === 'warn' ? '주의' : '위험';
}

function diskClass(pct: number): 'ok' | 'warn' | 'critical' {
  if (pct >= 85) return 'critical';
  if (pct >= 70) return 'warn';
  return 'ok';
}

/* ============================ 페이지 ============================ */

export default function Health() {
  const toast = useToast();
  const [sortKey, setSortKey] = useState<SortKey>('severity');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [drawerCamId, setDrawerCamId] = useState<string | null>(null);

  const rows: Row[] = useMemo(
    () =>
      camerasSeed.map((cam) => {
        const site = sitesSeed.find((x) => x.id === cam.siteId);
        return {
          cam,
          meta: MOCK_HEALTH_BY_CAMERA[cam.id]!,
          siteName: site?.name ?? '—',
        };
      }),
    [],
  );

  const sortedRows = useMemo(() => {
    const arr = [...rows];
    const dir = sortDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      switch (sortKey) {
        case 'severity':
          return (SEVERITY_ORDER[a.meta.severity] - SEVERITY_ORDER[b.meta.severity]) * dir;
        case 'site':
          return a.siteName.localeCompare(b.siteName, 'ko') * dir;
        case 'uptime':
          return (a.meta.uptimeSec - b.meta.uptimeSec) * dir;
        case 'disk':
          return (a.meta.diskUsedPct - b.meta.diskUsedPct) * dir;
        default:
          return 0;
      }
    });
    return arr;
  }, [rows, sortKey, sortDir]);

  const totalCams = camerasSeed.length;
  const onlineCams = camerasSeed.filter((c) => c.status !== 'offline').length;
  const offlineCams = totalCams - onlineCams;
  const fwBehind = rows.filter((r) => !r.meta.fwUpToDate).length;

  const avgCpu = useMemo(() => {
    const live = rows.filter((r) => r.cam.status !== 'offline');
    if (live.length === 0) return 0;
    return Math.round(live.reduce((acc, r) => acc + r.meta.cpuPct, 0) / live.length);
  }, [rows]);

  const onSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortHead = ({ k, label }: { k: SortKey; label: string }) => {
    const active = sortKey === k;
    return (
      <th className={s.sortHeader} onClick={() => onSort(k)}>
        {label}
        {active ? (
          <span className={s.sortArrow}>{sortDir === 'asc' ? '▲' : '▼'}</span>
        ) : (
          <span className={s.sortArrowMuted}>▲</span>
        )}
      </th>
    );
  };

  const drawerRow = drawerCamId
    ? rows.find((r) => r.cam.id === drawerCamId) ?? null
    : null;

  return (
    <div className={page.page}>
      <div className={page.header}>
        <div className={page.actions}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              toast.info('펌웨어 일괄 점검', '미적용 장비를 백그라운드로 점검합니다.')
            }
          >
            펌웨어 일괄 점검
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toast.info('리포트 내보내기', 'CSV 내보내기 모듈 연결 예정.')}
          >
            리포트 내보내기
          </Button>
        </div>
      </div>

      <div className={page.kpiRow}>
        <Kpi label="전체 카메라" value={totalCams} suffix="대" meta="등록 기준" variant="total" />
        <Kpi
          label="온라인"
          value={onlineCams}
          suffix="대"
          meta={`${Math.round((onlineCams / totalCams) * 100)}% 가동`}
          variant="online"
        />
        <Kpi
          label="오프라인"
          value={offlineCams}
          suffix="대"
          meta={offlineCams > 0 ? '점검 필요' : '이상 없음'}
          variant="off"
        />
        <Kpi
          label="FW 미적용"
          value={fwBehind}
          suffix="대"
          meta={`최신 v1.2.4 기준`}
          variant="fw"
        />
      </div>

      <div className={s.layout}>
        <div className={s.left}>
          <Card title="카메라 헬스">
            <div className={s.tableWrap}>
              <table className={page.dataTable}>
                <thead>
                  <tr>
                    <SortHead k="severity" label="상태" />
                    <th>카메라</th>
                    <SortHead k="site" label="사이트" />
                    <th>IP</th>
                    <th>FW</th>
                    <SortHead k="uptime" label="Uptime" />
                    <th>비트레이트</th>
                    <SortHead k="disk" label="디스크%" />
                    <th>CPU%</th>
                    <th>온도</th>
                    <th style={{ width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map(({ cam, meta, siteName }) => {
                    const dc = diskClass(meta.diskUsedPct);
                    return (
                      <tr key={cam.id} onClick={() => setDrawerCamId(cam.id)}>
                        <td>
                          <Badge tone={severityTone(meta.severity)} dot>
                            {severityLabel(meta.severity)}
                          </Badge>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {!meta.fwUpToDate && (
                            <span
                              className={s.fwWarnIcon}
                              title="펌웨어 업데이트 필요"
                              aria-label="펌웨어 업데이트 필요"
                            >
                              !
                            </span>
                          )}
                          {cam.name}
                        </td>
                        <td style={{ color: 'var(--color-text-muted)' }}>{siteName}</td>
                        <td className={s.cellMono}>{cam.ip}</td>
                        <td className={s.cellMono}>{meta.firmwareVersion}</td>
                        <td className={s.cellNumber}>{fmtUptime(meta.uptimeSec)}</td>
                        <td className={s.cellNumber}>
                          {meta.bitrateKbps > 0 ? `${meta.bitrateKbps.toLocaleString()} kbps` : '—'}
                        </td>
                        <td>
                          <span className={s.miniBar}>
                            <span className={s.miniBarTrack}>
                              <span
                                className={[s.miniBarFill, s[`miniBarFill_${dc}`]].join(' ')}
                                style={{ width: `${meta.diskUsedPct}%` }}
                              />
                            </span>
                            <span className={s.cellNumber}>{meta.diskUsedPct}%</span>
                          </span>
                        </td>
                        <td className={s.cellNumber}>{meta.cpuPct}%</td>
                        <td className={s.cellNumber}>
                          {meta.tempC > 0 ? `${meta.tempC}°C` : '—'}
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setDrawerCamId(cam.id)}
                          >
                            상세
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className={s.right}>
          <StorageDonut />
          <SiteOnlineBars />
          <SystemIndicators avgCpu={avgCpu} />
        </div>
      </div>

      <Drawer
        open={!!drawerRow}
        onClose={() => setDrawerCamId(null)}
        title={drawerRow ? drawerRow.cam.name : '디바이스'}
        subtitle={drawerRow ? `${drawerRow.siteName} · ${drawerRow.cam.model}` : undefined}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDrawerCamId(null)}>
              닫기
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toast.info('원격 진단', '진단 패킷을 전송합니다.')}
            >
              원격 진단
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                toast.info('재시작 요청', `${drawerRow?.cam.name} 재시작 명령을 큐에 넣었습니다.`)
              }
            >
              재시작
            </Button>
          </>
        }
      >
        {drawerRow && (
          <>
            <div className={s.drawerSection}>디바이스 트윈</div>
            <div className={s.kvList}>
              <div className={s.kvItem}>
                <span className={s.kvKey}>펌웨어</span>
                <span className={s.kvVal}>
                  {drawerRow.meta.firmwareVersion}
                  {!drawerRow.meta.fwUpToDate && (
                    <span style={{ marginLeft: 8 }}>
                      <Badge tone="warn" dot>
                        업데이트 필요
                      </Badge>
                    </span>
                  )}
                </span>
              </div>
              <div className={s.kvItem}>
                <span className={s.kvKey}>모델</span>
                <span className={[s.kvVal, s.kvValPlain].join(' ')}>{drawerRow.cam.model}</span>
              </div>
              <div className={s.kvItem}>
                <span className={s.kvKey}>IP 주소</span>
                <span className={s.kvVal}>{drawerRow.cam.ip}</span>
              </div>
              <div className={s.kvItem}>
                <span className={s.kvKey}>MAC</span>
                <span className={s.kvVal}>
                  {`00:1A:${drawerRow.cam.id.slice(-2).toUpperCase()}:${drawerRow.cam.ip
                    .split('.')
                    .slice(-2)
                    .map((n) => Number(n).toString(16).padStart(2, '0').toUpperCase())
                    .join(':')}:7F`}
                </span>
              </div>
              <div className={s.kvItem}>
                <span className={s.kvKey}>마지막 keyframe</span>
                <span className={[s.kvVal, s.kvValPlain].join(' ')}>
                  {formatDateTime(drawerRow.meta.lastKeyframeAt)}
                </span>
              </div>
              <div className={s.kvItem}>
                <span className={s.kvKey}>패킷 로스</span>
                <span className={s.kvVal}>{drawerRow.meta.packetLossPct.toFixed(1)}%</span>
              </div>
              <div className={s.kvItem}>
                <span className={s.kvKey}>온도</span>
                <span className={s.kvVal}>
                  {drawerRow.meta.tempC > 0 ? `${drawerRow.meta.tempC}°C` : '—'}
                </span>
              </div>
              <div className={s.kvItem}>
                <span className={s.kvKey}>CPU</span>
                <span className={s.kvVal}>{drawerRow.meta.cpuPct}%</span>
              </div>
              <div className={s.kvItem}>
                <span className={s.kvKey}>디스크</span>
                <span className={s.kvVal}>{drawerRow.meta.diskUsedPct}%</span>
              </div>
              <div className={s.kvItem}>
                <span className={s.kvKey}>가동 시간</span>
                <span className={[s.kvVal, s.kvValPlain].join(' ')}>
                  {fmtUptime(drawerRow.meta.uptimeSec)}
                </span>
              </div>
              <div className={s.kvItem}>
                <span className={s.kvKey}>비트레이트</span>
                <span className={s.kvVal}>
                  {drawerRow.meta.bitrateKbps > 0
                    ? `${drawerRow.meta.bitrateKbps.toLocaleString()} kbps`
                    : '—'}
                </span>
              </div>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
}
