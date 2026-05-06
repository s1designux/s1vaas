export type HealthSeverity = 'ok' | 'warn' | 'critical';

export interface DeviceHealthMeta {
  cameraId: string;
  firmwareVersion: string; // 1.2.3
  uptimeSec: number;
  bitrateKbps: number; // 라이브 스트림 비트레이트
  lastKeyframeAt: string; // ISO
  diskUsedPct: number; // 0..100
  cpuPct: number; // 0..100
  tempC: number; // 카메라 내부 온도
  fwUpToDate: boolean;
  packetLossPct: number;
  severity: HealthSeverity;
}

export interface SiteHealthSummary {
  siteId: string;
  siteName: string;
  total: number;
  online: number;
  offline: number;
  warn: number;
  critical: number;
}

export interface StorageBucket {
  label: string; // "이벤트 클립", "상시 녹화", "스냅샷", "여유"
  bytes: number;
  color: 'accent' | 'success' | 'warn' | 'danger' | 'neutral';
}
