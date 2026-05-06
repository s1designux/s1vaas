// TODO: replace with fetch('/api/v1/sites')
import { useMemo, useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Drawer } from '@/components/ui/Drawer';
import { useCountUp } from '@/hooks/useCountUp';
import { useToast } from '@/hooks/useToast';
import type { Site } from '@/types';
import page from './Page.module.css';
import form from '@/components/ui/Form.module.css';

/** KPI 아이콘 (site page 전용) */
function KpiBadgeIcon({ variant }: { variant: 'site' | 'cam' | 'warn' | 'uptime' }) {
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
    variant === 'site' ? (
      <svg {...p}>
        <path d="M3 21V8l9-5 9 5v13" />
        <path d="M9 21v-7h6v7" />
      </svg>
    ) : variant === 'cam' ? (
      <svg {...p}>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ) : variant === 'warn' ? (
      <svg {...p}>
        <path d="M12 3L2 21h20L12 3z" />
        <path d="M12 10v5" />
        <circle cx="12" cy="18" r="0.6" fill="currentColor" />
      </svg>
    ) : (
      <svg {...p}>
        <path d="M3 12l3-3 3 3 4-6 4 6 4-4" />
      </svg>
    );
  return <div className={[page.kpiIconBadge, page[`kpiIconBadge_${variant}`]].join(' ')}>{svg}</div>;
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
  variant: 'site' | 'cam' | 'warn' | 'uptime';
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
          <span style={{ fontSize: 16, color: 'var(--color-text-muted)', marginLeft: 4 }}>
            {suffix}
          </span>
        )}
      </div>
      {meta && <div className={page.kpiMeta}>{meta}</div>}
    </div>
  );
}

// Rough lat/lng → percent mapping for a mock Korea map canvas
function project(lat?: number, lng?: number): { x: number; y: number } | null {
  if (lat == null || lng == null) return null;
  const minLat = 33;
  const maxLat = 38.5;
  const minLng = 125.5;
  const maxLng = 129.8;
  const x = ((lng - minLng) / (maxLng - minLng)) * 100;
  const y = (1 - (lat - minLat) / (maxLat - minLat)) * 100;
  return { x, y };
}

/** Site 카드용 썸네일 — Phase G: thumbnail 있으면 GPT 빌딩 실사, 없으면 기존 SVG fallback */
function SiteThumb({ seed, thumbnail, name }: { seed: string; thumbnail?: string; name?: string }) {
  // Phase G — panel-2026-04-28 GPT 에셋 우선 사용 (CL_BRAND_P2_02 보완)
  if (thumbnail) {
    return (
      <div className={page.siteThumb}>
        <img
          src={thumbnail}
          alt={name ? `${name} 외관` : ''}
          className={page.siteThumbSvg}
          loading="lazy"
          style={{ objectFit: 'cover' }}
        />
      </div>
    );
  }

  // Fallback — 결정적인 hue/pattern 선택
  const hash = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0);
  const palettes = [
    ['#B9D2FF', '#4F6FB0'],
    ['#CDE3F2', '#2E5E8C'],
    ['#D7C3F2', '#6A4A9A'],
    ['#C4E8D0', '#3F8B5F'],
    ['#F2D8C4', '#A25C2F'],
    ['#D0D9E8', '#4A5E82'],
  ];
  const [c1, c2] = palettes[hash % palettes.length];
  const variant = hash % 3;
  return (
    <div
      className={page.siteThumb}
      style={{ background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` }}
    >
      <svg viewBox="0 0 200 100" preserveAspectRatio="xMidYMid slice" className={page.siteThumbSvg}>
        <defs>
          <pattern id={`grid-${seed}`} width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M8 0H0V8" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="200" height="100" fill={`url(#grid-${seed})`} />
        {variant === 0 && (
          <g fill="rgba(255,255,255,0.22)" stroke="rgba(255,255,255,0.35)">
            <rect x="20" y="30" width="30" height="60" />
            <rect x="60" y="15" width="35" height="75" />
            <rect x="105" y="35" width="25" height="55" />
            <rect x="140" y="22" width="40" height="68" />
          </g>
        )}
        {variant === 1 && (
          <g fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.32)">
            <polygon points="40,90 40,50 70,30 100,50 100,90" />
            <rect x="120" y="35" width="50" height="55" />
          </g>
        )}
        {variant === 2 && (
          <g fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.32)">
            <rect x="10" y="55" width="180" height="35" />
            <rect x="20" y="45" width="50" height="45" />
            <rect x="130" y="40" width="55" height="50" />
          </g>
        )}
      </svg>
    </div>
  );
}

interface DrawerState {
  mode: 'edit' | 'create';
  site: Site | null;
}

export default function Site() {
  const sites = useDataStore((s) => s.sites);
  const cameras = useDataStore((s) => s.cameras);
  const events = useDataStore((s) => s.events);
  const contracts = useDataStore((s) => s.contracts);
  const updateSite = useDataStore((s) => s.updateSite);
  const addSite = useDataStore((s) => s.addSite);
  const toast = useToast();

  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formContractId, setFormContractId] = useState('');
  const [formManager, setFormManager] = useState('');
  const [formInstalledAt, setFormInstalledAt] = useState('');

  const totalCams = cameras.length;
  const onlineCams = cameras.filter((c) => c.status !== 'offline').length;
  const unackEvents = events.filter((e) => !e.acknowledged).length;
  const uptimePct = totalCams > 0 ? Math.round((onlineCams / totalCams) * 1000) / 10 : 0;

  const enriched = useMemo(
    () =>
      sites.map((s) => {
        const contract = contracts.find((c) => c.id === s.contractId);
        return {
          ...s,
          contractCode: contract?.code ?? '—',
          contractStatus: contract?.status ?? 'active',
          camCount: cameras.filter((c) => c.siteId === s.id).length,
          onlineCount: cameras.filter((c) => c.siteId === s.id && c.status !== 'offline').length,
          unack: events.filter((e) => e.siteId === s.id && !e.acknowledged).length,
        };
      }),
    [sites, cameras, events, contracts],
  );

  const openEdit = (s: Site) => {
    setDrawer({ mode: 'edit', site: s });
    setFormName(s.name);
    setFormAddress(s.address);
    setFormContractId(s.contractId);
    setFormManager((s as Site & { manager?: string }).manager ?? '김관리');
    setFormInstalledAt('2024-03-15');
  };

  const openCreate = () => {
    setDrawer({ mode: 'create', site: null });
    setFormName('');
    setFormAddress('');
    setFormContractId(contracts[0]?.id ?? '');
    setFormManager('');
    setFormInstalledAt(new Date().toISOString().slice(0, 10));
  };

  const closeDrawer = () => setDrawer(null);

  const handleSave = () => {
    if (!formName.trim()) {
      toast.warn('사이트 이름을 입력해 주세요.');
      return;
    }
    if (drawer?.mode === 'edit' && drawer.site) {
      updateSite(drawer.site.id, {
        name: formName.trim(),
        address: formAddress.trim(),
        contractId: formContractId,
      });
      toast.success('저장되었습니다', `${formName} 사이트 정보가 업데이트되었습니다.`);
    } else if (drawer?.mode === 'create') {
      addSite({
        name: formName.trim(),
        address: formAddress.trim(),
        contractId: formContractId || (contracts[0]?.id ?? ''),
      });
      toast.success('사이트 추가', `${formName} 사이트가 등록되었습니다.`);
    }
    closeDrawer();
  };

  const drawerSiteCams = drawer?.site
    ? cameras.filter((c) => c.siteId === drawer.site!.id)
    : [];
  const drawerSite = drawer?.site;
  const drawerCamUtil =
    drawerSite && drawerSite.cameraCount > 0
      ? Math.round((drawerSite.onlineCount / drawerSite.cameraCount) * 100)
      : 0;

  return (
    <div className={page.page}>
      <div className={page.header}>
        <div>
          <div className={page.headerKicker}>INFRASTRUCTURE</div>
          <div className={page.headerTitle}>사이트 관리</div>
          <div className={page.headerSubtitle}>지사·지점의 카메라 배치와 계약 상태를 한 눈에 확인합니다.</div>
        </div>
        <div className={page.actions}>
          <Button variant="secondary" size="sm">
            CSV 내보내기
          </Button>
          <Button variant="primary" size="sm" onClick={openCreate}>
            + 사이트 추가
          </Button>
        </div>
      </div>

      <div className={page.kpiRow}>
        <Kpi label="전체 사이트" value={sites.length} suffix="개" meta="운영 중" variant="site" />
        <Kpi label="전체 카메라" value={totalCams} suffix="대" meta="등록 기준" variant="cam" />
        <Kpi label="위험" value={unackEvents} suffix="건" meta="미확인 이벤트" variant="warn" />
        <Kpi label="가동률" value={Math.round(uptimePct)} suffix="%" meta={`${onlineCams}/${totalCams} 온라인`} variant="uptime" />
      </div>

      <div className={page.siteGrid}>
        {enriched.map((s) => (
          <div key={s.id} className={page.siteCardV2} onClick={() => openEdit(s)} role="button" tabIndex={0}>
            <SiteThumb seed={s.id} thumbnail={s.thumbnail} name={s.name} />
            <div className={page.siteCardBody}>
              <div className={page.siteHeader}>
                <div className={page.siteTitle}>{s.name}</div>
                {s.unack > 0 ? (
                  <Badge tone="danger" dot>
                    WARNING
                  </Badge>
                ) : (
                  <Badge tone="success" dot>
                    ONLINE
                  </Badge>
                )}
              </div>
              <div className={page.siteAddress}>{s.address}</div>
              <div className={page.siteMini}>
                <div>
                  <span className={page.siteMiniVal}>{s.camCount} Units</span>
                  <span className={page.siteMiniLabel}>CAMERA</span>
                </div>
                <div>
                  <span className={page.siteMiniVal}>
                    {s.onlineCount}/{s.camCount}
                  </span>
                  <span className={page.siteMiniLabel}>ONLINE</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Card title="사이트 테이블">
        <table className={page.dataTable}>
          <thead>
            <tr>
              <th>사이트명</th>
              <th>주소</th>
              <th>계약 코드</th>
              <th>카메라</th>
              <th>가동률</th>
              <th>상태</th>
              <th style={{ width: 100 }}></th>
            </tr>
          </thead>
          <tbody>
            {enriched.map((s) => (
              <tr key={s.id} onClick={() => openEdit(s)}>
                <td style={{ fontWeight: 600 }}>{s.name}</td>
                <td style={{ color: 'var(--color-text-muted)' }}>{s.address}</td>
                <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>{s.contractCode}</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>
                  {s.onlineCount}/{s.camCount}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>
                  {s.camCount > 0 ? Math.round((s.onlineCount / s.camCount) * 100) : 0}%
                </td>
                <td>
                  <Badge tone={s.contractStatus === 'active' ? 'success' : 'warn'} dot>
                    {s.contractStatus === 'active' ? '활성' : '일시중지'}
                  </Badge>
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                    편집
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* ========== Map — SVG of Korea with site markers ========== */}
      <div className={page.mapPanel}>
        <div className={page.mapHead}>
          <span className={page.mapTitle}>지점별 네트워크 현황</span>
          <span className={page.mapSub}>대한민국 전 국토에 걸친 관제 네트워크</span>
        </div>
        <div className={page.mapBody}>
          <img src="/brand/map-korea.svg" alt="대한민국 지도" className={page.mapBg} />
          {enriched.map((s) => {
            const p = project(s.lat, s.lng);
            if (!p) return null;
            return (
              <div
                key={s.id}
                className={page.mapMarker}
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                title={s.name}
              >
                <span className={page.mapMarkerLabel}>{s.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      <Drawer
        open={!!drawer}
        onClose={closeDrawer}
        title={drawer?.mode === 'create' ? '신규 사이트' : '사이트 편집'}
        subtitle={drawer?.mode === 'edit' ? drawer.site?.name : '기본 정보를 입력하세요.'}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={closeDrawer}>
              취소
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              저장
            </Button>
          </>
        }
      >
        {drawer && (
          <>
            <div className={form.sectionCaption}>기본 정보</div>
            <div className={form.field}>
              <label className={form.label}>사이트 이름</label>
              <input
                className={form.input}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="예: 강남 본점"
              />
            </div>
            <div className={form.field}>
              <label className={form.label}>주소</label>
              <input
                className={form.input}
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                placeholder="서울특별시 …"
              />
            </div>
            <div className={form.rowCols2}>
              <div className={form.field}>
                <label className={form.label}>계약</label>
                <select
                  className={form.select}
                  value={formContractId}
                  onChange={(e) => setFormContractId(e.target.value)}
                >
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={form.field}>
                <label className={form.label}>설치일</label>
                <input
                  type="date"
                  className={form.input}
                  value={formInstalledAt}
                  onChange={(e) => setFormInstalledAt(e.target.value)}
                />
              </div>
            </div>
            <div className={form.field}>
              <label className={form.label}>담당자</label>
              <input
                className={form.input}
                value={formManager}
                onChange={(e) => setFormManager(e.target.value)}
                placeholder="담당자 이름"
              />
            </div>

            {drawer.mode === 'edit' && drawerSite && (
              <>
                <div className={form.sectionCaption}>가동률 현황</div>
                <div>
                  <div className={form.metaTop}>
                    <span>
                      {drawerSite.onlineCount}/{drawerSite.cameraCount} 온라인
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{drawerCamUtil}%</span>
                  </div>
                  <div className={form.metaBar}>
                    <div className={form.metaBarFill} style={{ width: `${drawerCamUtil}%` }} />
                  </div>
                </div>

                <div className={form.sectionCaption}>카메라 ({drawerSiteCams.length})</div>
                <table className={form.miniTable}>
                  <thead>
                    <tr>
                      <th>이름</th>
                      <th>구역</th>
                      <th style={{ width: 72 }}>상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drawerSiteCams.length === 0 && (
                      <tr>
                        <td colSpan={3} style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>
                          등록된 카메라가 없습니다.
                        </td>
                      </tr>
                    )}
                    {drawerSiteCams.map((c) => (
                      <tr key={c.id}>
                        <td>{c.name}</td>
                        <td style={{ color: 'var(--color-text-muted)' }}>{c.model}</td>
                        <td>
                          <Badge
                            tone={
                              c.status === 'offline'
                                ? 'danger'
                                : c.status === 'recording'
                                  ? 'warn'
                                  : 'success'
                            }
                            dot
                          >
                            {c.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </>
        )}
      </Drawer>
    </div>
  );
}
