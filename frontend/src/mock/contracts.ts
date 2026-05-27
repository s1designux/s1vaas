import type { Contract } from '@/types/contract';

export const contractsSeed: Contract[] = [
  { id: 'c-0001', code: 'N123456-1', name: '강남 본점',   displayName: '강남', companyId: 'acme',   startDate: '2024-01-01', endDate: null,         status: 'active',    siteIds: ['s-01'] },
  { id: 'c-0002', code: 'N123456-2', name: '서초 지점',   displayName: '서초', companyId: 'acme',   startDate: '2024-03-15', endDate: null,         status: 'active',    siteIds: ['s-02'] },
  { id: 'c-0003', code: 'N224110-7', name: '송파 지점',   displayName: '송파', companyId: 'acme',   startDate: '2024-06-01', endDate: null,         status: 'active',    siteIds: ['s-03'] },
  { id: 'c-0004', code: 'N301778-2', name: '판교 R&D 센터', displayName: '판교', companyId: 'nova', startDate: '2023-11-20', endDate: null,         status: 'active',    siteIds: ['s-04'] },
  { id: 'c-0005', code: 'N118443-9', name: '부산 지사',   displayName: '부산', companyId: 'yeong',  startDate: '2023-09-01', endDate: '2026-08-31', status: 'active',    siteIds: ['s-05'] },
  { id: 'c-0006', code: 'N402991-3', name: '제주 물류',   displayName: '제주', companyId: 'nova',   startDate: '2024-10-05', endDate: null,         status: 'suspended', siteIds: ['s-06'] },
];
