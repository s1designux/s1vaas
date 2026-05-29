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
import { Select } from '@/components/ui/Select';
import { Toggle } from '@/components/ui/Toggle';
import { RoiPreview } from '@/components/RoiPreview';
import type { AlgorithmSensitivity, CameraAlgorithm, ZonePoint, ZonePolygon } from '@/types';
import page from './Page.module.css';
import styles from './AiSafety.module.css';
import cs from './CameraSettings.module.css';

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

type ScenarioKey = 'afterClose' | 'operating' | 'atOpen' | 'atClose' | 'holiday';

const SCENARIO_CONCERNS: { value: string; label: string; algoKey: string }[] = [
  { value: 'intrusion', label: '침입·도난', algoKey: 'intrusion' },
  { value: 'loiter',    label: '배회·서성임', algoKey: 'loitering' },
  { value: 'fence',     label: '경계선 침범', algoKey: 'virtual_fence' },
  { value: 'fire',      label: '화재·연기', algoKey: 'fire' },
  { value: 'parking',   label: '불법 주정차', algoKey: 'parking' },
  { value: 'counting',  label: '방문객 수', algoKey: 'people_counting' },
  { value: 'privacy',   label: '사생활 보호', algoKey: 'privacy' },
  { value: 'motion',    label: '움직임 기록', algoKey: 'motion' },
];

const SCENARIO_META: { key: ScenarioKey; label: string; emoji: string; desc: string }[] = [
  { key: 'afterClose', label: '마감 이후', emoji: '🌙', desc: '마감 후 다음 오픈 전까지' },
  { key: 'operating',  label: '운영 중',   emoji: '☀️', desc: '오픈~마감 영업 시간' },
  { key: 'atOpen',     label: '오픈 시',   emoji: '🌅', desc: '오픈 전후 ±1시간' },
  { key: 'atClose',    label: '마감 시',   emoji: '🌆', desc: '마감 전후 ±1시간' },
  { key: 'holiday',    label: '휴일 시',   emoji: '📅', desc: '선택한 휴일 하루 종일' },
];

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

// ── 감지 일정 ──
type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
interface ScheduleSlot { id: string; startH: number; endH: number; days: DayKey[]; algoIds: string[]; }

const DAY_LIST: { key: DayKey; label: string }[] = [
  { key: 'mon', label: '월' }, { key: 'tue', label: '화' }, { key: 'wed', label: '수' },
  { key: 'thu', label: '목' }, { key: 'fri', label: '금' }, { key: 'sat', label: '토' }, { key: 'sun', label: '일' },
];
const ALL_DAYS: DayKey[] = ['mon','tue','wed','thu','fri','sat','sun'];
const WEEKDAYS: DayKey[] = ['mon','tue','wed','thu','fri'];
const WEEKENDS: DayKey[] = ['sat','sun'];

const ALGO_COLORS: Record<string, string> = {
  intrusion: '#3B82F6', fire: '#EF4444', loitering: '#8B5CF6',
  parking: '#10B981', people_counting: '#06B6D4', motion: '#9CA3AF', virtual_fence: '#F59E0B',
};
const SCHED_ALGOS: { id: string; label: string }[] = [
  { id: 'intrusion', label: '침입 감지' }, { id: 'fire', label: '화재 감지' },
  { id: 'loitering', label: '배회 감지' }, { id: 'parking', label: '주정차 감시' },
  { id: 'people_counting', label: '피플카운팅' }, { id: 'motion', label: '움직임 감지' },
  { id: 'virtual_fence', label: '가상 펜스' },
];
const SAMPLE_SCHED: ScheduleSlot[] = [
  { id: 'ss1', startH: 22, endH: 7,  days: ALL_DAYS, algoIds: ['intrusion','fire'] },
  { id: 'ss2', startH: 7,  endH: 20, days: ALL_DAYS, algoIds: ['parking','people_counting'] },
  { id: 'ss3', startH: 20, endH: 22, days: ALL_DAYS, algoIds: ['loitering'] },
];

function fmtH(h: number) { return `${String(h % 24).padStart(2,'0')}:00`; }
function fmtDays(days: DayKey[]) {
  if (days.length === 7) return '매일';
  if (days.length === 5 && WEEKDAYS.every(d => days.includes(d))) return '평일';
  if (days.length === 2 && WEEKENDS.every(d => days.includes(d))) return '주말';
  return days.map(d => DAY_LIST.find(x => x.key === d)?.label ?? '').join('·');
}

function ScheduleSection({ slots, onAdd, onDelete }: {
  slots: ScheduleSlot[];
  onAdd: (s: Omit<ScheduleSlot,'id'>) => void;
  onDelete: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Omit<ScheduleSlot,'id'>>({ startH: 22, endH: 7, days: ALL_DAYS, algoIds: [] });
  const patch = (p: Partial<Omit<ScheduleSlot,'id'>>) => setForm(prev => ({ ...prev, ...p }));

  const toggleAlgo = (id: string) =>
    patch({ algoIds: form.algoIds.includes(id) ? form.algoIds.filter(x => x !== id) : [...form.algoIds, id] });
  const toggleDay = (d: DayKey) =>
    patch({ days: form.days.includes(d) ? form.days.filter(x => x !== d) : [...form.days, d] });

  const handleSave = () => {
    if (!form.algoIds.length || !form.days.length) return;
    onAdd(form);
    setAdding(false);
    setForm({ startH: 22, endH: 7, days: ALL_DAYS, algoIds: [] });
  };

  const START_H = Array.from({ length: 24 }, (_, i) => i);
  const END_H   = Array.from({ length: 24 }, (_, i) => i + 1);

  // 타임라인 세그먼트
  const segments = slots.flatMap(s => {
    const c = ALGO_COLORS[s.algoIds[0]] ?? '#9CA3AF';
    if (s.endH > s.startH)
      return [{ left: s.startH / 24 * 100, w: (s.endH - s.startH) / 24 * 100, c, key: s.id }];
    return [
      { left: s.startH / 24 * 100, w: (24 - s.startH) / 24 * 100, c, key: `${s.id}a` },
      { left: 0, w: s.endH / 24 * 100, c, key: `${s.id}b` },
    ];
  });

  const dEq = (a: DayKey[], b: DayKey[]) => [...a].sort().join() === [...b].sort().join();

  return (
    <Card title="감지 일정">
      {/* 24h 타임라인 바 */}
      <div className={styles.schedBar}>
        <div className={styles.schedBarTrack}>
          {segments.length === 0 && <div className={styles.schedBarEmpty} />}
          {segments.map(seg => (
            <div key={seg.key} className={styles.schedBarSeg}
              style={{ left: `${seg.left}%`, width: `${seg.w}%`, background: seg.c }} />
          ))}
        </div>
        <div className={styles.schedBarTicks}>
          {[0, 6, 12, 18, 24].map(h => (
            <span key={h} className={styles.schedBarTick} style={{ left: `${h / 24 * 100}%` }}>
              {String(h).padStart(2,'0')}
            </span>
          ))}
        </div>
      </div>

      {/* 슬롯 목록 */}
      <div className={styles.schedList}>
        {slots.length === 0 && <p className={styles.schedEmpty}>설정된 감지 일정이 없습니다. 아래 '일정 추가'를 눌러 시작하세요.</p>}
        {slots.map(slot => (
          <div key={slot.id} className={styles.schedSlot}>
            <div className={styles.schedSlotDot} style={{ background: ALGO_COLORS[slot.algoIds[0]] ?? '#9CA3AF' }} />
            <div className={styles.schedSlotMeta}>
              <span className={styles.schedSlotTime}>
                {fmtH(slot.startH)} ~ {fmtH(slot.endH)}
                {slot.endH < slot.startH && <span className={styles.schedNextDay}> +1일</span>}
              </span>
              <span className={styles.schedSlotDays}>{fmtDays(slot.days)}</span>
            </div>
            <div className={styles.schedSlotAlgos}>
              {slot.algoIds.map(id => (
                <span key={id} className={styles.schedAlgoChip}
                  style={{ background: `${ALGO_COLORS[id] ?? '#9CA3AF'}18`, color: ALGO_COLORS[id] ?? '#9CA3AF', borderColor: `${ALGO_COLORS[id] ?? '#9CA3AF'}44` }}>
                  {SCHED_ALGOS.find(a => a.id === id)?.label ?? id}
                </span>
              ))}
            </div>
            <button className={styles.schedDeleteBtn} onClick={() => onDelete(slot.id)} title="삭제">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {adding ? (
        <div className={styles.schedForm}>
          {/* 시간 */}
          <div className={styles.schedFormRow}>
            <span className={styles.schedFormLabel}>시간</span>
            <div className={styles.schedFormTimeRow}>
              <select className={styles.schedTimeSelect} value={form.startH} onChange={e => patch({ startH: +e.target.value })}>
                {START_H.map(h => <option key={h} value={h}>{fmtH(h)}</option>)}
              </select>
              <span className={styles.schedTimeTilde}>~</span>
              <select className={styles.schedTimeSelect} value={form.endH} onChange={e => patch({ endH: +e.target.value })}>
                {END_H.map(h => <option key={h} value={h}>{fmtH(h)}</option>)}
              </select>
              {form.endH <= form.startH && (
                <span className={styles.schedNextDay}>익일 {fmtH(form.endH)}에 종료</span>
              )}
            </div>
          </div>

          {/* 요일 */}
          <div className={styles.schedFormRow}>
            <span className={styles.schedFormLabel}>요일</span>
            <div className={styles.schedFormDaysRow}>
              {[
                { label: '매일', days: ALL_DAYS },
                { label: '평일', days: WEEKDAYS },
                { label: '주말', days: WEEKENDS },
              ].map(p => (
                <button key={p.label}
                  className={[styles.schedPresetBtn, dEq(form.days, p.days) ? styles.schedPresetBtnActive : ''].filter(Boolean).join(' ')}
                  onClick={() => patch({ days: p.days })}>
                  {p.label}
                </button>
              ))}
              <span className={styles.schedDaySep} />
              {DAY_LIST.map(d => (
                <button key={d.key}
                  className={[styles.schedDayBtn, form.days.includes(d.key) ? styles.schedDayBtnActive : ''].filter(Boolean).join(' ')}
                  onClick={() => toggleDay(d.key)}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* 감지 기능 */}
          <div className={styles.schedFormRow}>
            <span className={styles.schedFormLabel}>감지 기능</span>
            <div className={styles.schedFormAlgosRow}>
              {SCHED_ALGOS.map(a => {
                const active = form.algoIds.includes(a.id);
                return (
                  <button key={a.id}
                    className={[styles.schedAlgoBtn, active ? styles.schedAlgoBtnActive : ''].filter(Boolean).join(' ')}
                    style={active ? { background: `${ALGO_COLORS[a.id]}15`, borderColor: ALGO_COLORS[a.id], color: ALGO_COLORS[a.id] } : {}}
                    onClick={() => toggleAlgo(a.id)}>
                    {a.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.schedFormActions}>
            <button className={styles.schedSaveBtn} disabled={!form.algoIds.length || !form.days.length} onClick={handleSave}>저장</button>
            <button className={styles.schedCancelBtn} onClick={() => setAdding(false)}>취소</button>
          </div>
        </div>
      ) : (
        <button className={styles.schedAddBtn} onClick={() => setAdding(true)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          일정 추가
        </button>
      )}
    </Card>
  );
}

export default function AiSafety() {
  const cameras = useDataStore((s) => s.cameras);
  const sites    = useDataStore((s) => s.sites);
  const contracts = useDataStore((s) => s.contracts);
  const algorithms = useDataStore((s) => s.algorithms);
  const patchAlgorithm = useDataStore((s) => s.patchAlgorithm);
  const addAlgorithmPolygon = useDataStore((s) => s.addAlgorithmPolygon);
  const removeAlgorithmPolygon = useDataStore((s) => s.removeAlgorithmPolygon);
  const toast = useToast();

  const [showRecommendModal, setShowRecommendModal] = useState(false);

  // 추천 입력
  const [industry, setIndustry] = useState('cvs');
  const [openH, setOpenH] = useState(9);
  const [closeH, setCloseH] = useState(22);
  const [holidays, setHolidays] = useState<DayKey[]>([]);
  const [scenarioConcerns, setScenarioConcerns] = useState<Record<ScenarioKey, string[]>>({
    afterClose: ['intrusion', 'fire'],
    operating: ['motion'],
    atOpen: [],
    atClose: [],
    holiday: [],
  });

  // 사이드바 — 계약처·사이트 필터
  const [selectedContractId, setSelectedContractId] = useState<string>(() => contracts[0]?.id ?? '');
  const filteredSites = useMemo(
    () => sites.filter((s) => s.contractId === selectedContractId),
    [sites, selectedContractId],
  );
  const [sidebarOpenSiteId, setSidebarOpenSiteId] = useState<string>(() => filteredSites[0]?.id ?? '');
  useEffect(() => {
    setSidebarOpenSiteId(filteredSites[0]?.id ?? '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContractId]);
  const toggleSiteAccordion = (siteId: string) =>
    setSidebarOpenSiteId((prev) => (prev === siteId ? '' : siteId));

  // 카메라 선택
  const [activeCamId, setActiveCamId] = useState(() => cameras[0]?.id ?? '');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [extras, setExtras] = useState<Record<string, ExtraCfg>>({});
  const [camSchedules, setCamSchedules] = useState<Record<string, ScheduleSlot[]>>(
    () => cameras[0]?.id ? { [cameras[0].id]: SAMPLE_SCHED } : {}
  );
  const schedule = camSchedules[activeCamId] ?? [];
  const addSlot = (s: Omit<ScheduleSlot,'id'>) =>
    setCamSchedules(p => ({ ...p, [activeCamId]: [...(p[activeCamId] ?? []), { ...s, id: `ss${Date.now()}` }] }));
  const deleteSlot = (id: string) =>
    setCamSchedules(p => ({ ...p, [activeCamId]: (p[activeCamId] ?? []).filter(s => s.id !== id) }));

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

  // 시나리오별 걱정 항목 토글
  const toggleScenarioConcern = (scenario: ScenarioKey, concern: string) =>
    setScenarioConcerns((prev) => ({
      ...prev,
      [scenario]: prev[scenario].includes(concern)
        ? prev[scenario].filter((x) => x !== concern)
        : [...prev[scenario], concern],
    }));

  // 타임테이블 자동 생성
  const generatedSlots = useMemo(() => {
    const operatingDays = ALL_DAYS.filter((d) => !holidays.includes(d));
    const getAlgos = (key: ScenarioKey) =>
      [...new Set(
        (scenarioConcerns[key] ?? [])
          .map((v) => SCENARIO_CONCERNS.find((c) => c.value === v)?.algoKey)
          .filter((x): x is string => Boolean(x)),
      )];
    const slots: Omit<ScheduleSlot, 'id'>[] = [];
    const afterCloseAlgos = getAlgos('afterClose');
    if (afterCloseAlgos.length && operatingDays.length)
      slots.push({ startH: closeH, endH: openH, days: operatingDays, algoIds: afterCloseAlgos });
    const operatingAlgos = getAlgos('operating');
    if (operatingAlgos.length && operatingDays.length)
      slots.push({ startH: openH, endH: closeH, days: operatingDays, algoIds: operatingAlgos });
    const atOpenAlgos = getAlgos('atOpen');
    if (atOpenAlgos.length && operatingDays.length)
      slots.push({ startH: Math.max(0, openH - 1), endH: Math.min(24, openH + 1), days: operatingDays, algoIds: atOpenAlgos });
    const atCloseAlgos = getAlgos('atClose');
    if (atCloseAlgos.length && operatingDays.length)
      slots.push({ startH: Math.max(0, closeH - 1), endH: Math.min(24, closeH + 1), days: operatingDays, algoIds: atCloseAlgos });
    const holidayAlgos = getAlgos('holiday');
    if (holidayAlgos.length && holidays.length)
      slots.push({ startH: 0, endH: 24, days: holidays, algoIds: holidayAlgos });
    return slots;
  }, [openH, closeH, holidays, scenarioConcerns]);

  if (!cam) return <div className={page.page}>카메라가 없습니다.</div>;
  const offline = cam.status === 'offline';

  const getExtra = (id: string): ExtraCfg => extras[id] ?? DEFAULT_EXTRA;
  const patchExtra = (id: string, patch: Partial<ExtraCfg>) =>
    setExtras((s) => ({ ...s, [id]: { ...getExtra(id), ...patch } }));

  function applyRecommendation() {
    if (generatedSlots.length === 0) {
      toast.info('생성된 일정 없음', '감지 항목을 선택하면 타임테이블이 자동으로 만들어져요.');
      return;
    }
    cameras.forEach((c) => {
      setCamSchedules((p) => ({
        ...p,
        [c.id]: generatedSlots.map((s, i) => ({ ...s, id: `rec_${c.id}_${i}` })),
      }));
    });
    toast.success(
      '타임테이블 자동 생성',
      `${generatedSlots.length}개 일정을 전체 카메라에 적용했습니다. 상세모드에서 확인하세요.`,
    );
    setShowRecommendModal(false);
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
            <Toggle on={a.enabled} onToggle={() => handleToggle(a)} />
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
              <Select
                size="sm"
                value={extra.notify}
                options={NOTIFY_OPTS.map((o) => ({ value: o.value, label: o.label }))}
                onChange={(v) => patchExtra(a.id, { notify: v as NotifyLevel })}
              />
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
      <div className={styles.aiBodyRow}>
          {/* ── 카메라 트리 사이드바 ── */}
          <aside className={styles.aiSidebar}>
            {/* 계약처 트리거 */}
            <div className={page.sidebarSelect}>
              <svg className={page.sidebarSelectIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <select
                className={page.sidebarSelectNative}
                value={selectedContractId}
                onChange={(e) => setSelectedContractId(e.target.value)}
              >
                {contracts.map((c) => (
                  <option key={c.id} value={c.id}>{c.code} {c.name}</option>
                ))}
              </select>
              <svg className={page.sidebarSelectChevron} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>

            {/* 사이트 아코디언 */}
            {filteredSites.map((site) => {
              const isOpen   = sidebarOpenSiteId === site.id;
              const siteCams = cameras.filter((c) => c.siteId === site.id);
              return (
                <div key={site.id} className={cs.accordionCard}>
                  <button className={cs.accordionHeader} onClick={() => toggleSiteAccordion(site.id)}>
                    <span className={cs.accordionTitle}>
                      {site.name}
                      <span className={cs.accordionCount}>{siteCams.length}</span>
                    </span>
                    <svg
                      className={`${cs.accordionChevron} ${isOpen ? cs.accordionChevronOpen : ''}`}
                      width="24" height="24" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className={cs.accordionList}>
                      {siteCams.map((c) => {
                        const isActive = c.id === activeCamId;
                        const chipCls  = c.status === 'offline' ? cs.statusChipOffline : cs.statusChipOnline;
                        return (
                          <button
                            key={c.id}
                            className={`${cs.accordionItem} ${isActive ? cs.accordionItemActive : ''}`}
                            onClick={() => setActiveCamId(c.id)}
                            title={c.name}
                          >
                            <span className={`${cs.statusChip} ${chipCls}`}>
                              {c.status === 'offline' ? 'OFF' : 'ON'}
                            </span>
                            <span className={cs.itemInfo}>
                              <span className={`${cs.itemName} ${isActive ? cs.itemNameActive : ''}`}>{c.name}</span>
                              <span className={cs.itemStatusText}>{c.status === 'offline' ? '오프라인' : '온라인'}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </aside>

          {/* ── 메인 콘텐츠 ── */}
          <div className={styles.aiMain}>
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
                <div className={styles.algoHeaderRow}>
                  <div className={styles.algoBanner} role="status">
                    <span>카메라당 AI 이벤트는 1종만 동작하고, 화재 감지는 함께 켤 수 있어요</span>
                    <span className={styles.algoBannerCount}>
                      {activeExclusive ? `${activeExclusive.label} 동작 중` : 'AI 이벤트 꺼짐'}
                    </span>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setShowRecommendModal(true)}>
                    추천 안심 설정
                  </Button>
                </div>

                <div className={styles.cardGrid}>
                  <Card title="기본 안심 기능">
                    <div className={styles.algoGrid}>{basicAlgos.map(renderCard)}</div>
                  </Card>

                  <Card title="AI 특화 기능">
                    <div className={styles.algoGrid}>{aiAlgos.map(renderCard)}</div>
                  </Card>
                </div>
              </div>
            </div>

            <ScheduleSection slots={schedule} onAdd={addSlot} onDelete={deleteSlot} />

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
          </div>
        </div>

      {/* ===== 추천 안심 설정 모달 ===== */}
      {showRecommendModal && (
        <>
          <div className={styles.recModalBackdrop} onClick={() => setShowRecommendModal(false)} />
          <div className={styles.recModal}>
            {/* 헤더 */}
            <div className={styles.recModalHead}>
              <span className={styles.recModalTitle}>맞춤 추천 안심 설정</span>
              <button type="button" className={styles.recModalClose} onClick={() => setShowRecommendModal(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 본문 스크롤 영역 */}
            <div className={styles.recModalBody}>
              {/* 업종 */}
              <div className={styles.recSection}>
                <div className={styles.recSectionTitle}>업종</div>
                <div className={page.chips}>
                  {INDUSTRIES.map((o) => (
                    <button key={o.value} type="button"
                      className={[page.chip, industry === o.value ? page.chipActive : ''].filter(Boolean).join(' ')}
                      onClick={() => setIndustry(o.value)}>{o.label}</button>
                  ))}
                </div>
              </div>

              {/* 영업 시간 */}
              <div className={styles.recSection}>
                <div className={styles.recSectionTitle}>영업 시간</div>
                <div className={styles.recTimeRow}>
                  <div className={styles.recTimeField}>
                    <span className={styles.recTimeLabel}>오픈</span>
                    <select className={styles.recTimeSelect} value={openH} onChange={(e) => setOpenH(+e.target.value)}>
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{fmtH(i)}</option>
                      ))}
                    </select>
                  </div>
                  <span className={styles.recTimeSep}>~</span>
                  <div className={styles.recTimeField}>
                    <span className={styles.recTimeLabel}>마감</span>
                    <select className={styles.recTimeSelect} value={closeH} onChange={(e) => setCloseH(+e.target.value)}>
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{fmtH(i + 1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 휴일 */}
              <div className={styles.recSection}>
                <div className={styles.recSectionTitle}>휴일</div>
                <div className={page.chips} style={{ flexWrap: 'wrap' }}>
                  <button type="button"
                    className={[page.chip, holidays.length === 0 ? page.chipActive : ''].filter(Boolean).join(' ')}
                    onClick={() => setHolidays([])}>없음</button>
                  {DAY_LIST.map((d) => (
                    <button key={d.key} type="button"
                      className={[page.chip, holidays.includes(d.key) ? page.chipActive : ''].filter(Boolean).join(' ')}
                      onClick={() => setHolidays((prev) =>
                        prev.includes(d.key) ? prev.filter((x) => x !== d.key) : [...prev, d.key]
                      )}>{d.label}요일</button>
                  ))}
                </div>
              </div>

              {/* 시나리오별 감지 항목 */}
              <div className={styles.recSection}>
                <div className={styles.recSectionTitle}>주요 감지 항목</div>
                <div className={styles.recScenarios}>
                  {SCENARIO_META
                    .filter((s) => s.key !== 'holiday' || holidays.length > 0)
                    .map((scenario) => {
                      const timeLabel = (() => {
                        if (scenario.key === 'afterClose') return `${fmtH(closeH)} ~ ${fmtH(openH)}`;
                        if (scenario.key === 'operating')  return `${fmtH(openH)} ~ ${fmtH(closeH)}`;
                        if (scenario.key === 'atOpen')     return `${fmtH(Math.max(0, openH - 1))} ~ ${fmtH(Math.min(24, openH + 1))}`;
                        if (scenario.key === 'atClose')    return `${fmtH(Math.max(0, closeH - 1))} ~ ${fmtH(Math.min(24, closeH + 1))}`;
                        return '하루 종일';
                      })();
                      return (
                        <div key={scenario.key} className={styles.recScenarioCard}>
                          <div className={styles.recScenarioHead}>
                            <span className={styles.recScenarioEmoji}>{scenario.emoji}</span>
                            <span className={styles.recScenarioLabel}>{scenario.label}</span>
                            <span className={styles.recScenarioTime}>{timeLabel}</span>
                          </div>
                          <div className={styles.recScenarioDesc}>{scenario.desc}</div>
                          <div className={styles.recScenarioConcerns}>
                            {SCENARIO_CONCERNS.map((c) => {
                              const active = scenarioConcerns[scenario.key].includes(c.value);
                              return (
                                <button key={c.value} type="button"
                                  className={[styles.recConcernChip, active ? styles.recConcernChipActive : ''].filter(Boolean).join(' ')}
                                  onClick={() => toggleScenarioConcern(scenario.key, c.value)}>
                                  {c.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* 생성 예정 타임테이블 미리보기 */}
              {generatedSlots.length > 0 && (
                <div className={styles.recPreview}>
                  <div className={styles.recPreviewTitle}>생성될 타임테이블 ({generatedSlots.length}개)</div>
                  {generatedSlots.map((slot, i) => {
                    const scenLabel = SCENARIO_META.find((s) => {
                      if (s.key === 'afterClose') return slot.startH === closeH;
                      if (s.key === 'operating')  return slot.startH === openH && slot.endH === closeH;
                      if (s.key === 'atOpen')     return slot.startH === Math.max(0, openH - 1) && slot.endH !== closeH;
                      if (s.key === 'atClose')    return slot.startH === Math.max(0, closeH - 1);
                      return slot.startH === 0 && slot.endH === 24;
                    });
                    return (
                      <div key={i} className={styles.recPreviewSlot}>
                        <span className={styles.recPreviewEmoji}>{scenLabel?.emoji ?? '📋'}</span>
                        <span className={styles.recPreviewLabel}>{scenLabel?.label ?? '일정'}</span>
                        <span className={styles.recPreviewTime}>{fmtH(slot.startH)} ~ {fmtH(slot.endH)}</span>
                        <span className={styles.recPreviewAlgos}>
                          {slot.algoIds.map((id) => SCHED_ALGOS.find((a) => a.id === id)?.label ?? id).join(' · ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className={styles.recModalFoot}>
              <Button variant="secondary" size="sm" onClick={() => setShowRecommendModal(false)}>닫기</Button>
              <Button variant="primary" size="sm" onClick={applyRecommendation} disabled={generatedSlots.length === 0}>
                타임테이블 적용
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
