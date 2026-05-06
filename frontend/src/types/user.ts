export type UserRole = 'admin' | 'operator' | 'monitor' | 'inspector' | 'readonly';
export type UserStatus = 'active' | 'invited' | 'disabled';

export interface AppUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatarUrl?: string;
  lastLoginAt: string | null;
  createdAt: string;
  status?: UserStatus;
  mfaEnabled?: boolean;
  siteIds?: string[];
}
