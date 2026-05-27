// 안심 AI 설정 — 핵심 차별화 화면.
//   1) 업종·운영시간·걱정 상황 기반으로 AI 알고리즘을 추천하고 매장 전체에 적용.
//   2) 카메라별 내 매장 AI 설정 — 감지 종류·영역·시간·알림/민감도(고급)까지 조정.
//   ROI/영역은 RoiPreview 공용 컴포넌트로 그린다.
//   ※ 기기 기본설정(시스템·네트워크·영상 등)은 [카메라 관리]에서 다룬다.
import { useEffect, useMemo, useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { RoiPreview } from '@/components/RoiPreview';
import type { AlgorithmSensitivity, CameraAlgorithm, ZonePoint, ZonePolygon } from '@/types';
import page from './Page.module.css';
import styles from './AiSafety.module.css';

// 비-화재 AI 이벤트는 카메라당 1종만 동시 동작 (PPTX V0.76: 'AI 감지 1개 + 화재 감시'). 화재는 독립적으로 함께 켤 수 있다.
const EXCLUSIVE_AI = new Set(['intrusion', 'loitering', 'virtual_fence', 'parking', 'people_counting']);
const ROI_ALGOS = new Set(['intrusion', 'loitering', 'virtual_fence', 'privacy']);

type NotifyLevel = 'instant' | 'min1' | 'min5' | 'none';

interface ExtraCfg {
  notify: NotifyLevel;
  schedule: 'always' | 'custom';
  person: boolean;
  vehicle: boolean;
}

const DEFAULT_EXTRA: ExtraCfg = { notify: 'instant', schedule: 'always', person: true, vehicle: false };

const ICONS: Record<string, string> = {
  motion: 'M3 12h4l3-8 4 16 3-8h4',
  privacy: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM1 1l22 22',
  intrusion: 'M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4zM9 12l2 2 4-4',
  loitering: 'M12 7a4 4 0 1 0 0-4 4 4 0 0 0 0 4zM6 21v-2a6 6 0 0 1 12 0v2M12 12v3',
  virtual_fence: 'M4 4v16M4 6h14l-3 3 3 3H4',
  fire: 'M12 2s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3 1-3s4 2 4-6z',
  parking: 'M5 11l1.4-4.2A2 2 0 0 1 8.3 5h7.4a2 2 0 0 1 1.9 1.8L19 11M5 11h14v5H5zM7 16v2M17 16v2',
  people_counting: 'M9 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1M17 10l2 2 4-4',
};

function Glyph({ algoKey }: { algoKey: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={ICONS[algoKey] ?? 'M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z'} />
    </svg>
  );
}

function Switch({ on, onToggle, disabled = false }: { on: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <div
      className={[page.switch, on ? page.switchOn : ''].filter(Boolean).join(' ')}
      role="switch"
      aria-checked={on}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={(e) => { e.stopPropagation(); if (!disabled) onToggle(); }}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); onToggle(); }
      }}
      style={disabled ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
    >
      <span className={page.switchThumb} />
    </div>
  );
}

/* ===== 추천 엔진 ===== */

interface Opt {
  value: string;
  label: string;
}

const INDUSTRIES: Opt[] = [
  { value: 'cvs', label: '편의점' },
  { value: 'cafe', label: '카페' },
  { value: 'restaurant', label: '음식점' },
  { value: 'retail', label: '소매·판매점' },
  { value: 'office', label: '사무실' },
  { value: 'etc', label: '기타' },
];

const HOURS: Opt[] = [
  { value: '24h', label: '24시간 영업' },
  { value: 'day', label: '주간 (09–18시)' },
  { value: 'night', label: '야간 (18–09시)' },
  { value: 'custom', label: '맞춤 운영' },
];

const WORRIES: { value: string; label: string; algoKeys: string[] }[] = [
  { value: 'intrusion', label: '무단 침입·도난', algoKeys: ['intrusion'] },
  { value: 'afterhours', label: '영업 외 시간 출입', algoKeys: ['intrusion'] },
  { value: 'loiter', label: '배회·서성임', algoKeys: ['loitering'] },
  { value: 'crossing', label: '경계선 침범', algoKeys: ['virtual_fence'] },
  { value: 'fire', label: '화재·연기', algoKeys: ['fire'] },
  { value: 'parking', label: '불법 주정차', algoKeys: ['parking'] },
  { value: 'counting', label: '방문객 수 집계', algoKeys: ['people_counting'] },
  { value: 'privacy', label: '사생활 보호', algoKeys: ['privacy'] },
  { value: 'movement', label: '상시 움직임 기록', algoKeys: ['motion'] },
];

const INDUSTRY_DEFAULT: Record<string, string[]> = {
  cvs: ['intrusion', 'fire'],
  cafe: ['loitering', 'privacy'],
  restaurant: ['fire', 'motion'],
  retail: ['intrusion', 'loitering'],
  office: ['intrusion', 'virtual_fence'],
  etc: ['motion'],
};

const ALGO_LABEL: Record<string, string> = {
  motion: '움직임 감지',
  privacy: '프라이버시 마스크',
  intrusion: '침입 감지',
  loitering: '배회 감지',
  virtual_fence: '가상 펜스',
  fire: '화재 감지',
  parking: '주정차 감시',
  people_counting: '피플카운팅',
};

interface RecItem {
  algoKey: string;
  label: string;
  reason: string;
}

const SENS_OPTS: { value: AlgorithmSensitivity; title: string; desc: string }[] = [
  { value: 'low', title: '덜 민감하게', desc: '오탐을 줄여요' },
  { value: 'balanced', title: '균형 (추천)', desc: '권장 설정' },
  { value: 'high', title: '더 민감하게', desc: '작은 변화도 감지' },
];

const NOTIFY_OPTS: { value: NotifyLevel; label: string }[] = [
  { value: 'instant', label: '즉시 알림' },
  { value: 'min1', label: '1분 간격 알림' },
  { value: 'min5', label: '5분 간격 알림' },
  { value: 'none', label: '알림 없음' },
];

type SubTab = 'my-store' | 'recommend';

export default function AiSafety() {
  const cameras = useDataStore((s) => s.cameras);
  const algorithms = useDataStore((s) => s.algorithms);
  const patchAlgorithm = useDataStore((s) => s.patchAlgorithm);
  const addAlgorithmPolygon = useDataStore((s) => s.addAlgorithmPolygon);
  const removeAlgorithmPolygon = useDataStore((s) => s.removeAlgorithmPolygon);
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<SubTab>('my-store');

  // 추천 입력
  const [industry, setIndustry] = useState('cvs');
  const [hours, setHours] = useState('night');
  const [worries, setWorries] = useState<string[]>(['intrusion', 'fire']);

  // 카메라/카드 상태
  const tabCams = useMemo(() => cameras.slice(0, 5), [cameras]);
  const [activeCamId, setActiveCamId] = useState(tabCams[0]?.id ?? '');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [extras, setExtras] = useState<Record<string, ExtraCfg>>({});

  const cam = cameras.find((c) => c.id === activeCamId);
  const camAlgos = useMemo(() => algorithms.filter((a) => a.cameraId === activeCamId), [algorithms, activeCamId]);
  const basicAlgos = camAlgos.filter((a) => a.kind === 'basic');
  const aiAlgos = camAlgos.filter((a) => a.kind === 'ai');
  // 비-화재 AI 이벤트는 카메라당 1종만 동작 (화재는 별도). 켜져 있는 1종(없으면 null).
  const activeExclusive = aiAlgos.find((a) => a.enabled && EXCLUSIVE_AI.has(a.algoKey)) ?? null;

  const videoIdx = useMemo(() => {
    const idx = cameras.findIndex((c) => c.id === activeCamId);
    return ((idx < 0 ? 0 : idx) % 6) + 1;
  }, [cameras, activeCamId]);

  useEffect(() => {
    setExpandedId(null);
    setDrawMode(false);
  }, [activeCamId]);

  // 추천 결과 계산
  const recommended: RecItem[] = useMemo(() => {
    const reason = new Map<string, string>();
    for (const w of worries) {
      const def = WORRIES.find((x) => x.value === w);
      def?.algoKeys.forEach((k) => { if (!reason.has(k)) reason.set(k, `'${def.label}' 걱정에 맞춘 기능`); });
    }
    (INDUSTRY_DEFAULT[industry] ?? []).forEach((k) => {
      if (!reason.has(k)) reason.set(k, `${INDUSTRIES.find((i) => i.value === industry)?.label} 업종 기본 추천`);
    });
    if (hours === 'night') {
      ['intrusion', 'loitering'].forEach((k) => { if (!reason.has(k)) reason.set(k, '야간 운영 시 권장'); });
    } else if (hours === '24h') {
      if (!reason.has('motion')) reason.set('motion', '24시간 운영 시 권장');
    }
    return [...reason.entries()].map(([algoKey, r]) => ({ algoKey, label: ALGO_LABEL[algoKey] ?? algoKey, reason: r }));
  }, [industry, hours, worries]);

  if (!cam) return <div className={page.page}>카메라가 없습니다.</div>;
  const offline = cam.status === 'offline';

  const toggleWorry = (v: string) =>
    setWorries((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const getExtra = (id: string): ExtraCfg => extras[id] ?? DEFAULT_EXTRA;
  const patchExtra = (id: string, patch: Partial<ExtraCfg>) =>
    setExtras((s) => ({ ...s, [id]: { ...getExtra(id), ...patch } }));

  function applyRecommendation() {
    const recKeys = recommended.map((r) => r.algoKey);
    if (recKeys.length === 0) {
      toast.info('추천 결과 없음', '걱정되는 상황을 선택하면 맞춤 기능을 추천해 드려요.');
      return;
    }
    let skipped = false;
    cameras.forEach((c) => {
      const list = algorithms.filter((a) => a.cameraId === c.id);
      let exclusiveTaken = list.some((a) => a.enabled && EXCLUSIVE_AI.has(a.algoKey));
      recKeys.forEach((key) => {
        const a = list.find((x) => x.algoKey === key);
        if (!a || a.enabled) return;
        if (EXCLUSIVE_AI.has(a.algoKey)) {
          if (exclusiveTaken) { skipped = true; return; }
          exclusiveTaken = true;
        }
        patchAlgorithm(a.cameraId, a.id, { enabled: true });
      });
    });
    toast.success(
      '추천 안심 설정 적용',
      skipped
        ? '매장 카메라에 적용했어요. 카메라당 AI 이벤트 1종 제한으로 일부는 제외됐어요.'
        : '추천 기능을 매장 카메라 전체에 적용했어요.',
    );
  }

  // 토글
  const handleToggle = (a: CameraAlgorithm) => {
    // 비-화재 AI 이벤트는 단일 선택: 다른 이벤트가 켜져 있으면 라디오처럼 전환한다.
    if (!a.enabled && EXCLUSIVE_AI.has(a.algoKey) && activeExclusive && activeExclusive.id !== a.id) {
      patchAlgorithm(activeExclusive.cameraId, activeExclusive.id, { enabled: false });
      patchAlgorithm(a.cameraId, a.id, { enabled: true });
      toast.info('AI 이벤트 전환', `'${activeExclusive.label}' → '${a.label}'. 카메라당 AI 이벤트는 1종만 동작해요 (화재 제외).`);
      return;
    }
    patchAlgorithm(a.cameraId, a.id, { enabled: !a.enabled });
    if (a.enabled && expandedId === a.id) { setExpandedId(null); setDrawMode(false); }
  };

  // ROI 핸들러 (확장된 카드 기준)
  const roiAlgo = expandedId ? camAlgos.find((a) => a.id === expandedId && ROI_ALGOS.has(a.algoKey)) ?? null : null;
  const handleDrawComplete = (polygon: Omit<ZonePolygon, 'id'>) => {
    if (!roiAlgo || polygon.points.length < 3) return;
    addAlgorithmPolygon(roiAlgo.cameraId, roiAlgo.id, polygon);
    setDrawMode(false);
    toast.success('영역 추가됨', `${roiAlgo.label} · ${polygon.points.length}개 vertex`);
  };
  const handlePolygonRemove = (algoId: string, polygonId: string) => {
    removeAlgorithmPolygon(activeCamId, algoId, polygonId);
    toast.info('영역 삭제됨', '');
  };
  const handlePolygonUpdate = (algoId: string, polygonId: string, points: ZonePoint[]) => {
    const a = camAlgos.find((x) => x.id === algoId);
    if (!a) return;
    const next = (a.polygons ?? []).map((p) => (p.id === polygonId ? { ...p, points } : p));
    patchAlgorithm(a.cameraId, algoId, { polygons: next });
  };

  const previewAlgos = camAlgos.filter((a) => a.enabled && ROI_ALGOS.has(a.algoKey));

  const renderCard = (a: CameraAlgorithm) => {
    const open = expandedId === a.id;
    const extra = getExtra(a.id);
    const usesRoi = ROI_ALGOS.has(a.algoKey);
    const polys = a.polygons ?? [];
    const cls = [
      styles.algoCard,
      a.enabled ? styles.algoCardActive : '',
      open ? styles.algoCardSelected : '',
    ].filter(Boolean).join(' ');

    return (
      <div key={a.id} className={cls}>
        <div
          className={styles.algoHeader}
          role="button"
          tabIndex={0}
          style={{ cursor: 'pointer' }}
          onClick={() => { setExpandedId(open ? null : a.id); setDrawMode(false); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedId(open ? null : a.id); }
          }}
        >
          <div className={styles.algoIcon} aria-hidden><Glyph algoKey={a.algoKey} /></div>
          <div className={styles.algoTitleBox}>
            <span className={styles.algoLabel}>{a.label}</span>
            <span className={styles.algoDesc}>{a.desc}</span>
          </div>
          <div className={styles.algoSwitchWrap}>
            <Switch on={a.enabled} onToggle={() => handleToggle(a)} />
            {a.enabled && (
              <span className={[styles.algoChevron, open ? styles.algoChevronOpen : ''].filter(Boolean).join(' ')} aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            )}
          </div>
        </div>

        {a.enabled && open && (
          <div className={styles.algoBody}>
            {/* 감지 종류 */}
            {a.kind === 'ai' && a.algoKey !== 'fire' && (
              <div className={styles.algoField}>
                <span className={styles.algoFieldLabel}>감지 종류</span>
                <div className={page.chips}>
                  <button
                    type="button"
                    className={[page.chip, extra.person ? page.chipActive : ''].filter(Boolean).join(' ')}
                    onClick={() => patchExtra(a.id, { person: !extra.person })}
                  >
                    사람
                  </button>
                  <button
                    type="button"
                    className={[page.chip, extra.vehicle ? page.chipActive : ''].filter(Boolean).join(' ')}
                    onClick={() => patchExtra(a.id, { vehicle: !extra.vehicle })}
                  >
                    자동차
                  </button>
                  <span className={styles.recRowHint}>소동물은 자동 제외</span>
                </div>
              </div>
            )}

            {/* 감지 영역 */}
            <div className={styles.algoField}>
              <span className={styles.algoFieldLabel}>감지 영역</span>
              {usesRoi ? (
                <div className={styles.zoneList}>
                  {polys.length === 0 && <span className={styles.zoneEmpty}>설정된 영역 없음</span>}
                  {polys.map((poly, i) => (
                    <button
                      key={poly.id}
                      type="button"
                      className={styles.zoneChip}
                      onClick={() => handlePolygonRemove(a.id, poly.id)}
                      title="클릭하여 삭제"
                    >
                      <span>영역{i + 1} · {poly.points.length}점</span>
                      <span className={styles.zoneChipX} aria-hidden>×</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    className={styles.zoneAddBtn}
                    disabled={drawMode}
                    onClick={() => { setExpandedId(a.id); setDrawMode(true); }}
                  >
                    + 영역 그리기
                  </button>
                </div>
              ) : (
                <span className={styles.zoneEmpty}>전체 화면 (자동 설정)</span>
              )}
            </div>

            {/* 감지 시간 */}
            <div className={styles.algoField}>
              <span className={styles.algoFieldLabel}>감지 시간</span>
              <div className={page.chips}>
                <button
                  type="button"
                  className={[page.chip, extra.schedule === 'always' ? page.chipActive : ''].filter(Boolean).join(' ')}
                  onClick={() => patchExtra(a.id, { schedule: 'always' })}
                >
                  항상
                </button>
                <button
                  type="button"
                  className={[page.chip, extra.schedule === 'custom' ? page.chipActive : ''].filter(Boolean).join(' ')}
                  onClick={() => patchExtra(a.id, { schedule: 'custom' })}
                >
                  예약
                </button>
              </div>
              {extra.schedule === 'custom' && <span className={styles.schedTime}>월–일 · 00:00 – 24:00</span>}
            </div>

            {/* 알림 단계 (고급) */}
            <div className={styles.algoField}>
              <span className={styles.algoFieldLabel}>알림 단계</span>
              <select
                className={page.settingsSelect}
                value={extra.notify}
                onChange={(e) => patchExtra(a.id, { notify: e.target.value as NotifyLevel })}
              >
                {NOTIFY_OPTS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* 민감도 (고급) */}
            <div className={styles.algoField}>
              <span className={styles.algoFieldLabel}>민감도</span>
              <div className={styles.radioRow}>
                {SENS_OPTS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    className={[styles.radioOpt, a.sensitivity === s.value ? styles.radioOptActive : ''].filter(Boolean).join(' ')}
                    onClick={() => patchAlgorithm(a.cameraId, a.id, { sensitivity: s.value })}
                  >
                    <span className={styles.radioOptTitle}>{s.title}</span>
                    <span className={styles.radioOptDesc}>{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={page.page}>
      {/* ===== 서브 탭 칩 ===== */}
      <div className={styles.subNavRow}>
        <button
          type="button"
          className={[styles.subChip, activeTab === 'my-store' ? styles.subChipActive : ''].filter(Boolean).join(' ')}
          onClick={() => setActiveTab('my-store')}
        >
          내 매장 AI설정
        </button>
        <button
          type="button"
          className={[styles.subChip, activeTab === 'recommend' ? styles.subChipActive : ''].filter(Boolean).join(' ')}
          onClick={() => setActiveTab('recommend')}
        >
          추천 안심 설정
        </button>
      </div>

      {/* ===== 내 매장 AI 설정 ===== */}
      {activeTab === 'my-store' && (
        <>
          <Tabs
            tabs={tabCams.map((c) => ({ key: c.id, label: c.name.split(' ')[0] }))}
            active={activeCamId}
            onChange={setActiveCamId}
          />

          <div className={page.algoLayout}>
            <div className={page.algoLeft}>
              <RoiPreview
                camName={cam.name}
                camStatus={cam.status}
                videoIdx={videoIdx}
                offline={offline}
                algos={previewAlgos}
                activeAlgoId={roiAlgo?.id ?? null}
                drawMode={drawMode}
                onDrawComplete={handleDrawComplete}
                onPolygonRemove={handlePolygonRemove}
                onPolygonUpdate={handlePolygonUpdate}
                onCancelDraw={() => setDrawMode(false)}
              />
            </div>

            <div className={page.algoRight}>
              <div className={styles.algoBanner} role="status">
                <span>카메라당 AI 이벤트는 1종만 동작하고, 화재 감지는 함께 켤 수 있어요</span>
                <span className={styles.algoBannerCount}>
                  {activeExclusive ? `${activeExclusive.label} 동작 중` : 'AI 이벤트 꺼짐'}
                </span>
              </div>

              <Card title="기본 안심 기능">
                <div className={styles.algoGrid}>{basicAlgos.map(renderCard)}</div>
              </Card>

              <Card title="AI 특화 기능">
                <div className={styles.algoGrid}>{aiAlgos.map(renderCard)}</div>
              </Card>
            </div>
          </div>

          <Card>
            <div className={styles.notice}>
              <span className={styles.noticeIcon} aria-hidden>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8h.01M11 12h1v4h1" />
                </svg>
              </span>
              <span>
                카메라 기기 설정(시스템·네트워크·영상·OSD 등)은 <b>카메라 관리</b>에서 다룹니다.
                설치나 화각 조정이 필요하면 에스원에 도움을 요청하세요.
              </span>
            </div>
          </Card>
        </>
      )}

      {/* ===== 추천 안심 설정 ===== */}
      {activeTab === 'recommend' && (
        <Card title="맞춤 추천 안심 설정">
          <div className={styles.recPanel}>
            <div className={styles.recRow}>
              <span className={styles.recRowLabel}>업종</span>
              <div className={page.chips}>
                {INDUSTRIES.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    className={[page.chip, industry === o.value ? page.chipActive : ''].filter(Boolean).join(' ')}
                    onClick={() => setIndustry(o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.recRow}>
              <span className={styles.recRowLabel}>운영 시간</span>
              <div className={page.chips}>
                {HOURS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    className={[page.chip, hours === o.value ? page.chipActive : ''].filter(Boolean).join(' ')}
                    onClick={() => setHours(o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.recRow}>
              <span className={styles.recRowLabel}>
                걱정되는 상황<span className={styles.recRowHint}>여러 개 선택 가능</span>
              </span>
              <div className={page.chips}>
                {WORRIES.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    className={[page.chip, worries.includes(o.value) ? page.chipActive : ''].filter(Boolean).join(' ')}
                    onClick={() => toggleWorry(o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.recResult}>
              <div className={styles.recResultHead}>
                <span className={styles.recResultTitle}>추천 안심 기능 {recommended.length > 0 && `(${recommended.length})`}</span>
                <Button variant="primary" size="sm" onClick={applyRecommendation} disabled={recommended.length === 0}>
                  추천 설정 적용
                </Button>
              </div>
              {recommended.length === 0 ? (
                <div className={styles.recEmpty}>걱정되는 상황을 선택하면 맞춤 안심 기능을 추천해 드려요.</div>
              ) : (
                <div className={styles.recList}>
                  {recommended.map((r) => (
                    <div key={r.algoKey} className={styles.recItem}>
                      <div className={styles.recItemIcon} aria-hidden><Glyph algoKey={r.algoKey} /></div>
                      <div className={styles.recItemText}>
                        <div className={styles.recItemLabel}>{r.label}</div>
                        <div className={styles.recItemReason}>{r.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
