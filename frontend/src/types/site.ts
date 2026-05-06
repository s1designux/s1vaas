export interface Site {
  id: string;
  contractId: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  cameraCount: number;
  onlineCount: number;
  imageUrl?: string;
  /** Phase G — panel-2026-04-28 GPT 생성 빌딩 실사 (CL_BRAND_P2_02 6색 그라디언트 대체) */
  thumbnail?: string;
}
