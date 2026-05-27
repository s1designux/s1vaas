// 즐겨찾기(빠른 보기) — 계약처를 가로지르는 가상 카메라 컬렉션.
// 사이트(단일 홈)와 달리 카메라를 '참조'만 하며 소속은 바꾸지 않는다(다중 참조).
export interface FavoriteView {
  id: string;
  /** 소유 고객(계정). 여러 계약처를 묶는 단위 = Contract.companyId */
  ownerId: string;
  name: string;
  /** 참조하는 카메라 id 목록 (다중, 계약처 가로지름) */
  cameraIds: string[];
}
