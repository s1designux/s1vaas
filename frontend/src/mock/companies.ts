// 고객(계정) — 로그인 단위. 한 고객이 여러 계약처(N번호)를 보유할 수 있다.
// companyId = Contract.companyId / FavoriteView.ownerId 의 소유 키.
export interface Company {
  id: string;
  /** 고객(계정) 표시명 — 개인/상호 */
  name: string;
}

export const companiesSeed: Company[] = [
  { id: 'acme', name: '홍길동' },   // 계약처 3: 강남·서초·송파 (멀티 계약처 데모)
  { id: 'nova', name: '김다온' },   // 계약처 2: 판교·제주
  { id: 'yeong', name: '이서연' },  // 계약처 1: 부산
];
