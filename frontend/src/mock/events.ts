import type { AppEvent } from '@/types/event';

// occurredAt 은 current session 이 import 될 때 기준으로 상대적으로 계산한다.
// "최근 5분 이내 3건 / 오늘 10건 / 7일 이내 12건" 분포 맞춤.
const now = Date.now();
const m = (min: number) => new Date(now - min * 60_000).toISOString();

export const eventsSeed: AppEvent[] = [
  // Within 5 minutes — 3 (most recent first)
  { id: 'e-2001', cameraId: 'cam-02', siteId: 's-01', type: 'intrusion',     level: 'warning', message: 'CAM-02 강남본점 주차장 침입 감지', occurredAt: m(1),   acknowledged: false, snapshotUrl: '/mock/snap_2001.jpg' },
  { id: 'e-2002', cameraId: 'cam-08', siteId: 's-03', type: 'offline',       level: 'danger',  message: 'CAM-08 송파 지하창고 오프라인',   occurredAt: m(3),   acknowledged: false },
  { id: 'e-2003', cameraId: 'cam-12', siteId: 's-04', type: 'face_match',    level: 'info',    message: 'CAM-12 판교 R&D 얼굴 매칭: 김관리', occurredAt: m(4),   acknowledged: false },

  // Within today (5 min ~ 24h) — 10
  { id: 'e-2004', cameraId: 'cam-17', siteId: 's-05', type: 'offline',       level: 'danger',  message: 'CAM-17 부산 주차장 오프라인',     occurredAt: m(82),  acknowledged: false },
  { id: 'e-2005', cameraId: null,     siteId: null,   type: 'storage_warn',  level: 'warning', message: '송파 저장소 사용량 85%',           occurredAt: m(130), acknowledged: false },
  { id: 'e-2006', cameraId: 'cam-10', siteId: 's-03', type: 'lpr',           level: 'info',    message: 'CAM-10 송파 주차장 번호판 인식: 12가 3456', occurredAt: m(155), acknowledged: true },
  { id: 'e-2007', cameraId: 'cam-01', siteId: 's-01', type: 'line_crossing', level: 'success', message: 'CAM-01 강남 라인 크로싱 정상 검증', occurredAt: m(180), acknowledged: true },
  { id: 'e-2008', cameraId: 'cam-13', siteId: 's-04', type: 'motion',        level: 'info',    message: 'CAM-13 판교 서버룸 움직임',        occurredAt: m(220), acknowledged: true },
  { id: 'e-2009', cameraId: 'cam-19', siteId: 's-06', type: 'intrusion',     level: 'warning', message: 'CAM-19 제주 적재장 침입 감지',    occurredAt: m(290), acknowledged: true },
  { id: 'e-2010', cameraId: 'cam-05', siteId: 's-02', type: 'face_match',    level: 'info',    message: 'CAM-05 서초 출입구 얼굴 매칭: 박운영', occurredAt: m(340), acknowledged: true },
  { id: 'e-2011', cameraId: 'cam-16', siteId: 's-05', type: 'online',        level: 'success', message: 'CAM-16 부산 정문 연결 복구',       occurredAt: m(400), acknowledged: true },
  { id: 'e-2012', cameraId: 'cam-07', siteId: 's-02', type: 'lpr',           level: 'info',    message: 'CAM-07 서초 주차장 번호판 인식: 34나 7890', occurredAt: m(510), acknowledged: true },
  { id: 'e-2013', cameraId: null,     siteId: 's-01', type: 'storage_warn',  level: 'info',    message: '강남 저장소 사용량 62%',           occurredAt: m(720), acknowledged: true },

  // 24h ~ 7d — 12
  { id: 'e-2014', cameraId: 'cam-09', siteId: 's-03', type: 'intrusion',     level: 'danger',  message: 'CAM-09 송파 1F 매장 비인가 접근', occurredAt: m(60 * 26),  acknowledged: true },
  { id: 'e-2015', cameraId: 'cam-04', siteId: 's-01', type: 'offline',       level: 'warning', message: 'CAM-04 강남 옥상 일시 오프라인',   occurredAt: m(60 * 31),  acknowledged: true },
  { id: 'e-2016', cameraId: 'cam-18', siteId: 's-05', type: 'online',        level: 'success', message: 'CAM-18 부산 로비 복구',            occurredAt: m(60 * 38),  acknowledged: true },
  { id: 'e-2017', cameraId: 'cam-15', siteId: 's-04', type: 'motion',        level: 'info',    message: 'CAM-15 판교 옥상 움직임',          occurredAt: m(60 * 50),  acknowledged: true },
  { id: 'e-2018', cameraId: 'cam-20', siteId: 's-06', type: 'line_crossing', level: 'warning', message: 'CAM-20 제주 출입구 라인 크로싱',   occurredAt: m(60 * 66),  acknowledged: true },
  { id: 'e-2019', cameraId: 'cam-11', siteId: 's-03', type: 'face_match',    level: 'info',    message: 'CAM-11 송파 정문 얼굴 매칭: 이감시', occurredAt: m(60 * 74),  acknowledged: true },
  { id: 'e-2020', cameraId: null,     siteId: null,   type: 'storage_warn',  level: 'warning', message: '제주 물류 저장소 사용량 78%',       occurredAt: m(60 * 92),  acknowledged: true },
  { id: 'e-2021', cameraId: 'cam-03', siteId: 's-01', type: 'motion',        level: 'info',    message: 'CAM-03 강남 엘리베이터 움직임',     occurredAt: m(60 * 110), acknowledged: true },
  { id: 'e-2022', cameraId: 'cam-06', siteId: 's-02', type: 'face_match',    level: 'info',    message: 'CAM-06 서초 로비 얼굴 매칭: 정뷰어', occurredAt: m(60 * 130), acknowledged: true },
  { id: 'e-2023', cameraId: 'cam-14', siteId: 's-04', type: 'intrusion',     level: 'warning', message: 'CAM-14 판교 카페테리아 야간 감지',  occurredAt: m(60 * 140), acknowledged: true },
  { id: 'e-2024', cameraId: 'cam-16', siteId: 's-05', type: 'online',        level: 'success', message: 'CAM-16 부산 정문 정기 점검',        occurredAt: m(60 * 150), acknowledged: true },
  { id: 'e-2025', cameraId: 'cam-02', siteId: 's-01', type: 'lpr',           level: 'info',    message: 'CAM-02 강남 주차장 번호판 인식: 56다 0123', occurredAt: m(60 * 160), acknowledged: true },
];
