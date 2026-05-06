// TODO: replace with POST /api/v1/search
export type SearchMode = 'natural' | 'person' | 'vehicle' | 'lpr';
export type SearchSensitivity = 'low' | 'mid' | 'high';

export interface SearchFilter {
  mode: SearchMode;
  query: string;
  siteIds: string[];
  cameraIds: string[];
  from?: string; // ISO
  to?: string; // ISO
  sensitivity: SearchSensitivity;
}

export interface SearchResult {
  id: string;
  cameraId: string;
  cameraName: string;
  siteId: string;
  siteName: string;
  occurredAt: string; // ISO
  durationSec: number; // 클립 길이
  caption: string; // 한국어 한 줄
  score: number; // 0..1
  thumbnailSeed: string; // SVG fallback seed
  matchedAttributes: string[]; // ["빨간 상의","남성","20대"]
}

export interface SavedQuery {
  id: string;
  query: string;
  mode: SearchMode;
  savedAt: string;
}
