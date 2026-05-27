import type { Site } from '@/types/site';

// 사이트 = 계약처(계약명) 하위에 고객이 빌드하는 장소(층/구역). 계약처당 여러 개 가능.
// s-01~s-06 은 기존 id 유지(events 등 참조 호환), s-11~ 는 추가 층/구역.
export const sitesSeed: Site[] = [
  // 에스원빌딩 강남 (c-0001)
  { id: 's-01', contractId: 'c-0001', name: '1층 로비',    address: '서울 강남구 테헤란로 152', lat: 37.5013, lng: 127.0396, cameraCount: 2, onlineCount: 2 },
  { id: 's-11', contractId: 'c-0001', name: '2층 사무실',  address: '서울 강남구 테헤란로 152', lat: 37.5013, lng: 127.0396, cameraCount: 1, onlineCount: 1 },
  { id: 's-12', contractId: 'c-0001', name: '지하 주차장', address: '서울 강남구 테헤란로 152', lat: 37.5013, lng: 127.0396, cameraCount: 1, onlineCount: 1 },
  // 서초 사옥 (c-0002)
  { id: 's-02', contractId: 'c-0002', name: '1층',         address: '서울 서초구 서초대로 396', lat: 37.4913, lng: 127.0075, cameraCount: 2, onlineCount: 2 },
  { id: 's-13', contractId: 'c-0002', name: '주차장',      address: '서울 서초구 서초대로 396', lat: 37.4913, lng: 127.0075, cameraCount: 1, onlineCount: 1 },
  // 송파 타워 (c-0003)
  { id: 's-03', contractId: 'c-0003', name: '지하 창고',   address: '서울 송파구 올림픽로 300', lat: 37.5133, lng: 127.1020, cameraCount: 1, onlineCount: 0 },
  { id: 's-14', contractId: 'c-0003', name: '1층 매장',    address: '서울 송파구 올림픽로 300', lat: 37.5133, lng: 127.1020, cameraCount: 1, onlineCount: 1 },
  { id: 's-15', contractId: 'c-0003', name: '주차장',      address: '서울 송파구 올림픽로 300', lat: 37.5133, lng: 127.1020, cameraCount: 2, onlineCount: 2 },
  // 판교 R&D 센터 (c-0004)
  { id: 's-04', contractId: 'c-0004', name: '입구·로비',   address: '경기 성남 판교역로 235',   lat: 37.3950, lng: 127.1103, cameraCount: 2, onlineCount: 2 },
  { id: 's-16', contractId: 'c-0004', name: '서버룸',      address: '경기 성남 판교역로 235',   lat: 37.3950, lng: 127.1103, cameraCount: 1, onlineCount: 1 },
  // 부산 사옥 (c-0005)
  { id: 's-05', contractId: 'c-0005', name: '정문',        address: '부산 해운대구 센텀중앙로 90', lat: 35.1689, lng: 129.1305, cameraCount: 1, onlineCount: 1 },
  { id: 's-17', contractId: 'c-0005', name: '로비·주차장', address: '부산 해운대구 센텀중앙로 90', lat: 35.1689, lng: 129.1305, cameraCount: 2, onlineCount: 1 },
  // 제주 물류센터 (c-0006)
  { id: 's-06', contractId: 'c-0006', name: '적재장',      address: '제주 제주시 첨단로 213',   lat: 33.4541, lng: 126.7047, cameraCount: 1, onlineCount: 1 },
];
