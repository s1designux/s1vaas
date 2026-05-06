export type AlertStatus = 'open' | 'ack' | 'resolved' | 'snoozed';
export type AlertPriority = 'low' | 'mid' | 'high' | 'critical';
export type AlertType = 'intrusion' | 'fire' | 'emergency' | 'offline' | 'storage' | 'tamper';

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
