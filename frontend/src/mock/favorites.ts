import type { FavoriteView } from '@/types/favorite';

// 즐겨찾기(빠른 보기) 시드 — 계약처를 가로지르는 가상 컬렉션.
// ownerId = Contract.companyId. 'acme' 고객(강남/서초/송파 계약처 보유)이 만든 보기 예시.
export const favoritesSeed: FavoriteView[] = [
  {
    id: 'fav-counter',
    ownerId: 'acme',
    name: '전 지점 카운터',
    cameraIds: ['cam-01', 'cam-06', 'cam-09'],
  },
  {
    id: 'fav-parking',
    ownerId: 'acme',
    name: '주차장 모아보기',
    cameraIds: ['cam-02', 'cam-07', 'cam-10'],
  },
];
