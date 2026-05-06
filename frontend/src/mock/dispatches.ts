// TODO: replace with fetch('/api/v1/dispatch')
import type { DispatchTicket, DispatchEvent, DispatchState, DispatchReason } from '@/types/dispatch';

const SITES: { id: string; name: string }[] = [
  { id: 'site-gn', name: '강남 본점' },
  { id: 'site-sc', name: '서초 지점' },
  { id: 'site-sp', name: '송파 지점' },
  { id: 'site-pg', name: '판교 R&D' },
  { id: 'site-bs', name: '부산 지사' },
  { id: 'site-jj', name: '제주 물류' },
];

const RESPONDERS: { name: string; phone: string }[] = [
  { name: '김수호', phone: '010-2234-1101' },
  { name: '이정민', phone: '010-3845-2207' },
  { name: '박철수', phone: '010-7712-3398' },
  { name: '최보안', phone: '010-5523-4480' },
  { name: '정대원', phone: '010-9988-5571' },
  { name: '한경비', phone: '010-4456-6602' },
];

const REASON_NOTES: Record<DispatchReason, string[]> = {
  intrusion: [
    '후문 사람 감지, 야간 외부인 의심',
    '창고 측 펜스 절단 흔적 신고',
    '비상계단 인기척 반복 감지',
    '주차장 펜스 침입 알림',
  ],
  fire: [
    '서버실 연기 감지기 작동',
    '주방 화재 알람 연동 신호',
    '창고 화재 수신기 1차 발보',
  ],
  visitor: [
    '심야 방문 의심, 본인 확인 필요',
    'VIP 방문 경호 동행 요청',
    '경비실 외 출입 요청',
  ],
  check: [
    '정기 야간 순찰 점검',
    '시설 점검 동행 요청',
    '보안 라운드 정시 점검',
  ],
  panic: [
    '비상 버튼 작동, 즉시 출동',
    '직원 위협 신고, 패닉 알람',
    'POS 강도 알람',
  ],
  maintenance: [
    '카메라 5번 오프라인 점검',
    '센서 단선 의심 점검',
    '도어락 오작동 현장 확인',
  ],
};

const REASONS: DispatchReason[] = ['intrusion', 'fire', 'visitor', 'check', 'panic', 'maintenance'];

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function dispatchId(seq: number, baseDate: Date): string {
  const yyyy = baseDate.getFullYear();
  const mm = pad(baseDate.getMonth() + 1);
  const dd = pad(baseDate.getDate());
  return `D-${yyyy}-${mm}${dd}-${pad(seq)}`;
}

function isoMinusMin(now: number, minAgo: number): string {
  return new Date(now - minAgo * 60 * 1000).toISOString();
}

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function buildEvents(
  state: DispatchState,
  receivedAt: string,
  etaMin: number,
  responder: string,
  closedAt?: string,
  arrivedAt?: string,
): DispatchEvent[] {
  const events: DispatchEvent[] = [];
  const t0 = Date.parse(receivedAt);
  events.push({ state: 'received', at: receivedAt, by: '관제센터', note: '신고 접수' });

  if (state === 'received') return events;

  const departAt = new Date(t0 + 90 * 1000).toISOString();
  events.push({ state: 'en_route', at: departAt, by: responder, note: '출동 차량 출발' });
  if (state === 'en_route') return events;

  const sceneAt = arrivedAt ?? new Date(t0 + etaMin * 60 * 1000).toISOString();
  events.push({ state: 'on_scene', at: sceneAt, by: responder, note: '현장 도착, 상황 확인 중' });
  if (state === 'on_scene') return events;

  const close = closedAt ?? new Date(Date.parse(sceneAt) + 18 * 60 * 1000).toISOString();
  events.push({ state: 'closed', at: close, by: responder, note: '상황 종료, 시건 확인 후 철수' });
  return events;
}

const now = Date.now();

// 진행 중 — received 3 / en_route 5 / on_scene 4 = 12건
const inProgressPlan: { state: DispatchState; minAgo: number }[] = [
  { state: 'received', minAgo: 2 },
  { state: 'received', minAgo: 4 },
  { state: 'received', minAgo: 6 },
  { state: 'en_route', minAgo: 8 },
  { state: 'en_route', minAgo: 11 },
  { state: 'en_route', minAgo: 14 },
  { state: 'en_route', minAgo: 17 },
  { state: 'en_route', minAgo: 21 },
  { state: 'on_scene', minAgo: 25 },
  { state: 'on_scene', minAgo: 32 },
  { state: 'on_scene', minAgo: 38 },
  { state: 'on_scene', minAgo: 46 },
];

const inProgress: DispatchTicket[] = inProgressPlan.map((p, i) => {
  const reason = pick(REASONS, i + 1);
  const site = pick(SITES, i);
  const responder = pick(RESPONDERS, i);
  const etaMin = 8 + ((i * 3) % 12); // 8 ~ 19분
  const receivedAt = isoMinusMin(now, p.minAgo);
  const arrivedAt =
    p.state === 'on_scene' || p.state === 'closed'
      ? isoMinusMin(now, Math.max(0, p.minAgo - etaMin - 1))
      : undefined;
  const notesPool = REASON_NOTES[reason];
  return {
    id: dispatchId(i + 1, new Date(now)),
    alertId: i % 2 === 0 ? `A-2026-0501-${pad(120 + i)}` : undefined,
    siteId: site.id,
    siteName: site.name,
    reason,
    state: p.state,
    responder: responder.name,
    responderPhone: responder.phone,
    receivedAt,
    etaMin,
    arrivedAt,
    notes: pick(notesPool, i),
    events: buildEvents(p.state, receivedAt, etaMin, responder.name, undefined, arrivedAt),
  };
});

// 종결 30건
const closed: DispatchTicket[] = Array.from({ length: 30 }).map((_, idx) => {
  const i = idx + 100;
  const reason = pick(REASONS, i);
  const site = pick(SITES, i + 2);
  const responder = pick(RESPONDERS, i + 1);
  const etaMin = 6 + ((i * 5) % 18); // 6~23분
  // 오늘 종결 18건 + 최근 며칠 12건
  const todayCloseHourAgo = (idx % 18) + 1;
  const closeAgoMin =
    idx < 18 ? todayCloseHourAgo * 60 + (idx * 7) % 50 : (idx - 17) * 24 * 60 + (idx * 13) % 600;
  const closedAt = isoMinusMin(now, closeAgoMin);
  const totalSpanMin = 30 + ((i * 11) % 60); // 30~89분 처리
  const receivedAt = isoMinusMin(now, closeAgoMin + totalSpanMin);
  // 도착 소요 = etaMin (대부분), 일부는 초과
  const actualEta = idx % 5 === 0 ? etaMin + 5 : Math.max(3, etaMin - ((idx * 2) % 4));
  const arrivedAt = new Date(Date.parse(receivedAt) + actualEta * 60 * 1000).toISOString();
  return {
    id: dispatchId(idx + 1, new Date(Date.parse(closedAt))),
    alertId: idx % 3 === 0 ? `A-2026-0430-${pad(40 + idx)}` : undefined,
    siteId: site.id,
    siteName: site.name,
    reason,
    state: 'closed',
    responder: responder.name,
    responderPhone: responder.phone,
    receivedAt,
    etaMin,
    arrivedAt,
    closedAt,
    notes: pick(REASON_NOTES[reason], idx),
    events: buildEvents('closed', receivedAt, actualEta, responder.name, closedAt, arrivedAt),
  };
});

export const dispatchSeed: DispatchTicket[] = [...inProgress, ...closed];
