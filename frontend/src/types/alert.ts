export type AlertStatus = 'open' | 'ack' | 'resolved' | 'snoozed';
export type AlertPriority = 'low' | 'mid' | 'high' | 'critical';
// AI 알고리즘 타입 (안심 AI 설정의 SCENARIO_CONCERNS와 동기) + 시스템 타입(emergency/offline/storage/tamper)
export type AlertType =
  | 'intrusion'
  | 'loitering'
  | 'virtual_fence'
  | 'fire'
  | 'parking'
  | 'people_counting'
  | 'privacy'
  | 'motion'
  | 'emergency'
  | 'offline'
  | 'storage'
  | 'tamper';

export interface SecurityAlert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  status: AlertStatus;
  siteId: string;
  siteName: string;
  cameraId: string;
  cameraName: string;
  occurredAt: string; // ISO
  message: string;
  assignedTo?: string; // 담당자 이름 (없으면 미배정)
  responseMin?: number; // ack 까지 걸린 분 (closed 일 때)
  ruleName: string;
  snapshotSeed: string; // SVG fallback seed
  notes: { at: string; by: string; text: string }[];
}
