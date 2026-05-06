import type { Schedule } from '@/types/schedule';

export const schedulesSeed: Schedule[] = [
  { id: 'sch-01', cameraId: 'cam-01', weekdayMask: 0b1111111, startMinute: 0,    endMinute: 1439, mode: 'continuous' },
  { id: 'sch-02', cameraId: 'cam-02', weekdayMask: 0b0111110, startMinute: 540,  endMinute: 1080, mode: 'motion' },
  { id: 'sch-03', cameraId: 'cam-05', weekdayMask: 0b1000001, startMinute: 0,    endMinute: 1439, mode: 'event' },
  { id: 'sch-04', cameraId: 'cam-12', weekdayMask: 0b1111111, startMinute: 1080, endMinute: 480,  mode: 'continuous' },
  { id: 'sch-05', cameraId: 'cam-19', weekdayMask: 0b0111110, startMinute: 360,  endMinute: 1320, mode: 'motion' },
];
