import type { Site } from '@/types/site';
// Phase G — panel-2026-04-28 GPT 에셋 (CL_BRAND_P2_02 6색 임의 그라디언트 대체)
import bldg01 from '@/assets/images/panel-2026-04-28/site_card_bldg_01.png';
import bldg02 from '@/assets/images/panel-2026-04-28/site_card_bldg_02.png';
import bldg03 from '@/assets/images/panel-2026-04-28/site_card_bldg_03.png';

export const sitesSeed: Site[] = [
  { id: 's-01', contractId: 'c-0001', name: '강남 본점',     address: '서울 강남구 테헤란로 152',    lat: 37.5013, lng: 127.0396, cameraCount: 4, onlineCount: 4, thumbnail: bldg01 },
  { id: 's-02', contractId: 'c-0002', name: '서초 지점',     address: '서울 서초구 서초대로 396',    lat: 37.4913, lng: 127.0075, cameraCount: 3, onlineCount: 3, thumbnail: bldg02 },
  { id: 's-03', contractId: 'c-0003', name: '송파 지점',     address: '서울 송파구 올림픽로 300',    lat: 37.5133, lng: 127.1020, cameraCount: 4, onlineCount: 3, thumbnail: bldg03 },
  { id: 's-04', contractId: 'c-0004', name: '판교 R&D 센터', address: '경기 성남 판교역로 235',      lat: 37.3950, lng: 127.1103, cameraCount: 4, onlineCount: 4 },
  { id: 's-05', contractId: 'c-0005', name: '부산 지사',     address: '부산 해운대구 센텀중앙로 90', lat: 35.1689, lng: 129.1305, cameraCount: 3, onlineCount: 2 },
  { id: 's-06', contractId: 'c-0006', name: '제주 물류센터', address: '제주 제주시 첨단로 213',      lat: 33.4541, lng: 126.7047, cameraCount: 2, onlineCount: 2 },
];
