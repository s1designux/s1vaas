export type EventLevel = 'info' | 'warning' | 'danger' | 'success';
export type EventType =
  | 'motion'
  | 'intrusion'
  | 'line_crossing'
  | 'face_match'
  | 'lpr'
  | 'offline'
  | 'online'
  | 'storage_warn';

export interface AppEvent {
  id: string;
  cameraId: string | null;
  siteId: string | null;
  type: EventType;
  level: EventLevel;
  message: string;
  occurredAt: string;
  acknowledged: boolean;
  snapshotUrl?: string;
}
