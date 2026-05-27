import type { Contract } from '@/types/contract';

// 계약처 = 가입 시 자동발급되는 고객 계정 번호(code) + 계약명(name).
// 한 고객(companyId)이 여러 계약처를 보유할 수 있다. 사이트(층/구역)는 고객이 직접 빌드.
export const contractsSeed: Contract[] = [
  { id: 'c-0001', code: 'N123456-1', name: '에스원빌딩 강남', companyId: 'acme',  startDate: '2024-01-01', endDate: null,         status: 'active',    siteIds: ['s-01', 's-11', 's-12'] },
  { id: 'c-0002', code: 'N123456-2', name: '서초 사옥',       companyId: 'acme',  startDate: '2024-03-15', endDate: null,         status: 'active',    siteIds: ['s-02', 's-13'] },
  { id: 'c-0003', code: 'N224110-7', name: '송파 타워',       companyId: 'acme',  startDate: '2024-06-01', endDate: null,         status: 'active',    siteIds: ['s-03', 's-14', 's-15'] },
  { id: 'c-0004', code: 'N301778-2', name: '판교 R&D 센터',   companyId: 'nova',  startDate: '2023-11-20', endDate: null,         status: 'active',    siteIds: ['s-04', 's-16'] },
  { id: 'c-0005', code: 'N118443-9', name: '부산 사옥',       companyId: 'yeong', startDate: '2023-09-01', endDate: '2026-08-31', status: 'active',    siteIds: ['s-05', 's-17'] },
  { id: 'c-0006', code: 'N402991-3', name: '제주 물류센터',   companyId: 'nova',  startDate: '2024-10-05', endDate: null,         status: 'suspended', siteIds: ['s-06'] },
];
