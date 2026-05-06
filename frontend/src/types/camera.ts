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
  siteId: string;
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
