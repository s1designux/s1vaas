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

// AI 특화 기능은 동일 시간대에 최대 2개. 기본 안심 기능은 AI 특화와 함께 자유롭게 사용 가능.
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
  { key: 'operating',  label: '운영 중',   emoji: '☀️', desc: '오픈~마감 영업 시간' },
  { key: 'afterClose', label: '마감 이후', emoji: '🌙', desc: '마감 후 다음 오픈 전까지' },
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
interface ScheduleSlot { id: string; startH: number; endH: number; days: DayKey[]; algoIds: string[]; scenarioKey?: ScenarioKey; }

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
  { id: 'ss1', startH: 22, endH: 7,  days: ALL_DAYS, algoIds: ['intrusion','fire'],            scenarioKey: 'afterClose' },
  { id: 'ss2', startH: 7,  endH: 20, days: ALL_DAYS, algoIds: ['parking','people_counting'],   scenarioKey: 'operating' },
  { id: 'ss3', startH: 20, endH: 22, days: ALL_DAYS, algoIds: ['loitering'],                   scenarioKey: 'atClose' },
];

function fmtH(h: number) { return `${String(h % 24).padStart(2,'0')}:00`; }
function fmtDays(days: DayKey[]) {
  if (days.length === 7) return '매일';
  if (days.length === 5 && WEEKDAYS.every(d => days.includes(d))) return '평일';
  if (days.length === 2 && WEEKENDS.every(d => days.includes(d))) return '주말';
  return days.map(d => DAY_LIST.find(x => x.key === d)?.label ?? '').join('·');
}

function ScheduleSection({ slots, onAdd }: {
  slots: ScheduleSlot[];
  onAdd: (s: Omit<ScheduleSlot,'id'>) => void;
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

  const dEq = (a: DayKey[], b: DayKey[]) => [...a].sort().join() === [...b].sort().join();

  // 사용된 알고리즘 목록 (범례용)
  const usedAlgoIds = [...new Set(slots.flatMap(s => s.algoIds))];

  return (
    <Card title="감지 일정">
      {/* 일주일 타임라인 */}
      <div className={styles.weekTimeline}>
        {/* 시간 축 헤더 */}
        <div className={styles.weekTimeHeader}>
          <div className={styles.weekDayLabel} />
          <div className={styles.weekAxis}>
            {[0, 6, 12, 18, 24].map(h => (
              <span key={h} className={styles.weekAxisTick} style={{ left: `${h / 24 * 100}%` }}>
                {String(h).padStart(2, '0')}
              </span>
            ))}
          </div>
        </div>
        {/* 요일 행 */}
        {DAY_LIST.map(({ key, label }) => {
          const daySlots = slots.filter(s => s.days.includes(key));
          return (
            <div key={key} className={styles.weekRow}>
              <div className={styles.weekDayLabel}>{label}</div>
              <div className={styles.weekBar}>
                {daySlots.length === 0 && <div className={styles.weekBarEmpty} />}
                {daySlots.flatMap(slot => {
                  const c = ALGO_COLORS[slot.algoIds[0]] ?? '#9CA3AF';
                  const title = `${fmtH(slot.startH)}~${fmtH(slot.endH)}: ${slot.algoIds.map(id => SCHED_ALGOS.find(a => a.id === id)?.label ?? id).join(', ')}`;
                  if (slot.endH > slot.startH) {
                    return [<div key={slot.id} className={styles.weekSlot} title={title}
                      style={{ left: `${slot.startH / 24 * 100}%`, width: `${(slot.endH - slot.startH) / 24 * 100}%`, background: c }} />];
                  }
                  return [
                    <div key={`${slot.id}a`} className={styles.weekSlot} title={title}
                      style={{ left: `${slot.startH / 24 * 100}%`, width: `${(24 - slot.startH) / 24 * 100}%`, background: c }} />,
                    <div key={`${slot.id}b`} className={styles.weekSlot} title={title}
                      style={{ left: '0%', width: `${slot.endH / 24 * 100}%`, background: c }} />,
                  ];
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 알고리즘 색상 범례 */}
      {usedAlgoIds.length > 0 && (
        <div className={styles.schedLegend}>
          {usedAlgoIds.map(id => (
            <div key={id} className={styles.schedLegendItem}>
              <span className={styles.schedLegendDot} style={{ background: ALGO_COLORS[id] ?? '#9CA3AF' }} />
              <span className={styles.schedLegendLabel}>{SCHED_ALGOS.find(a => a.id === id)?.label ?? id}</span>
            </div>
          ))}
        </div>
      )}

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
  const [detailMode, setDetailMode] = useState(false);
  // 추천 모달: 1=시나리오 설정, 2=카메라×슬롯 매트릭스
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [activeSlotIdx, setActiveSlotIdx] = useState(0);
  // step2Selection[slotIdx][cameraId] = 활성 algoId 배열
  const [step2Selection, setStep2Selection] = useState<Record<number, Record<string, string[]>>>({});
  // 메인 화면 슬롯 탭 (카메라별 적용된 schedule)
  const [activeMainSlotIdx, setActiveMainSlotIdx] = useState(0);

  // 온보딩 — 최초 방문 시 초기 세팅 화면 표시
  const [isOnboarded, setIsOnboarded] = useState(() =>
    localStorage.getItem('ai-safety-onboarded') === '1',
  );
  const [onboardStep, setOnboardStep] = useState(0); // 0~2

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
  const [scenarioExpanded, setScenarioExpanded] = useState<Record<ScenarioKey, boolean>>({
    afterClose: true,
    operating: true,
    atOpen: false,
    atClose: false,
    holiday: false,
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

  const cam = cameras.find((c) => c.id === activeCamId);
  const camAlgos = useMemo(() => algorithms.filter((a) => a.cameraId === activeCamId), [algorithms, activeCamId]);
  const basicAlgos = camAlgos.filter((a) => a.kind === 'basic');
  const aiAlgos = camAlgos.filter((a) => a.kind === 'ai');

  // 메인 슬롯 탭 — 활성 슬롯이 있으면 그 algoIds로 카드/칩 분리, 없으면 enabled 기준
  const safeMainSlotIdx = Math.min(activeMainSlotIdx, Math.max(0, schedule.length - 1));
  const activeMainSlot = schedule[safeMainSlotIdx] ?? null;
  const algoKeysInActiveSlot = useMemo(
    () => new Set(activeMainSlot?.algoIds ?? []),
    [activeMainSlot],
  );
  const isAlgoVisible = (a: CameraAlgorithm) =>
    activeMainSlot ? algoKeysInActiveSlot.has(a.algoKey) : a.enabled;
  const visibleBasicAlgos = basicAlgos.filter(isAlgoVisible);
  const hiddenBasicAlgos = basicAlgos.filter((a) => !isAlgoVisible(a));
  const visibleAiAlgos = aiAlgos.filter(isAlgoVisible);
  const hiddenAiAlgos = aiAlgos.filter((a) => !isAlgoVisible(a));

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
      slots.push({ startH: closeH, endH: openH, days: operatingDays, algoIds: afterCloseAlgos, scenarioKey: 'afterClose' });
    const operatingAlgos = getAlgos('operating');
    if (operatingAlgos.length && operatingDays.length)
      slots.push({ startH: openH, endH: closeH, days: operatingDays, algoIds: operatingAlgos, scenarioKey: 'operating' });
    const atOpenAlgos = getAlgos('atOpen');
    if (atOpenAlgos.length && operatingDays.length)
      slots.push({ startH: Math.max(0, openH - 1), endH: Math.min(24, openH + 1), days: operatingDays, algoIds: atOpenAlgos, scenarioKey: 'atOpen' });
    const atCloseAlgos = getAlgos('atClose');
    if (atCloseAlgos.length && operatingDays.length)
      slots.push({ startH: Math.max(0, closeH - 1), endH: Math.min(24, closeH + 1), days: operatingDays, algoIds: atCloseAlgos, scenarioKey: 'atClose' });
    const holidayAlgos = getAlgos('holiday');
    if (holidayAlgos.length && holidays.length)
      slots.push({ startH: 0, endH: 24, days: holidays, algoIds: holidayAlgos, scenarioKey: 'holiday' });
    return slots;
  }, [openH, closeH, holidays, scenarioConcerns]);

  if (!cam) return <div className={page.page}>카메라가 없습니다.</div>;
  const offline = cam.status === 'offline';

  const getExtra = (id: string): ExtraCfg => extras[id] ?? DEFAULT_EXTRA;
  const patchExtra = (id: string, patch: Partial<ExtraCfg>) =>
    setExtras((s) => ({ ...s, [id]: { ...getExtra(id), ...patch } }));

  // 온보딩 완료 핸들러
  function completeOnboarding(skip = false) {
    localStorage.setItem('ai-safety-onboarded', '1');
    setIsOnboarded(true);
    setOnboardStep(0);
    if (!skip) applyRecommendationSilent();
  }

  // applyRecommendation의 무소음 버전 (toast 없이, 온보딩 완료 후 자동 적용용)
  function applyRecommendationSilent() {
    if (generatedSlots.length === 0) return;
    cameras.forEach((c) => {
      setCamSchedules((p) => ({
        ...p,
        [c.id]: generatedSlots.map((s, i) => ({ ...s, id: `rec_${c.id}_${i}` })),
      }));
    });
  }

  // 추천 모달 진입: Step1으로 초기화
  function openRecommendModal() {
    setModalStep(1);
    setActiveSlotIdx(0);
    setShowRecommendModal(true);
  }

  // 모달 내 카메라 스코프: 사이드바에서 선택한 계약처의 사이트에 속한 카메라
  const scopedCameras = useMemo(() => {
    const siteIds = new Set(sites.filter(s => s.contractId === selectedContractId).map(s => s.id));
    return cameras.filter(c => c.siteId !== null && siteIds.has(c.siteId));
  }, [cameras, sites, selectedContractId]);

  // 슬롯에 매칭되는 시나리오 메타 찾기 — 슬롯에 박힌 scenarioKey 우선, 없으면 시간 기반 추론
  const findScenarioForSlot = (slot: Omit<ScheduleSlot,'id'>) => {
    if (slot.scenarioKey) return SCENARIO_META.find((s) => s.key === slot.scenarioKey);
    return SCENARIO_META.find((s) => {
      if (s.key === 'afterClose') return slot.startH === closeH;
      if (s.key === 'operating')  return slot.startH === openH && slot.endH === closeH;
      if (s.key === 'atOpen')     return slot.startH === Math.max(0, openH - 1) && slot.endH !== closeH;
      if (s.key === 'atClose')    return slot.startH === Math.max(0, closeH - 1);
      return slot.startH === 0 && slot.endH === 24;
    });
  };

  // Step1 → Step2: 슬롯×카메라×기능 매트릭스 초기화 (슬롯 기본 algoIds로 모든 카메라 채움)
  function goToStep2() {
    if (generatedSlots.length === 0) {
      toast.info('생성된 일정 없음', '감지 항목을 선택하면 타임테이블이 자동으로 만들어져요.');
      return;
    }
    const init: Record<number, Record<string, string[]>> = {};
    generatedSlots.forEach((slot, idx) => {
      init[idx] = {};
      scopedCameras.forEach((c) => { init[idx][c.id] = [...slot.algoIds]; });
    });
    setStep2Selection(init);
    setActiveSlotIdx(0);
    setModalStep(2);
  }

  // 매트릭스 셀 토글
  function toggleStep2Cell(slotIdx: number, camId: string, algoId: string) {
    setStep2Selection(p => {
      const cur = p[slotIdx]?.[camId] ?? [];
      const next = cur.includes(algoId) ? cur.filter(x => x !== algoId) : [...cur, algoId];
      return { ...p, [slotIdx]: { ...(p[slotIdx] ?? {}), [camId]: next } };
    });
  }

  // 열 일괄 토글 — 한 슬롯에서 특정 algoId를 모든 카메라에 켜기/끄기
  function toggleStep2Column(slotIdx: number, algoId: string) {
    setStep2Selection(p => {
      const slotMap = p[slotIdx] ?? {};
      const allOn = scopedCameras.every(c => (slotMap[c.id] ?? []).includes(algoId));
      const nextSlot: Record<string, string[]> = {};
      scopedCameras.forEach(c => {
        const cur = slotMap[c.id] ?? [];
        nextSlot[c.id] = allOn ? cur.filter(x => x !== algoId) : (cur.includes(algoId) ? cur : [...cur, algoId]);
      });
      return { ...p, [slotIdx]: nextSlot };
    });
  }

  function applyRecommendation() {
    scopedCameras.forEach((c) => {
      const camSlots = generatedSlots
        .map((slot, idx) => ({
          ...slot,
          algoIds: step2Selection[idx]?.[c.id] ?? slot.algoIds,
        }))
        .filter(s => s.algoIds.length > 0);
      setCamSchedules((p) => ({
        ...p,
        [c.id]: camSlots.map((s, i) => ({ ...s, id: `rec_${c.id}_${i}` })),
      }));

      // 카메라별 algo.enabled를 슬롯 union과 동기화 — 어느 슬롯에든 포함되면 ON, 아니면 OFF
      const enabledKeys = new Set(camSlots.flatMap(s => s.algoIds));
      algorithms.filter(a => a.cameraId === c.id).forEach((a) => {
        const shouldBeEnabled = enabledKeys.has(a.algoKey);
        if (shouldBeEnabled !== a.enabled) {
          patchAlgorithm(c.id, a.id, { enabled: shouldBeEnabled });
        }
      });
    });
    toast.success(
      '맞춤 타임테이블 적용',
      `${scopedCameras.length}대 카메라에 카메라별 맞춤 일정을 적용했습니다.`,
    );
    setShowRecommendModal(false);
    setModalStep(1);
  }

  // 활성 슬롯(없으면 카메라 전체) 기준 현재 켜진 AI 특화 기능 수
  const AI_LIMIT = 2;
  const aiEnabledCountInContext = activeMainSlot
    ? activeMainSlot.algoIds.reduce((acc, id) => {
        const algo = camAlgos.find((x) => x.algoKey === id);
        return acc + (algo?.kind === 'ai' ? 1 : 0);
      }, 0)
    : aiAlgos.filter((x) => x.enabled).length;

  // 슬롯에서 algoKey 제거 후 어느 슬롯에도 없으면 enabled=false 처리
  const removeAlgoFromActiveSlot = (a: CameraAlgorithm) => {
    if (!activeMainSlot) return;
    const newSched = schedule.map((s, i) =>
      i === safeMainSlotIdx
        ? { ...s, algoIds: s.algoIds.filter((x) => x !== a.algoKey) }
        : s,
    );
    setCamSchedules((p) => ({ ...p, [activeCamId]: newSched }));
    const stillUsed = newSched.some((s) => s.algoIds.includes(a.algoKey));
    if (!stillUsed && a.enabled) {
      patchAlgorithm(a.cameraId, a.id, { enabled: false });
    }
    if (expandedId === a.id) { setExpandedId(null); setDrawMode(false); }
  };

  // 활성 슬롯에 algoKey 추가 + enabled=true. AI 특화는 동일 슬롯 최대 2개.
  const addAlgoToActiveSlot = (a: CameraAlgorithm) => {
    if (a.kind === 'ai' && aiEnabledCountInContext >= AI_LIMIT) {
      toast.warn(
        `AI 특화 기능은 최대 ${AI_LIMIT}개`,
        `${activeMainSlot ? '이 시간대' : '동일 시간대'}에 AI 특화 기능은 최대 ${AI_LIMIT}개까지 사용할 수 있어요. 기존 기능을 먼저 끄세요.`,
      );
      return;
    }
    if (activeMainSlot) {
      const newSched = schedule.map((s, i) =>
        i === safeMainSlotIdx && !s.algoIds.includes(a.algoKey)
          ? { ...s, algoIds: [...s.algoIds, a.algoKey] }
          : s,
      );
      setCamSchedules((p) => ({ ...p, [activeCamId]: newSched }));
    }
    if (!a.enabled) {
      patchAlgorithm(a.cameraId, a.id, { enabled: true });
    }
  };

  // 등록된 카드의 해제 — 슬롯 모드면 활성 슬롯에서 제거, 아니면 enabled=false
  const deactivateAlgo = (a: CameraAlgorithm) => {
    if (activeMainSlot) {
      removeAlgoFromActiveSlot(a);
      return;
    }
    if (a.enabled) patchAlgorithm(a.cameraId, a.id, { enabled: false });
    if (expandedId === a.id) { setExpandedId(null); setDrawMode(false); }
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
            <span className={[styles.algoChevron, open ? styles.algoChevronOpen : ''].filter(Boolean).join(' ')} aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </div>
        </div>

        {open && (
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

            {/* 해제 액션 */}
            <div className={styles.algoBodyActions}>
              <button
                type="button"
                className={styles.algoRemoveBtn}
                onClick={() => deactivateAlgo(a)}
              >
                {activeMainSlot ? '이 시간대에서 해제' : '이 기능 해제'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={page.page}>

      {/* ═══ 온보딩 화면 ═══ */}
      {!isOnboarded && (
        <div className={styles.onboardWrap}>
          {/* 단계 표시 */}
          <div className={styles.onboardSteps}>
            {['업종 · 시간', '걱정 상황', '설정 완료'].map((label, i) => (
              <div key={i} className={[styles.onboardStep, onboardStep === i ? styles.onboardStepActive : onboardStep > i ? styles.onboardStepDone : ''].filter(Boolean).join(' ')}>
                <span className={styles.onboardStepDot}>{onboardStep > i ? '✓' : i + 1}</span>
                <span className={styles.onboardStepLabel}>{label}</span>
              </div>
            ))}
          </div>

          {/* ── Step 0: 업종 + 영업시간 + 휴일 ── */}
          {onboardStep === 0 && (
            <div className={styles.onboardCard}>
              <div className={styles.onboardCardHero}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={styles.onboardHeroIcon}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <div>
                  <div className={styles.onboardCardTitle}>매장 정보 입력</div>
                  <div className={styles.onboardCardDesc}>업종과 영업 시간을 알려주시면 맞춤 보안 설정을 추천해드려요</div>
                </div>
              </div>

              <div className={styles.onboardSection}>
                <div className={styles.onboardSectionTitle}>업종</div>
                <div className={styles.onboardChips}>
                  {INDUSTRIES.map((o) => (
                    <button key={o.value} type="button"
                      className={[styles.onboardChip, industry === o.value ? styles.onboardChipActive : ''].filter(Boolean).join(' ')}
                      onClick={() => setIndustry(o.value)}>{o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.onboardSection}>
                <div className={styles.onboardSectionTitle}>영업 시간</div>
                <div className={styles.onboardTimeRow}>
                  <div className={styles.onboardTimeField}>
                    <span className={styles.onboardTimeLabel}>오픈</span>
                    <select className={styles.onboardTimeSelect} value={openH} onChange={(e) => setOpenH(+e.target.value)}>
                      {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{fmtH(i)}</option>)}
                    </select>
                  </div>
                  <span className={styles.onboardTimeSep}>~</span>
                  <div className={styles.onboardTimeField}>
                    <span className={styles.onboardTimeLabel}>마감</span>
                    <select className={styles.onboardTimeSelect} value={closeH} onChange={(e) => setCloseH(+e.target.value)}>
                      {Array.from({ length: 24 }, (_, i) => <option key={i + 1} value={i + 1}>{fmtH(i + 1)}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className={styles.onboardSection}>
                <div className={styles.onboardSectionTitle}>휴일</div>
                <div className={styles.onboardChips}>
                  <button type="button"
                    className={[styles.onboardChip, holidays.length === 0 ? styles.onboardChipActive : ''].filter(Boolean).join(' ')}
                    onClick={() => setHolidays([])}>없음</button>
                  {DAY_LIST.map((d) => (
                    <button key={d.key} type="button"
                      className={[styles.onboardChip, holidays.includes(d.key) ? styles.onboardChipActive : ''].filter(Boolean).join(' ')}
                      onClick={() => setHolidays((p) => p.includes(d.key) ? p.filter((x) => x !== d.key) : [...p, d.key])}>
                      {d.label}요일
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.onboardActions}>
                <button type="button" className={styles.onboardSkip} onClick={() => completeOnboarding(true)}>나중에 설정할게요</button>
                <button type="button" className={styles.onboardNext} onClick={() => setOnboardStep(1)}>다음 →</button>
              </div>
            </div>
          )}

          {/* ── Step 1: 시나리오별 걱정 항목 ── */}
          {onboardStep === 1 && (
            <div className={styles.onboardCard}>
              <div className={styles.onboardCardHero}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={styles.onboardHeroIcon}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <div>
                  <div className={styles.onboardCardTitle}>상황별 걱정되는 것</div>
                  <div className={styles.onboardCardDesc}>각 시간대에 걱정되는 상황을 선택하면 자동으로 감지 일정을 만들어드려요</div>
                </div>
              </div>

              <div className={styles.onboardScenarios}>
                {SCENARIO_META.filter((s) =>
                  s.key !== 'holiday' || holidays.length > 0
                ).map((scenario) => (
                  <div key={scenario.key} className={styles.onboardScenario}>
                    <div className={styles.onboardScenarioHead}>
                      <span className={styles.onboardScenarioEmoji}>{scenario.emoji}</span>
                      <div>
                        <div className={styles.onboardScenarioLabel}>{scenario.label}</div>
                        <div className={styles.onboardScenarioDesc}>{scenario.desc}</div>
                      </div>
                    </div>
                    <div className={styles.onboardChips}>
                      {SCENARIO_CONCERNS.map((c) => {
                        const active = scenarioConcerns[scenario.key].includes(c.value);
                        return (
                          <button key={c.value} type="button"
                            className={[styles.onboardChip, active ? styles.onboardChipActive : ''].filter(Boolean).join(' ')}
                            onClick={() => toggleScenarioConcern(scenario.key, c.value)}>
                            {c.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.onboardActions}>
                <button type="button" className={styles.onboardBack} onClick={() => setOnboardStep(0)}>← 이전</button>
                <button type="button" className={styles.onboardNext} onClick={() => setOnboardStep(2)}>다음 →</button>
              </div>
            </div>
          )}

          {/* ── Step 2: 요약 + 완료 ── */}
          {onboardStep === 2 && (
            <div className={styles.onboardCard}>
              <div className={styles.onboardCardHero}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={styles.onboardHeroIconSuccess}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <div>
                  <div className={styles.onboardCardTitle}>설정 완료 — 이렇게 추천할게요</div>
                  <div className={styles.onboardCardDesc}>아래 타임테이블이 전체 카메라에 적용됩니다. 언제든지 변경할 수 있어요.</div>
                </div>
              </div>

              {/* 요약 */}
              <div className={styles.onboardSummary}>
                <div className={styles.onboardSummaryRow}>
                  <span className={styles.onboardSummaryLabel}>업종</span>
                  <span className={styles.onboardSummaryVal}>{INDUSTRIES.find((o) => o.value === industry)?.label}</span>
                </div>
                <div className={styles.onboardSummaryRow}>
                  <span className={styles.onboardSummaryLabel}>영업 시간</span>
                  <span className={styles.onboardSummaryVal}>{fmtH(openH)} ~ {fmtH(closeH)}</span>
                </div>
                {holidays.length > 0 && (
                  <div className={styles.onboardSummaryRow}>
                    <span className={styles.onboardSummaryLabel}>휴일</span>
                    <span className={styles.onboardSummaryVal}>{fmtDays(holidays)}</span>
                  </div>
                )}
              </div>

              {generatedSlots.length > 0 ? (
                <div className={styles.onboardPreview}>
                  {generatedSlots.map((slot, i) => {
                    const scenLabel = SCENARIO_META.find((s) => {
                      if (s.key === 'afterClose') return slot.startH === closeH;
                      if (s.key === 'operating')  return slot.startH === openH && slot.endH === closeH;
                      if (s.key === 'atOpen')     return slot.startH === Math.max(0, openH - 1) && slot.endH !== closeH;
                      if (s.key === 'atClose')    return slot.startH === Math.max(0, closeH - 1);
                      return slot.startH === 0 && slot.endH === 24;
                    });
                    return (
                      <div key={i} className={styles.onboardPreviewSlot}>
                        <span className={styles.onboardPreviewEmoji}>{scenLabel?.emoji ?? '📋'}</span>
                        <div className={styles.onboardPreviewInfo}>
                          <span className={styles.onboardPreviewLabel}>{scenLabel?.label ?? '일정'}</span>
                          <span className={styles.onboardPreviewTime}>{fmtH(slot.startH)} ~ {fmtH(slot.endH)}</span>
                        </div>
                        <span className={styles.onboardPreviewAlgos}>
                          {slot.algoIds.map((id) => SCHED_ALGOS.find((a) => a.id === id)?.label ?? id).join(' · ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.onboardEmpty}>걱정 상황을 선택하지 않았어요. 이전 단계로 돌아가 선택하거나, 그냥 시작할 수 있어요.</div>
              )}

              <div className={styles.onboardActions}>
                <button type="button" className={styles.onboardBack} onClick={() => setOnboardStep(1)}>← 이전</button>
                <button type="button" className={styles.onboardComplete} onClick={() => completeOnboarding(false)}>
                  안심 AI 설정 시작하기
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ 메인 화면 (온보딩 완료 후) ═══ */}
      {isOnboarded && <div className={styles.aiBodyRow}>
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
                  noCard
                  onDrawComplete={handleDrawComplete}
                  onPolygonRemove={handlePolygonRemove}
                  onPolygonUpdate={handlePolygonUpdate}
                  onCancelDraw={() => setDrawMode(false)}
                />
              </div>

              <div className={page.algoRight}>
                <div className={styles.algoHeaderRow}>
                  <label className={styles.detailModeField}>
                    <Toggle
                      on={detailMode}
                      onToggle={() => {
                        const next = !detailMode;
                        setDetailMode(next);
                        if (!next) { setExpandedId(null); setDrawMode(false); }
                      }}
                      aria-label="상세모드"
                    />
                    <span className={styles.detailModeLabel}>상세모드</span>
                  </label>
                  <Button variant="secondary" size="sm" onClick={openRecommendModal}>
                    추천 안심 설정
                  </Button>
                </div>

                {detailMode && (
                  <ScheduleSection slots={schedule} onAdd={addSlot} />
                )}

                {/* 시간 슬롯 탭 — 카메라에 schedule이 있을 때만 */}
                {schedule.length > 0 && (
                  <div className={styles.mainSlotTabs} role="tablist" aria-label="시간 슬롯">
                    {schedule.map((slot, idx) => {
                      const scen = findScenarioForSlot(slot);
                      const active = safeMainSlotIdx === idx;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          className={[styles.mainSlotTab, active ? styles.mainSlotTabActive : ''].filter(Boolean).join(' ')}
                          onClick={() => setActiveMainSlotIdx(idx)}
                        >
                          <span className={styles.mainSlotTabEmoji}>{scen?.emoji ?? '📋'}</span>
                          <span className={styles.mainSlotTabLabel}>{scen?.label ?? '일정'}</span>
                          <span className={styles.mainSlotTabTime}>{fmtH(slot.startH)}~{fmtH(slot.endH)}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className={styles.cardGrid}>
                  <div>
                    <div className={styles.algoSectionHead}>
                      <span className={styles.algoGroupTitle}>기본 안심 기능</span>
                      <span className={styles.algoSectionHint}>AI 특화 기능과 함께 자유롭게 사용할 수 있어요</span>
                    </div>
                    {visibleBasicAlgos.length > 0
                      ? <div className={styles.algoGrid}>{visibleBasicAlgos.map(renderCard)}</div>
                      : <div className={styles.algoEmptyHint}>이 시간대에 적용된 감지가 없습니다.</div>}
                    {hiddenBasicAlgos.length > 0 && (
                      <div className={styles.algoActivateRow}>
                        <span className={styles.algoActivateLabel}>+ 추가 활성화</span>
                        {hiddenBasicAlgos.map((a) => (
                          <button key={a.id} type="button" className={styles.algoActivateChip} onClick={() => addAlgoToActiveSlot(a)}>
                            <span className={styles.algoActivateChipIcon} aria-hidden><Glyph algoKey={a.algoKey} /></span>
                            {a.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className={styles.algoSectionHead}>
                      <span className={styles.algoGroupTitle}>AI 특화 기능</span>
                      <span className={[styles.algoSectionHint, aiEnabledCountInContext >= AI_LIMIT ? styles.algoSectionHintWarn : ''].filter(Boolean).join(' ')}>
                        동일 시간대 최대 {AI_LIMIT}개 · 현재 {aiEnabledCountInContext}/{AI_LIMIT}
                      </span>
                    </div>
                    {visibleAiAlgos.length > 0
                      ? <div className={styles.algoGrid}>{visibleAiAlgos.map(renderCard)}</div>
                      : <div className={styles.algoEmptyHint}>이 시간대에 적용된 감지가 없습니다.</div>}
                    {hiddenAiAlgos.length > 0 && (
                      <div className={styles.algoActivateRow}>
                        <span className={[styles.algoActivateLabel, aiEnabledCountInContext >= AI_LIMIT ? styles.algoActivateLabelWarn : ''].filter(Boolean).join(' ')}>
                          {aiEnabledCountInContext >= AI_LIMIT
                            ? `한도 도달 — 기능을 해제하면 추가 활성화할 수 있어요`
                            : '+ 추가 활성화'}
                        </span>
                        {hiddenAiAlgos.map((a) => {
                          const disabled = aiEnabledCountInContext >= AI_LIMIT;
                          return (
                            <button
                              key={a.id}
                              type="button"
                              className={styles.algoActivateChip}
                              onClick={() => addAlgoToActiveSlot(a)}
                              disabled={disabled}
                              title={disabled ? `AI 특화 기능은 최대 ${AI_LIMIT}개까지 사용할 수 있어요` : undefined}
                            >
                              <span className={styles.algoActivateChipIcon} aria-hidden><Glyph algoKey={a.algoKey} /></span>
                              {a.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {detailMode && (
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
            )}

            {/* 온보딩 재시작 */}
            <div className={styles.reOnboardRow}>
              <button
                type="button"
                className={styles.reOnboardBtn}
                onClick={() => {
                  localStorage.removeItem('ai-safety-onboarded');
                  setIsOnboarded(false);
                  setOnboardStep(0);
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                초기 설정 다시 보기
              </button>
            </div>
          </div>
        </div>}

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

            {/* 스텝 인디케이터 */}
            <div className={styles.recSteps} role="tablist" aria-label="추천 안심 설정 단계">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className={[styles.recStep, modalStep === n ? styles.recStepActive : modalStep > n ? styles.recStepDone : ''].filter(Boolean).join(' ')}
                  role="tab"
                  aria-selected={modalStep === n}
                >
                  <span className={styles.recStepDot}>{modalStep > n ? '✓' : n}</span>
                  <span className={styles.recStepLabel}>
                    {n === 1 ? '시나리오 · 시간 설정' : '카메라별 감지 항목'}
                  </span>
                </div>
              ))}
            </div>

            {/* 본문 스크롤 영역 */}
            <div className={styles.recModalBody}>
              {modalStep === 1 && <>
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
                      const expanded = scenarioExpanded[scenario.key];
                      return (
                        <div key={scenario.key} className={styles.recScenarioCard}>
                          <div className={styles.recScenarioHead}>
                            <span className={styles.recScenarioEmoji}>{scenario.emoji}</span>
                            <span className={styles.recScenarioLabel}>{scenario.label}</span>
                            <span className={styles.recScenarioTime}>{timeLabel}</span>
                            <Toggle
                              on={expanded}
                              onToggle={() => setScenarioExpanded((p) => ({ ...p, [scenario.key]: !p[scenario.key] }))}
                              aria-label={`${scenario.label} 펼치기`}
                            />
                          </div>
                          {expanded && (
                            <>
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
                            </>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              </>}

              {modalStep === 2 && <>
                {/* 슬롯 탭 — DS Tabs(line) 대신 시나리오 메타가 풍부해 커스텀 칩 사용 */}
                <div className={styles.recSlotTabs} role="tablist" aria-label="시간 슬롯">
                  {generatedSlots.map((slot, idx) => {
                    const scen = findScenarioForSlot(slot);
                    const active = activeSlotIdx === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        className={[styles.recSlotTab, active ? styles.recSlotTabActive : ''].filter(Boolean).join(' ')}
                        onClick={() => setActiveSlotIdx(idx)}
                      >
                        <span className={styles.recSlotTabEmoji}>{scen?.emoji ?? '📋'}</span>
                        <span className={styles.recSlotTabLabel}>{scen?.label ?? '일정'}</span>
                        <span className={styles.recSlotTabTime}>{fmtH(slot.startH)}~{fmtH(slot.endH)}</span>
                      </button>
                    );
                  })}
                </div>

                {/* 매트릭스: 행=카메라, 열=감지 기능 */}
                {scopedCameras.length === 0 ? (
                  <div className={styles.recMatrixEmpty}>선택한 계약처에 카메라가 없습니다.</div>
                ) : (
                  <div className={styles.recMatrixWrap}>
                    <table className={styles.recMatrix}>
                      <thead>
                        <tr>
                          <th className={styles.recMatrixCornerCell}>카메라</th>
                          {SCHED_ALGOS.map((algo) => {
                            const allOn = scopedCameras.every(c => (step2Selection[activeSlotIdx]?.[c.id] ?? []).includes(algo.id));
                            return (
                              <th key={algo.id} className={styles.recMatrixHeadCell}>
                                <button
                                  type="button"
                                  className={[styles.recMatrixHeadBtn, allOn ? styles.recMatrixHeadBtnAllOn : ''].filter(Boolean).join(' ')}
                                  onClick={() => toggleStep2Column(activeSlotIdx, algo.id)}
                                  title={`${allOn ? '전체 해제' : '전체 적용'} · ${algo.label}`}
                                >
                                  <span className={styles.recMatrixHeadDot} style={{ background: ALGO_COLORS[algo.id] ?? '#9CA3AF' }} />
                                  {algo.label}
                                </button>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {scopedCameras.map((c) => {
                          const enabled = step2Selection[activeSlotIdx]?.[c.id] ?? [];
                          const site = sites.find(s => s.id === c.siteId);
                          return (
                            <tr key={c.id}>
                              <th scope="row" className={styles.recMatrixRowHead}>
                                <span className={styles.recMatrixCamName}>{c.name}</span>
                                {site && <span className={styles.recMatrixSiteName}>{site.name}</span>}
                              </th>
                              {SCHED_ALGOS.map((algo) => {
                                const checked = enabled.includes(algo.id);
                                return (
                                  <td key={algo.id} className={styles.recMatrixCell}>
                                    <label className={styles.recMatrixCheckbox}>
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggleStep2Cell(activeSlotIdx, c.id, algo.id)}
                                        aria-label={`${c.name} · ${algo.label}`}
                                      />
                                      <span className={styles.recMatrixCheckboxBox} aria-hidden />
                                    </label>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>}
            </div>

            {/* 푸터 */}
            <div className={styles.recModalFoot}>
              {modalStep === 1 ? (
                <>
                  <Button variant="secondary" size="sm" onClick={() => setShowRecommendModal(false)}>닫기</Button>
                  <Button variant="primary" size="sm" onClick={goToStep2} disabled={generatedSlots.length === 0}>
                    다음: 카메라별 설정 →
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="secondary" size="sm" onClick={() => setModalStep(1)}>← 이전</Button>
                  <Button variant="primary" size="sm" onClick={applyRecommendation} disabled={scopedCameras.length === 0}>
                    타임테이블 적용
                  </Button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
