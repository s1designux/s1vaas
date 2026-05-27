export type ContractStatus = 'active' | 'suspended' | 'expired';

export interface Contract {
  id: string;
  /** 계약처 번호 N12345* (가입 시 자동발급, 읽기 전용) */
  code: string;
  name: string;
  /** 고객이 붙이는 별칭(예: 강남). 트리 최상위 표시명. 없으면 code/name 사용. */
  displayName?: string;
  companyId: string | null;
  startDate: string;
  endDate: string | null;
  status: ContractStatus;
  siteIds: string[];
}
