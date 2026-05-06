import type { AppUser } from '@/types/user';

export const usersSeed: AppUser[] = [
  { id: 'u-01', username: 'admin',      email: 'admin@s1vaas.test', displayName: '김관리', role: 'admin',     lastLoginAt: '2026-04-23T07:50:00+09:00', createdAt: '2024-01-10T10:00:00+09:00' },
  { id: 'u-02', username: 'operator01', email: 'op1@s1vaas.test',   displayName: '박운영', role: 'operator',  lastLoginAt: '2026-04-23T06:12:00+09:00', createdAt: '2024-02-05T09:00:00+09:00' },
  { id: 'u-03', username: 'monitor02',  email: 'mon2@s1vaas.test',  displayName: '이감시', role: 'monitor',   lastLoginAt: '2026-04-22T22:01:00+09:00', createdAt: '2024-04-15T11:30:00+09:00' },
  { id: 'u-04', username: 'inspect03',  email: 'ins3@s1vaas.test',  displayName: '최점검', role: 'inspector', lastLoginAt: '2026-04-20T15:45:00+09:00', createdAt: '2024-06-01T14:00:00+09:00' },
  { id: 'u-05', username: 'viewer04',   email: 'view4@s1vaas.test', displayName: '정뷰어', role: 'readonly',  lastLoginAt: null,                        createdAt: '2025-12-20T09:20:00+09:00' },
];
