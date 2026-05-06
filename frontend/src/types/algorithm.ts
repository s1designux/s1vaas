export type AlgorithmKind = 'basic' | 'ai';
export type AlgorithmSensitivity = 'low' | 'balanced' | 'high';

/** 0~1 normalized vertex point on the preview. */
export interface ZonePoint {
  x: number;
  y: number;
}

/** ROI polygon — points.length >= 3 (0~1 정규화 좌표). */
export interface ZonePolygon {
  id: string;
  points: ZonePoint[];
}

export interface CameraAlgorithm {
  id: string;
  cameraId: string;
  /** design_origin 내부 식별자 (motion / privacy / intrusion / loitering / virtual_fence / fire ...) */
  algoKey: string;
  kind: AlgorithmKind;
  label: string;
  desc: string;
  enabled: boolean;
  sensitivity: AlgorithmSensitivity;
  /** label-only legacy chips (하위 호환용) */
  zones: string[];
  /** ROI (Region of Interest) — preview 위에 그려진 다각형 (정규화 좌표) */
  polygons: ZonePolygon[];
}

export const MAX_AI_ALGOS = 2;

export const SENSITIVITY_OPTIONS: Array<{ value: AlgorithmSensitivity; label: string }> = [
  { value: 'low', label: '낮음' },
  { value: 'balanced', label: '균형' },
  { value: 'high', label: '높음' },
];
