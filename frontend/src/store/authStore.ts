// API_TARGET: POST /api/v1/auth/login — fetch 교체 시 login() 구현만 변경, shape 유지
import { create } from 'zustand';
import type { AuthSession, UserRole } from '@/types';

interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
}

interface AuthState {
  session: AuthSession | null;
  user: AuthUser | null;
  isAuthed: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hydrateFromStorage: () => void;
}

const SESSION_KEY = 's1vaas-session';
const USER_KEY = 's1vaas-user';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isAuthed: false,
  login: async (email, password) => {
    // TODO: replace with fetch('/api/v1/auth/login', { method: 'POST', body: ... })
    // 데모 자격증명은 dev 빌드에서만 분기 (CL_A11Y_P1_01). PROD 에서는 백엔드 응답 의존 분기로 교체될 자리.
    if (import.meta.env.DEV && email === 'admin@s1vaas.test' && password === 's1vaas') {
      const session: AuthSession = {
        userId: 'u-01',
        role: 'admin',
        issuedAt: new Date().toISOString(),
      };
      const user: AuthUser = {
        id: 'u-01',
        email,
        displayName: '김관리',
        role: 'admin',
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      set({ session, user, isAuthed: true });
      return true;
    }
    return false;
  },
  logout: () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(USER_KEY);
    set({ session: null, user: null, isAuthed: false });
  },
  hydrateFromStorage: () => {
    const session = readJson<AuthSession>(SESSION_KEY);
    const user = readJson<AuthUser>(USER_KEY);
    if (!session || !user) {
      set({ session: null, user: null, isAuthed: false });
      return;
    }
    const issuedMs = Date.parse(session.issuedAt);
    if (Number.isNaN(issuedMs) || Date.now() - issuedMs > SESSION_TTL_MS) {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(USER_KEY);
      set({ session: null, user: null, isAuthed: false });
      return;
    }
    set({ session, user, isAuthed: true });
  },
}));
