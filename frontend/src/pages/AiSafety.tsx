// 안심 AI 설정 — 핵심 차별화 화면.
//   1) 업종·운영시간·걱정 상황 기반으로 AI 알고리즘을 추천하고 매장 전체에 적용.
//   2) 카메라별 내 매장 AI 설정 — 감지 종류·영역·시간·알림/민감도(고급)까지 조정.
//   ROI/영역은 RoiPreview 공용 컴포넌트로 그린다.
//   ※ 기기 기본설정(시스템·네트워크·영상 등)은 [카메라 관리]에서 다룬다.
import { useEffect, useMemo, useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Toggle } from '@/components/ui/Toggle';
import { Tabs } from '@/components/ui/Tabs';
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

// ── AI 특화 전문가 상세 설정 ──
interface ExpertCfg {
  confidence: number;      // 감지 신뢰도 임계값 (%)
  minSize: number;         // 최소 객체 크기 (px)
  maxSize: number;         // 최대 객체 크기 (px)
  trackHold: number;       // 추적 유지 프레임
  confirmFrames: number;   // 검증 프레임 수
  model: 'v1' | 'v2' | 'v2-lite';
}
const DEFAULT_EXPERT: ExpertCfg = { confidence: 70, minSize: 40, maxSize: 600, trackHold: 30, confirmFrames: 5, model: 'v2' };
const MODEL_OPTS: { value: ExpertCfg['model']; label: string }[] = [
  { value: 'v2',      label: 'YOLO v2 (기본)' },
  { value: 'v2-lite', label: 'YOLO v2-lite (경량)' },
  { value: 'v1',      label: 'YOLO v1 (호환)' },
];

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

// 메인 화면 슬롯 탭 표출 순서 — 하루 시간 흐름
const SCENARIO_DISPLAY_ORDER: ScenarioKey[] = ['atOpen', 'operating', 'atClose', 'afterClose', 'holiday'];

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
  // 추천 모달: 1=시나리오 설정, 2=카메라×슬롯 매트릭스
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [activeSlotIdx, setActiveSlotIdx] = useState(0);
  // step2Selection[slotIdx][cameraId] = 활성 algoId 배열
  const [step2Selection, setStep2Selection] = useState<Record<number, Record<string, string[]>>>({});
  // 메인 화면 슬롯 탭 — slot.id로 추적 (정렬 후에도 안정적)
  const [activeMainSlotId, setActiveMainSlotId] = useState<string | null>(null);
  // 전문가 상세 설정 모달
  const [expertAlgoId, setExpertAlgoId] = useState<string | null>(null);
  const [expertCfgs, setExpertCfgs] = useState<Record<string, ExpertCfg>>({});
  const [expertTab, setExpertTab] = useState<'params' | 'area'>('params');
  const [expertDrawMode, setExpertDrawMode] = useState(false);
  // 전문가 인증 단계 — 톱니 클릭 시 먼저 ID/PW 입력
  const [authForAlgoId, setAuthForAlgoId] = useState<string | null>(null);
  const [authInput, setAuthInput] = useState({ id: '', pw: '' });
  const [authError, setAuthError] = useState<string | null>(null);
  // 기본 안심 / AI 특화 섹션 토글
  const [activeKind, setActiveKind] = useState<'basic' | 'ai'>('basic');

  // 온보딩 — 최초 방문 시 초기 세팅 화면 표시
  const [isOnboarded, setIsOnboarded] = useState(() =>
    localStorage.getItem('ai-safety-onboarded') === '1',
  );
  const [onboardStep, setOnboardStep] = useState(0); // 0=업종/시간, 1=걱정상황, 2=카메라별 감지 항목, 3=설정 완료

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

  // 휴일을 하나라도 선택하면 Step 1 의 '휴일 시' 시나리오 카드를 자동 펼침, 모두 해제하면 자동 접기.
  // (걱정상황 단계에서 별도 토글 클릭은 holidays.length 가 바뀌지 않는 한 그대로 유지됨)
  useEffect(() => {
    setScenarioExpanded((p) => ({ ...p, holiday: holidays.length > 0 }));
  }, [holidays.length]);

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

  const cam = cameras.find((c) => c.id === activeCamId);
  const camAlgos = useMemo(() => algorithms.filter((a) => a.cameraId === activeCamId), [algorithms, activeCamId]);
  const basicAlgos = camAlgos.filter((a) => a.kind === 'basic');
  const aiAlgos = camAlgos.filter((a) => a.kind === 'ai');

  // 메인 슬롯 탭 — 시나리오 시간순으로 정렬해서 표출
  const orderedSchedule = useMemo(() => {
    return [...schedule].sort((a, b) => {
      const ai = a.scenarioKey ? SCENARIO_DISPLAY_ORDER.indexOf(a.scenarioKey) : 99;
      const bi = b.scenarioKey ? SCENARIO_DISPLAY_ORDER.indexOf(b.scenarioKey) : 99;
      return ai - bi;
    });
  }, [schedule]);
  // 활성 슬롯 — id로 추적, 못 찾으면 첫 번째
  const activeMainSlot = (activeMainSlotId
    ? orderedSchedule.find((s) => s.id === activeMainSlotId)
    : null) ?? orderedSchedule[0] ?? null;
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
    const getAlgos = (key: ScenarioKey) => {
      // 시나리오가 접혀(off) 있으면 슬롯에서 제외
      if (!scenarioExpanded[key]) return [];
      return [...new Set(
        (scenarioConcerns[key] ?? [])
          .map((v) => SCENARIO_CONCERNS.find((c) => c.value === v)?.algoKey)
          .filter((x): x is string => Boolean(x)),
      )];
    };
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
  }, [openH, closeH, holidays, scenarioConcerns, scenarioExpanded]);

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
  // Step 2(카메라별 감지 항목) 매트릭스를 거쳤다면 step2Selection 기준으로 카메라별 적용, 아니면 슬롯 기본값으로 균일 적용
  function applyRecommendationSilent() {
    if (generatedSlots.length === 0) return;
    const hasMatrixSelection = Object.keys(step2Selection).length > 0;
    const scopedSet = new Set(scopedCameras.map(c => c.id));
    cameras.forEach((c) => {
      const slots = hasMatrixSelection && scopedSet.has(c.id)
        ? generatedSlots
            .map((slot, idx) => ({ ...slot, algoIds: step2Selection[idx]?.[c.id] ?? slot.algoIds }))
            .filter(s => s.algoIds.length > 0)
        : generatedSlots;
      setCamSchedules((p) => ({
        ...p,
        [c.id]: slots.map((s, i) => ({ ...s, id: `rec_${c.id}_${i}` })),
      }));
    });
  }

  // 온보딩 Step 1 → Step 2(카메라별 감지 항목) 진입: step2Selection 초기화
  function goToOnboardMatrix() {
    if (generatedSlots.length === 0) {
      // 걱정 상황을 하나도 선택하지 않은 경우엔 매트릭스 단계를 건너뛰고 요약으로 직행
      setOnboardStep(3);
      return;
    }
    const init: Record<number, Record<string, string[]>> = {};
    generatedSlots.forEach((slot, idx) => {
      init[idx] = {};
      scopedCameras.forEach((c) => { init[idx][c.id] = [...slot.algoIds]; });
    });
    setStep2Selection(init);
    setActiveSlotIdx(0);
    setOnboardStep(2);
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
    const targetId = activeMainSlot.id;
    const newSched = schedule.map((s) =>
      s.id === targetId
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
      const targetId = activeMainSlot.id;
      const newSched = schedule.map((s) =>
        s.id === targetId && !s.algoIds.includes(a.algoKey)
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
              <div className={styles.algoFieldHead}>
                <span className={styles.algoFieldLabel}>민감도</span>
                {a.kind === 'ai' && (
                  <button
                    type="button"
                    className={styles.expertBtn}
                    onClick={() => { setAuthForAlgoId(a.id); setAuthInput({ id: '', pw: '' }); setAuthError(null); }}
                    title="전문가 상세 설정 — 당사 전문가가 영역·파라미터를 조정"
                    aria-label="전문가 상세 설정"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    전문가 설정
                  </button>
                )}
              </div>
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
            {['업종 · 시간', '걱정 상황', '카메라별 감지 항목', '설정 완료'].map((label, i) => (
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
                ).map((scenario) => {
                  const expanded = scenarioExpanded[scenario.key];
                  return (
                    <div key={scenario.key} className={styles.onboardScenario}>
                      <div className={styles.onboardScenarioHead}>
                        <span className={styles.onboardScenarioEmoji}>{scenario.emoji}</span>
                        <div className={styles.onboardScenarioHeadText}>
                          <div className={styles.onboardScenarioLabel}>{scenario.label}</div>
                          <div className={styles.onboardScenarioDesc}>{scenario.desc}</div>
                        </div>
                        <Toggle
                          on={expanded}
                          onToggle={() => setScenarioExpanded((p) => ({ ...p, [scenario.key]: !p[scenario.key] }))}
                          aria-label={`${scenario.label} 펼치기`}
                        />
                      </div>
                      {expanded && (
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
                      )}
                    </div>
                  );
                })}
              </div>

              <div className={styles.onboardActions}>
                <button type="button" className={styles.onboardBack} onClick={() => setOnboardStep(0)}>← 이전</button>
                <button type="button" className={styles.onboardNext} onClick={goToOnboardMatrix}>다음 →</button>
              </div>
            </div>
          )}

          {/* ── Step 2: 카메라별 감지 항목 (추천 모달 Step 2 동형) ── */}
          {onboardStep === 2 && (
            <div className={[styles.onboardCard, styles.onboardCardWide].filter(Boolean).join(' ')}>
              <div className={styles.onboardCardHero}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={styles.onboardHeroIcon}>
                  <rect x="2" y="6" width="14" height="12" rx="2" />
                  <path d="M22 8l-6 4 6 4V8z" />
                </svg>
                <div>
                  <div className={styles.onboardCardTitle}>카메라별 감지 항목</div>
                  <div className={styles.onboardCardDesc}>각 시간대별로 카메라마다 어떤 항목을 감지할지 켜고 끌 수 있어요. 그대로 두면 추천 그대로 적용됩니다.</div>
                </div>
              </div>

              {/* 슬롯 탭 */}
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

              <div className={styles.onboardActions}>
                <button type="button" className={styles.onboardBack} onClick={() => setOnboardStep(1)}>← 이전</button>
                <button type="button" className={styles.onboardNext} onClick={() => setOnboardStep(3)}>다음 →</button>
              </div>
            </div>
          )}

          {/* ── Step 3: 요약 + 완료 ── */}
          {onboardStep === 3 && (
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
                <button type="button" className={styles.onboardBack} onClick={() => setOnboardStep(generatedSlots.length > 0 ? 2 : 1)}>← 이전</button>
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
                <div className={styles.recBtnRow}>
                  <Button variant="secondary" size="sm" onClick={openRecommendModal}>
                    AI 일괄 수정
                  </Button>
                </div>
              </div>

              <div className={[page.algoRight, styles.algoRightTabWrap].join(' ')}>
                {/* 시간 슬롯 라인탭 — 카메라에 schedule이 있을 때만 */}
                {orderedSchedule.length > 0 && (
                  <Tabs
                    variant="line"
                    active={activeMainSlot?.id ?? ''}
                    onChange={(id) => setActiveMainSlotId(id)}
                    tabs={orderedSchedule.map((slot) => {
                      const scen = findScenarioForSlot(slot);
                      return {
                        key: slot.id,
                        label: (
                          <span className={styles.slotTabLabel}>
                            <span>{scen?.label ?? '일정'}</span>
                            <span className={styles.slotTabTime}>{fmtH(slot.startH)}~{fmtH(slot.endH)}</span>
                          </span>
                        ),
                      };
                    })}
                  />
                )}

                {/* 기본/AI 칩 메뉴 */}
                <div className={styles.kindChips} role="tablist" aria-label="기능 카테고리">
                  {([['basic', '기본 안심 기능'], ['ai', 'AI 특화 기능']] as const).map(([k, label]) => (
                    <button
                      key={k}
                      type="button"
                      role="tab"
                      aria-selected={activeKind === k}
                      className={[styles.kindChip, activeKind === k ? styles.kindChipActive : ''].filter(Boolean).join(' ')}
                      onClick={() => setActiveKind(k)}
                    >
                      {label}
                      <span className={styles.kindChipCount}>
                        {k === 'basic' ? visibleBasicAlgos.length : visibleAiAlgos.length}
                      </span>
                    </button>
                  ))}
                </div>

                {/* 단일 섹션 — activeKind에 해당하는 카드 + 활성화 칩 */}
                <div className={styles.kindSection}>
                  {activeKind === 'basic' ? (
                    <>
                      <div className={styles.algoSectionHead}>
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
                    </>
                  ) : (
                    <>
                      <div className={styles.algoSectionHead}>
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
                    </>
                  )}
                </div>
              </div>
            </div>

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

      {/* ===== 전문가 인증 모달 ===== */}
      {authForAlgoId && (() => {
        const algo = camAlgos.find((x) => x.id === authForAlgoId);
        if (!algo) return null;
        const close = () => { setAuthForAlgoId(null); setAuthInput({ id: '', pw: '' }); setAuthError(null); };
        const submit = () => {
          const id = authInput.id.trim();
          const pw = authInput.pw;
          if (!id || !pw) { setAuthError('아이디와 비밀번호를 모두 입력하세요.'); return; }
          if (pw.length < 4) { setAuthError('비밀번호는 4자 이상이어야 합니다.'); return; }
          // 인증 성공 — 전문가 모달로 전환
          setExpertTab('params');
          setExpertDrawMode(false);
          setExpertAlgoId(authForAlgoId);
          close();
        };
        return (
          <>
            <div className={styles.expertBackdrop} onClick={close} />
            <div className={[styles.expertModal, styles.authModal].join(' ')} role="dialog" aria-modal="true" aria-labelledby="expert-auth-title">
              <div className={styles.expertHead}>
                <div>
                  <div id="expert-auth-title" className={styles.expertTitle}>전문가 인증</div>
                  <div className={styles.expertSub}>{algo.label} 상세 설정을 위해 당사 전문가 계정으로 로그인하세요</div>
                </div>
                <button type="button" className={styles.expertClose} onClick={close} aria-label="닫기">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form
                className={styles.authBody}
                onSubmit={(e) => { e.preventDefault(); submit(); }}
              >
                <label className={styles.authField}>
                  <span className={styles.authLabel}>아이디</span>
                  <input
                    type="text"
                    autoFocus
                    autoComplete="username"
                    className={styles.authInput}
                    value={authInput.id}
                    onChange={(e) => { setAuthInput((p) => ({ ...p, id: e.target.value })); setAuthError(null); }}
                    placeholder="전문가 계정 ID"
                  />
                </label>
                <label className={styles.authField}>
                  <span className={styles.authLabel}>비밀번호</span>
                  <input
                    type="password"
                    autoComplete="current-password"
                    className={styles.authInput}
                    value={authInput.pw}
                    onChange={(e) => { setAuthInput((p) => ({ ...p, pw: e.target.value })); setAuthError(null); }}
                    placeholder="비밀번호"
                  />
                </label>
                {authError && <div className={styles.authError}>{authError}</div>}
                <div className={styles.authHint}>
                  전문가 인증 후 영역·파라미터·모델 등 상세 설정이 가능합니다.
                </div>
                {/* 폼 submit용 hidden */}
                <button type="submit" style={{ display: 'none' }} aria-hidden />
              </form>

              <div className={styles.expertFoot}>
                <Button variant="secondary" size="sm" onClick={close}>취소</Button>
                <Button variant="primary" size="sm" onClick={submit}>로그인</Button>
              </div>
            </div>
          </>
        );
      })()}

      {/* ===== 전문가 상세 설정 모달 ===== */}
      {expertAlgoId && (() => {
        const algo = camAlgos.find((x) => x.id === expertAlgoId);
        if (!algo) return null;
        const cfg = expertCfgs[algo.id] ?? DEFAULT_EXPERT;
        const patch = (p: Partial<ExpertCfg>) =>
          setExpertCfgs((prev) => ({ ...prev, [algo.id]: { ...cfg, ...p } }));
        const close = () => { setExpertAlgoId(null); setExpertDrawMode(false); };
        const save = () => {
          toast.success('전문가 설정 저장', `${algo.label} 파라미터가 저장되었습니다.`);
          close();
        };
        const polys = algo.polygons ?? [];
        const expertOnDraw = (polygon: Omit<ZonePolygon, 'id'>) => {
          if (polygon.points.length < 3) return;
          addAlgorithmPolygon(algo.cameraId, algo.id, polygon);
          setExpertDrawMode(false);
          toast.success('영역 추가됨', `${algo.label} · ${polygon.points.length}개 vertex`);
        };
        return (
          <>
            <div className={styles.expertBackdrop} onClick={close} />
            <div className={[styles.expertModal, styles.expertModalWide].join(' ')} role="dialog" aria-modal="true" aria-labelledby="expert-title">
              <div className={styles.expertHead}>
                <div>
                  <div id="expert-title" className={styles.expertTitle}>전문가 상세 설정 — {algo.label}</div>
                  <div className={styles.expertSub}>당사 전문가가 카메라별 영역·파라미터를 미세 조정합니다</div>
                </div>
                <button type="button" className={styles.expertClose} onClick={close} aria-label="닫기">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 칩 탭 */}
              <div className={styles.expertChipTabs} role="tablist">
                {([['params', '감지 파라미터'], ['area', '영역 설정']] as const).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    role="tab"
                    aria-selected={expertTab === k}
                    className={[styles.expertChipTab, expertTab === k ? styles.expertChipTabActive : ''].filter(Boolean).join(' ')}
                    onClick={() => { setExpertTab(k); if (k === 'params') setExpertDrawMode(false); }}
                  >
                    {label}
                    {k === 'area' && <span className={styles.expertChipTabCount}>{polys.length}</span>}
                  </button>
                ))}
              </div>

              <div className={styles.expertSplit}>
                {/* 좌측 — 채널 프리뷰 (항상 표출) */}
                <div className={styles.expertSplitLeft}>
                  <RoiPreview
                    camName={cam.name}
                    camStatus={cam.status}
                    videoIdx={videoIdx}
                    offline={offline}
                    algos={[algo]}
                    activeAlgoId={algo.id}
                    drawMode={expertTab === 'area' && expertDrawMode}
                    noCard
                    onDrawComplete={expertOnDraw}
                    onPolygonRemove={handlePolygonRemove}
                    onPolygonUpdate={handlePolygonUpdate}
                    onCancelDraw={() => setExpertDrawMode(false)}
                  />
                </div>

                {/* 우측 — 활성 탭 콘텐츠 */}
                <div className={styles.expertSplitRight}>
                  {expertTab === 'params' && <>
                    {/* 감지 파라미터 */}
                    <div className={styles.expertSection}>
                      <div className={styles.expertSectionTitle}>감지 파라미터</div>

                      <div className={styles.expertField}>
                        <div className={styles.expertFieldHead}>
                          <span className={styles.expertFieldLabel}>감지 신뢰도 임계값</span>
                          <span className={styles.expertFieldValue}>{cfg.confidence}%</span>
                        </div>
                        <input type="range" min={30} max={95} step={1}
                          className={styles.expertSlider}
                          value={cfg.confidence}
                          onChange={(e) => patch({ confidence: +e.target.value })} />
                        <span className={styles.expertFieldHint}>낮을수록 더 많이 감지 (오탐 증가), 높을수록 정확하지만 누락 가능</span>
                      </div>

                      <div className={styles.expertField}>
                        <div className={styles.expertFieldHead}>
                          <span className={styles.expertFieldLabel}>최소 객체 크기</span>
                          <span className={styles.expertFieldValue}>{cfg.minSize}px</span>
                        </div>
                        <input type="range" min={10} max={200} step={5}
                          className={styles.expertSlider}
                          value={cfg.minSize}
                          onChange={(e) => patch({ minSize: +e.target.value })} />
                      </div>

                      <div className={styles.expertField}>
                        <div className={styles.expertFieldHead}>
                          <span className={styles.expertFieldLabel}>최대 객체 크기</span>
                          <span className={styles.expertFieldValue}>{cfg.maxSize}px</span>
                        </div>
                        <input type="range" min={200} max={1200} step={20}
                          className={styles.expertSlider}
                          value={cfg.maxSize}
                          onChange={(e) => patch({ maxSize: +e.target.value })} />
                      </div>
                    </div>

                    {/* 트래킹 */}
                    <div className={styles.expertSection}>
                      <div className={styles.expertSectionTitle}>트래킹</div>

                      <div className={styles.expertField}>
                        <div className={styles.expertFieldHead}>
                          <span className={styles.expertFieldLabel}>추적 유지 프레임</span>
                          <span className={styles.expertFieldValue}>{cfg.trackHold} frames</span>
                        </div>
                        <input type="range" min={5} max={120} step={1}
                          className={styles.expertSlider}
                          value={cfg.trackHold}
                          onChange={(e) => patch({ trackHold: +e.target.value })} />
                        <span className={styles.expertFieldHint}>객체가 일시 가려져도 이 프레임 수만큼 트래킹 유지</span>
                      </div>

                      <div className={styles.expertField}>
                        <div className={styles.expertFieldHead}>
                          <span className={styles.expertFieldLabel}>검증 프레임 수</span>
                          <span className={styles.expertFieldValue}>{cfg.confirmFrames} frames</span>
                        </div>
                        <input type="range" min={1} max={30} step={1}
                          className={styles.expertSlider}
                          value={cfg.confirmFrames}
                          onChange={(e) => patch({ confirmFrames: +e.target.value })} />
                        <span className={styles.expertFieldHint}>이벤트 확정 전 연속 감지 프레임 — 깜박임 방지</span>
                      </div>
                    </div>

                    {/* 모델 */}
                    <div className={styles.expertSection}>
                      <div className={styles.expertSectionTitle}>적용 모델</div>
                      <div className={styles.expertField}>
                        <div className={styles.expertModelRow}>
                          {MODEL_OPTS.map((m) => (
                            <button
                              key={m.value}
                              type="button"
                              className={[styles.expertModelBtn, cfg.model === m.value ? styles.expertModelBtnActive : ''].filter(Boolean).join(' ')}
                              onClick={() => patch({ model: m.value })}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>}

                  {expertTab === 'area' && <>
                    <div className={styles.expertSection}>
                      <div className={styles.expertSectionTitle}>등록된 영역 ({polys.length})</div>
                      {polys.length === 0 && (
                        <div className={styles.expertAreaEmpty}>설정된 영역이 없습니다. "영역 그리기"로 추가하세요.</div>
                      )}
                      {polys.length > 0 && (
                        <div className={styles.expertPolyList}>
                          {polys.map((poly, i) => (
                            <div key={poly.id} className={styles.expertPolyRow}>
                              <span className={styles.expertPolyLabel}>영역 {i + 1}</span>
                              <span className={styles.expertPolyMeta}>{poly.points.length}개 vertex</span>
                              <button
                                type="button"
                                className={styles.expertPolyDelBtn}
                                onClick={() => handlePolygonRemove(algo.id, poly.id)}
                                aria-label="영역 삭제"
                                title="영역 삭제"
                              >
                                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                  <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className={styles.expertSection}>
                      <div className={styles.expertSectionTitle}>그리기</div>
                      {expertDrawMode ? (
                        <div className={styles.expertDrawHint}>
                          <span>좌측 영상 위를 클릭해서 점을 찍고, 첫 점 근처를 다시 클릭하면 영역이 완성됩니다.</span>
                          <button
                            type="button"
                            className={styles.expertDrawCancelBtn}
                            onClick={() => setExpertDrawMode(false)}
                          >
                            그리기 취소
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className={styles.expertDrawBtn}
                          onClick={() => setExpertDrawMode(true)}
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                          새 영역 그리기
                        </button>
                      )}
                      <span className={styles.expertFieldHint}>이 영역 안에서만 감지가 동작합니다. 여러 영역을 추가할 수 있어요.</span>
                    </div>
                  </>}
                </div>
              </div>

              <div className={styles.expertFoot}>
                <Button variant="secondary" size="sm" onClick={close}>닫기</Button>
                <Button variant="primary" size="sm" onClick={save}>저장</Button>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}
