import type { Camera } from '@/types/camera';
import { sitesSeed } from './sites';

const t = '2026-04-23T08:00:00+09:00';

// 사이트 → 계약처(소유) 매핑. 카메라 contractId 는 등록 사이트의 계약처에서 파생.
const siteContract: Record<string, string> = Object.fromEntries(
  sitesSeed.map((s) => [s.id, s.contractId]),
);
// 미지정(사이트 미배정) 데모 — 계약처엔 등록됐지만 아직 사이트에 안 들어간 카메라.
const UNASSIGNED = new Set(['cam-15', 'cam-20']);

const raw: Omit<Camera, 'contractId'>[] = [
  // Gangnam (s-01) — 4
  { id: 'cam-01', siteId: 's-01', name: 'CAM-01 강남본점 1F 로비',   ip: '10.11.2.11', model: 'S1-IPX4500', firmware: '4.2.1', status: 'recording', recording: true,  codec: 'H.265', fps: 30, resolution: '3840x2160', storageGb: 512, zones: [], flags: { intrusionDetection: true,  faceMatching: true,  lpr: false, lineCrossing: true  }, sensitivity: 'mid',  updatedAt: t },
  { id: 'cam-02', siteId: 's-01', name: 'CAM-02 강남본점 주차장',     ip: '10.11.2.12', model: 'S1-IPX4500', firmware: '4.2.1', status: 'online',    recording: true,  codec: 'H.265', fps: 25, resolution: '1920x1080', storageGb: 256, zones: [], flags: { intrusionDetection: true,  faceMatching: false, lpr: true,  lineCrossing: true  }, sensitivity: 'high', updatedAt: t },
  { id: 'cam-03', siteId: 's-01', name: 'CAM-03 강남본점 엘리베이터', ip: '10.11.2.13', model: 'S1-IPX3200', firmware: '4.2.0', status: 'recording', recording: true,  codec: 'H.264', fps: 30, resolution: '1920x1080', storageGb: 256, zones: [], flags: { intrusionDetection: false, faceMatching: true,  lpr: false, lineCrossing: false }, sensitivity: 'mid',  updatedAt: t },
  { id: 'cam-04', siteId: 's-01', name: 'CAM-04 강남본점 옥상',       ip: '10.11.2.14', model: 'S1-IPX4500', firmware: '4.2.1', status: 'online',    recording: false, codec: 'H.265', fps: 30, resolution: '3840x2160', storageGb: 256, zones: [], flags: { intrusionDetection: true,  faceMatching: false, lpr: false, lineCrossing: true  }, sensitivity: 'high', updatedAt: t },

  // Seocho (s-02) — 3
  { id: 'cam-05', siteId: 's-02', name: 'CAM-05 서초지점 출입구',     ip: '10.12.3.21', model: 'S1-IPX3200', firmware: '4.1.9', status: 'online',    recording: false, codec: 'H.264', fps: 30, resolution: '1920x1080', storageGb: 256, zones: [], flags: { intrusionDetection: false, faceMatching: true,  lpr: false, lineCrossing: false }, sensitivity: 'low',  updatedAt: t },
  { id: 'cam-06', siteId: 's-02', name: 'CAM-06 서초지점 로비',       ip: '10.12.3.22', model: 'S1-IPX3200', firmware: '4.1.9', status: 'recording', recording: true,  codec: 'H.264', fps: 25, resolution: '1920x1080', storageGb: 128, zones: [], flags: { intrusionDetection: false, faceMatching: true,  lpr: false, lineCrossing: false }, sensitivity: 'mid',  updatedAt: t },
  { id: 'cam-07', siteId: 's-02', name: 'CAM-07 서초지점 주차장',     ip: '10.12.3.23', model: 'S1-IPX4500', firmware: '4.2.1', status: 'online',    recording: true,  codec: 'H.265', fps: 30, resolution: '1920x1080', storageGb: 256, zones: [], flags: { intrusionDetection: true,  faceMatching: false, lpr: true,  lineCrossing: true  }, sensitivity: 'mid',  updatedAt: t },

  // Songpa (s-03) — 4
  { id: 'cam-08', siteId: 's-03', name: 'CAM-08 송파 지하창고',       ip: '10.13.4.31', model: 'S1-IPX2100', firmware: '4.0.7', status: 'offline',   recording: false, codec: 'H.264', fps: 15, resolution: '1280x720',  storageGb: 128, zones: [], flags: { intrusionDetection: true,  faceMatching: false, lpr: false, lineCrossing: true  }, sensitivity: 'mid',  updatedAt: '2026-04-23T07:12:00+09:00' },
  { id: 'cam-09', siteId: 's-03', name: 'CAM-09 송파 1F 매장',         ip: '10.13.4.32', model: 'S1-IPX3200', firmware: '4.1.9', status: 'recording', recording: true,  codec: 'H.264', fps: 30, resolution: '1920x1080', storageGb: 256, zones: [], flags: { intrusionDetection: true,  faceMatching: true,  lpr: false, lineCrossing: false }, sensitivity: 'high', updatedAt: t },
  { id: 'cam-10', siteId: 's-03', name: 'CAM-10 송파 주차장 A',        ip: '10.13.4.33', model: 'S1-IPX3200', firmware: '4.1.9', status: 'online',    recording: true,  codec: 'H.264', fps: 25, resolution: '1920x1080', storageGb: 256, zones: [], flags: { intrusionDetection: true,  faceMatching: false, lpr: true,  lineCrossing: true  }, sensitivity: 'mid',  updatedAt: t },
  { id: 'cam-11', siteId: 's-03', name: 'CAM-11 송파 옥외 정문',       ip: '10.13.4.34', model: 'S1-IPX4500', firmware: '4.2.1', status: 'online',    recording: false, codec: 'H.265', fps: 30, resolution: '3840x2160', storageGb: 256, zones: [], flags: { intrusionDetection: true,  faceMatching: false, lpr: false, lineCrossing: true  }, sensitivity: 'low',  updatedAt: t },

  // Pangyo (s-04) — 4
  { id: 'cam-12', siteId: 's-04', name: 'CAM-12 판교 R&D 입구',       ip: '10.14.5.41', model: 'S1-IPX4500', firmware: '4.2.1', status: 'recording', recording: true,  codec: 'H.265', fps: 30, resolution: '3840x2160', storageGb: 512, zones: [], flags: { intrusionDetection: true,  faceMatching: true,  lpr: true,  lineCrossing: true  }, sensitivity: 'high', updatedAt: t },
  { id: 'cam-13', siteId: 's-04', name: 'CAM-13 판교 R&D 서버룸',     ip: '10.14.5.42', model: 'S1-IPX4500', firmware: '4.2.1', status: 'recording', recording: true,  codec: 'H.265', fps: 30, resolution: '3840x2160', storageGb: 512, zones: [], flags: { intrusionDetection: true,  faceMatching: true,  lpr: false, lineCrossing: true  }, sensitivity: 'high', updatedAt: t },
  { id: 'cam-14', siteId: 's-04', name: 'CAM-14 판교 R&D 카페테리아', ip: '10.14.5.43', model: 'S1-IPX3200', firmware: '4.2.0', status: 'online',    recording: false, codec: 'H.264', fps: 25, resolution: '1920x1080', storageGb: 256, zones: [], flags: { intrusionDetection: false, faceMatching: true,  lpr: false, lineCrossing: false }, sensitivity: 'low',  updatedAt: t },
  { id: 'cam-15', siteId: 's-04', name: 'CAM-15 판교 R&D 옥상',       ip: '10.14.5.44', model: 'S1-IPX4500', firmware: '4.2.1', status: 'online',    recording: true,  codec: 'H.265', fps: 30, resolution: '3840x2160', storageGb: 256, zones: [], flags: { intrusionDetection: true,  faceMatching: false, lpr: false, lineCrossing: true  }, sensitivity: 'mid',  updatedAt: t },

  // Busan (s-05) — 3
  { id: 'cam-16', siteId: 's-05', name: 'CAM-16 부산 지사 정문',       ip: '10.15.6.51', model: 'S1-IPX3200', firmware: '4.1.9', status: 'recording', recording: true,  codec: 'H.264', fps: 30, resolution: '1920x1080', storageGb: 256, zones: [], flags: { intrusionDetection: true,  faceMatching: true,  lpr: true,  lineCrossing: true  }, sensitivity: 'high', updatedAt: t },
  { id: 'cam-17', siteId: 's-05', name: 'CAM-17 부산 지사 주차장',     ip: '10.15.6.52', model: 'S1-IPX3200', firmware: '4.1.9', status: 'offline',   recording: false, codec: 'H.264', fps: 25, resolution: '1920x1080', storageGb: 128, zones: [], flags: { intrusionDetection: true,  faceMatching: false, lpr: true,  lineCrossing: true  }, sensitivity: 'mid',  updatedAt: '2026-04-23T06:42:00+09:00' },
  { id: 'cam-18', siteId: 's-05', name: 'CAM-18 부산 지사 로비',       ip: '10.15.6.53', model: 'S1-IPX3200', firmware: '4.1.9', status: 'online',    recording: true,  codec: 'H.264', fps: 30, resolution: '1920x1080', storageGb: 256, zones: [], flags: { intrusionDetection: false, faceMatching: true,  lpr: false, lineCrossing: false }, sensitivity: 'low',  updatedAt: t },

  // Jeju (s-06) — 2
  { id: 'cam-19', siteId: 's-06', name: 'CAM-19 제주 물류 적재장',     ip: '10.16.7.61', model: 'S1-IPX2100', firmware: '4.0.7', status: 'recording', recording: true,  codec: 'H.264', fps: 25, resolution: '1920x1080', storageGb: 256, zones: [], flags: { intrusionDetection: true,  faceMatching: false, lpr: true,  lineCrossing: true  }, sensitivity: 'mid',  updatedAt: t },
  { id: 'cam-20', siteId: 's-06', name: 'CAM-20 제주 물류 출입구',     ip: '10.16.7.62', model: 'S1-IPX2100', firmware: '4.0.7', status: 'online',    recording: false, codec: 'H.264', fps: 30, resolution: '1920x1080', storageGb: 128, zones: [], flags: { intrusionDetection: false, faceMatching: true,  lpr: true,  lineCrossing: false }, sensitivity: 'mid',  updatedAt: t },
];

export const camerasSeed: Camera[] = raw.map((c) => ({
  ...c,
  // 소유 계약처: 원래 등록 사이트의 계약처에서 파생(사이트 미배정이어도 소유는 유지).
  contractId: (c.siteId && siteContract[c.siteId]) || 'c-0001',
  siteId: UNASSIGNED.has(c.id) ? null : c.siteId,
}));
