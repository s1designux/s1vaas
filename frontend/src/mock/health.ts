// TODO: replace with fetch('/api/v1/devices/health')
import type { Camera } from '@/types/camera';
import type { DeviceHealthMeta, SiteHealthSummary, StorageBucket } from '@/types/health';
import { camerasSeed } from './cameras';
import { sitesSeed } from './sites';

const NOW = Date.parse('2026-04-23T08:00:00+09:00');

const DAY = 86400;
const HOUR = 3600;

interface SeedRow {
  fw: string;
  uptimeSec: number;
  bitrateKbps: number;
  lastKfMinAgo: number;
  diskUsedPct: number;
  cpuPct: number;
  tempC: number;
  packetLossPct: number;
}

/** cameraId 별 결정적 메타. status='offline' 카메라는 severity=critical 로 강제. */
const RAW: Record<string, SeedRow> = {
  'cam-01': { fw: '1.2.4', uptimeSec: 21 * DAY + 4 * HOUR, bitrateKbps: 2860, lastKfMinAgo: 0, diskUsedPct: 62, cpuPct: 38, tempC: 42, packetLossPct: 0.1 },
  'cam-02': { fw: '1.2.4', uptimeSec: 18 * DAY + 9 * HOUR, bitrateKbps: 1820, lastKfMinAgo: 0, diskUsedPct: 71, cpuPct: 44, tempC: 45, packetLossPct: 0.2 },
  'cam-03': { fw: '1.2.3', uptimeSec: 9 * DAY + 2 * HOUR,  bitrateKbps: 1480, lastKfMinAgo: 0, diskUsedPct: 55, cpuPct: 32, tempC: 41, packetLossPct: 0.3 },
  'cam-04': { fw: '1.3.0-beta', uptimeSec: 3 * DAY + 11 * HOUR, bitrateKbps: 0, lastKfMinAgo: 4, diskUsedPct: 28, cpuPct: 22, tempC: 38, packetLossPct: 0.0 },

  'cam-05': { fw: '1.2.3', uptimeSec: 27 * DAY + 1 * HOUR, bitrateKbps: 0, lastKfMinAgo: 6, diskUsedPct: 48, cpuPct: 19, tempC: 39, packetLossPct: 0.1 },
  'cam-06': { fw: '1.2.3', uptimeSec: 27 * DAY + 1 * HOUR, bitrateKbps: 1280, lastKfMinAgo: 1, diskUsedPct: 67, cpuPct: 36, tempC: 43, packetLossPct: 0.4 },
  'cam-07': { fw: '1.2.4', uptimeSec: 12 * DAY + 7 * HOUR, bitrateKbps: 2240, lastKfMinAgo: 0, diskUsedPct: 78, cpuPct: 51, tempC: 47, packetLossPct: 0.5 },

  'cam-08': { fw: '1.2.3', uptimeSec: 0,                   bitrateKbps: 0, lastKfMinAgo: 86, diskUsedPct: 91, cpuPct: 0,  tempC: 0,  packetLossPct: 100 },
  'cam-09': { fw: '1.2.3', uptimeSec: 5 * DAY + 18 * HOUR, bitrateKbps: 1640, lastKfMinAgo: 0, diskUsedPct: 82, cpuPct: 47, tempC: 49, packetLossPct: 1.2 },
  'cam-10': { fw: '1.2.3', uptimeSec: 5 * DAY + 18 * HOUR, bitrateKbps: 1320, lastKfMinAgo: 0, diskUsedPct: 60, cpuPct: 33, tempC: 42, packetLossPct: 0.2 },
  'cam-11': { fw: '1.2.4', uptimeSec: 14 * DAY + 6 * HOUR, bitrateKbps: 0, lastKfMinAgo: 7, diskUsedPct: 33, cpuPct: 20, tempC: 39, packetLossPct: 0.0 },

  'cam-12': { fw: '1.3.0-beta', uptimeSec: 2 * DAY + 4 * HOUR, bitrateKbps: 3072, lastKfMinAgo: 0, diskUsedPct: 44, cpuPct: 28, tempC: 41, packetLossPct: 0.0 },
  'cam-13': { fw: '1.3.0-beta', uptimeSec: 2 * DAY + 4 * HOUR, bitrateKbps: 2980, lastKfMinAgo: 0, diskUsedPct: 51, cpuPct: 30, tempC: 42, packetLossPct: 0.0 },
  'cam-14': { fw: '1.2.4', uptimeSec: 19 * DAY + 22 * HOUR, bitrateKbps: 0, lastKfMinAgo: 9, diskUsedPct: 39, cpuPct: 17, tempC: 38, packetLossPct: 0.1 },
  'cam-15': { fw: '1.2.4', uptimeSec: 19 * DAY + 22 * HOUR, bitrateKbps: 2560, lastKfMinAgo: 0, diskUsedPct: 58, cpuPct: 34, tempC: 44, packetLossPct: 0.2 },

  'cam-16': { fw: '1.2.3', uptimeSec: 31 * DAY + 5 * HOUR, bitrateKbps: 1480, lastKfMinAgo: 0, diskUsedPct: 73, cpuPct: 41, tempC: 46, packetLossPct: 0.6 },
  'cam-17': { fw: '1.2.3', uptimeSec: 0,                   bitrateKbps: 0, lastKfMinAgo: 132, diskUsedPct: 88, cpuPct: 0, tempC: 0, packetLossPct: 100 },
  'cam-18': { fw: '1.2.3', uptimeSec: 31 * DAY + 5 * HOUR, bitrateKbps: 1280, lastKfMinAgo: 0, diskUsedPct: 64, cpuPct: 29, tempC: 40, packetLossPct: 0.3 },

  'cam-19': { fw: '1.2.3', uptimeSec: 47 * DAY + 12 * HOUR, bitrateKbps: 1180, lastKfMinAgo: 0, diskUsedPct: 81, cpuPct: 38, tempC: 48, packetLossPct: 0.9 },
  'cam-20': { fw: '1.2.3', uptimeSec: 47 * DAY + 12 * HOUR, bitrateKbps: 0, lastKfMinAgo: 5, diskUsedPct: 55, cpuPct: 21, tempC: 41, packetLossPct: 0.2 },
};

/** firmware 최신 라인 — 이 외 버전은 fwUpToDate=false. */
const LATEST_FW = '1.2.4';

function severityOf(cam: Camera, raw: SeedRow): import('@/types/health').HealthSeverity {
  if (cam.status === 'offline') return 'critical';
  if (raw.diskUsedPct >= 85 || raw.tempC >= 50 || raw.packetLossPct >= 2) return 'critical';
  if (raw.diskUsedPct >= 75 || raw.tempC >= 46 || raw.cpuPct >= 70 || raw.packetLossPct >= 0.7) return 'warn';
  if (!cam.firmware.startsWith('4.2') && raw.fw !== LATEST_FW) return 'warn';
  return 'ok';
}

function buildHealthMap(): Record<string, DeviceHealthMeta> {
  const out: Record<string, DeviceHealthMeta> = {};
  for (const cam of camerasSeed) {
    const raw = RAW[cam.id] ?? {
      fw: '1.2.3',
      uptimeSec: 7 * DAY,
      bitrateKbps: 1280,
      lastKfMinAgo: 0,
      diskUsedPct: 50,
      cpuPct: 30,
      tempC: 40,
      packetLossPct: 0.2,
    };
    const lastKf = new Date(NOW - raw.lastKfMinAgo * 60 * 1000).toISOString();
    out[cam.id] = {
      cameraId: cam.id,
      firmwareVersion: raw.fw,
      uptimeSec: raw.uptimeSec,
      bitrateKbps: raw.bitrateKbps,
      lastKeyframeAt: lastKf,
      diskUsedPct: raw.diskUsedPct,
      cpuPct: raw.cpuPct,
      tempC: raw.tempC,
      fwUpToDate: raw.fw === LATEST_FW,
      packetLossPct: raw.packetLossPct,
      severity: severityOf(cam, raw),
    };
  }
  return out;
}

export const MOCK_HEALTH_BY_CAMERA: Record<string, DeviceHealthMeta> = buildHealthMap();

/** GB 단위 number — 사용량 합 5.0TB (이벤트 1.2 / 상시 3.4 / 스냅샷 0.4 / 여유 1.0) = 6.0TB 풀. */
export const MOCK_STORAGE_BUCKETS: StorageBucket[] = [
  { label: '이벤트 클립', bytes: 1200, color: 'accent' },
  { label: '상시 녹화',   bytes: 3400, color: 'success' },
  { label: '스냅샷',      bytes: 400,  color: 'warn' },
  { label: '여유 공간',   bytes: 1000, color: 'neutral' },
];

export function siteHealthSummaries(
  cameras: Camera[] = camerasSeed,
  health: Record<string, DeviceHealthMeta> = MOCK_HEALTH_BY_CAMERA,
): SiteHealthSummary[] {
  const byId = new Map<string, SiteHealthSummary>();
  for (const s of sitesSeed) {
    byId.set(s.id, {
      siteId: s.id,
      siteName: s.name,
      total: 0,
      online: 0,
      offline: 0,
      warn: 0,
      critical: 0,
    });
  }
  for (const cam of cameras) {
    const sum = byId.get(cam.siteId);
    if (!sum) continue;
    sum.total += 1;
    if (cam.status === 'offline') sum.offline += 1;
    else sum.online += 1;
    const sev = health[cam.id]?.severity;
    if (sev === 'warn') sum.warn += 1;
    if (sev === 'critical') sum.critical += 1;
  }
  return Array.from(byId.values());
}
