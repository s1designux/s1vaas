export type ScheduleMode = 'continuous' | 'motion' | 'event' | 'off';

export interface Schedule {
  id: string;
  cameraId: string;
  weekdayMask: number;
  startMinute: number;
  endMinute: number;
  mode: ScheduleMode;
}
