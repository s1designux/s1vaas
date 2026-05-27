export type { Contract, ContractStatus } from './contract';
export type { Site } from './site';
export type { FavoriteView } from './favorite';
export type {
  Camera,
  CameraStatus,
  CameraCodec,
  CameraZone,
  CameraFlags,
  CameraSensitivity,
} from './camera';
export type {
  CameraAlgorithm,
  AlgorithmKind,
  AlgorithmSensitivity,
  ZonePoint,
  ZonePolygon,
} from './algorithm';
export { MAX_AI_ALGOS, SENSITIVITY_OPTIONS } from './algorithm';
export type { AppUser, UserRole, UserStatus } from './user';
export type { AppEvent, EventLevel, EventType } from './event';
export type { Schedule, ScheduleMode } from './schedule';

export interface AuthSession {
  userId: string;
  role: import('./user').UserRole;
  issuedAt: string;
}
