export type CameraStatus = 'online' | 'offline' | 'recording';
export type CameraCodec = 'H.264' | 'H.265';

export interface CameraZone {
  id: string;
  type: 'privacy_mask' | 'line_crossing' | 'intrusion';
  coords: Array<[number, number]>;
}

export interface CameraFlags {
  intrusionDetection: boolean;
  faceMatching: boolean;
  lpr: boolean;
  lineCrossing: boolean;
}

export type CameraSensitivity = 'low' | 'mid' | 'high';

export interface Camera {
  id: string;
  /** 계정/소유 경계 — 가입 시 자동발급 계약처(N번호). 카메라가 등록된 계약처. */
  contractId: string;
  /** 단일 홈 사이트(장소 그룹). 아직 배치 안 됐으면 null(미지정). */
  siteId: string | null;
  name: string;
  ip: string;
  model: string;
  firmware: string;
  status: CameraStatus;
  recording: boolean;
  codec: CameraCodec;
  fps: number;
  resolution: string;
  storageGb: number;
  zones: CameraZone[];
  flags: CameraFlags;
  sensitivity: CameraSensitivity;
  updatedAt: string;
}
