// API_TARGET: GET /api/v1/{contracts,sites,cameras,users,events,schedules} — 교체 시 seed 만 fetch 로 대체
import { create } from 'zustand';
import type {
  Contract,
  Site,
  Camera,
  AppUser,
  AppEvent,
  Schedule,
  UserRole,
  CameraAlgorithm,
  ZonePolygon,
} from '@/types';
import { contractsSeed } from '@/mock/contracts';
import { sitesSeed } from '@/mock/sites';
import { camerasSeed } from '@/mock/cameras';
import { usersSeed } from '@/mock/users';
import { eventsSeed } from '@/mock/events';
import { schedulesSeed } from '@/mock/schedules';
import { algorithmsSeed } from '@/mock/algorithms';

interface InviteInput {
  email: string;
  displayName?: string;
  role: UserRole;
  siteIds?: string[];
}

interface DataState {
  contracts: Contract[];
  sites: Site[];
  cameras: Camera[];
  users: AppUser[];
  events: AppEvent[];
  schedules: Schedule[];
  algorithms: CameraAlgorithm[];
  patchCamera: (id: string, patch: Partial<Camera>) => void;
  ackEvent: (id: string) => void;
  patchEvent: (id: string, patch: Partial<AppEvent>) => void;
  patchUser: (id: string, patch: Partial<AppUser>) => void;
  updateSite: (id: string, patch: Partial<Site>) => void;
  addSite: (input: Omit<Site, 'id' | 'cameraCount' | 'onlineCount'>) => void;
  inviteUser: (input: InviteInput) => void;
  updateUser: (id: string, patch: Partial<AppUser>) => void;
  removeUser: (id: string) => void;
  patchAlgorithm: (
    cameraId: string,
    algoId: string,
    patch: Partial<Pick<CameraAlgorithm, 'enabled' | 'sensitivity' | 'zones' | 'polygons'>>,
  ) => void;
  addAlgorithmZone: (cameraId: string, algoId: string) => string;
  removeAlgorithmZone: (cameraId: string, algoId: string, zoneIdx: number) => void;
  /** ROI polygon 추가 — 내부에서 polygon.id 자동 부여 후 push, 반환값은 새 polygon id */
  addAlgorithmPolygon: (
    cameraId: string,
    algoId: string,
    polygon: Omit<ZonePolygon, 'id'>,
  ) => string;
  removeAlgorithmPolygon: (cameraId: string, algoId: string, polygonId: string) => void;
}

export const useDataStore = create<DataState>((set) => ({
  contracts: contractsSeed,
  sites: sitesSeed,
  cameras: camerasSeed,
  users: usersSeed,
  events: eventsSeed,
  schedules: schedulesSeed,
  algorithms: algorithmsSeed,
  patchCamera: (id, patch) =>
    set((s) => ({
      cameras: s.cameras.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),
  ackEvent: (id) =>
    set((s) => ({
      events: s.events.map((e) => (e.id === id ? { ...e, acknowledged: true } : e)),
    })),
  patchEvent: (id, patch) =>
    set((s) => ({
      events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    })),
  patchUser: (id, patch) =>
    set((s) => ({
      users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
    })),
  updateSite: (id, patch) =>
    set((s) => ({
      sites: s.sites.map((st) => (st.id === id ? { ...st, ...patch } : st)),
    })),
  addSite: (input) =>
    set((s) => ({
      sites: [
        ...s.sites,
        {
          ...input,
          id: `site-${Date.now().toString(36)}`,
          cameraCount: 0,
          onlineCount: 0,
        },
      ],
    })),
  inviteUser: (input) =>
    set((s) => ({
      users: [
        ...s.users,
        {
          id: `u-${Date.now().toString(36)}`,
          username: input.email.split('@')[0] ?? 'user',
          email: input.email,
          displayName: input.displayName || input.email.split('@')[0] || '신규 사용자',
          role: input.role,
          lastLoginAt: null,
          createdAt: new Date().toISOString(),
          status: 'invited',
          siteIds: input.siteIds ?? [],
          mfaEnabled: false,
        },
      ],
    })),
  updateUser: (id, patch) =>
    set((s) => ({
      users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
    })),
  removeUser: (id) =>
    set((s) => ({
      users: s.users.filter((u) => u.id !== id),
    })),
  patchAlgorithm: (cameraId, algoId, patch) =>
    set((s) => ({
      algorithms: s.algorithms.map((a) =>
        a.cameraId === cameraId && a.id === algoId ? { ...a, ...patch } : a,
      ),
    })),
  addAlgorithmZone: (cameraId, algoId) => {
    let nextLabel = '영역1';
    set((s) => ({
      algorithms: s.algorithms.map((a) => {
        if (a.cameraId !== cameraId || a.id !== algoId) return a;
        const label = `영역${a.zones.length + 1}`;
        nextLabel = label;
        return { ...a, zones: [...a.zones, label] };
      }),
    }));
    return nextLabel;
  },
  removeAlgorithmZone: (cameraId, algoId, zoneIdx) =>
    set((s) => ({
      algorithms: s.algorithms.map((a) =>
        a.cameraId === cameraId && a.id === algoId
          ? { ...a, zones: a.zones.filter((_, i) => i !== zoneIdx) }
          : a,
      ),
    })),
  addAlgorithmPolygon: (cameraId, algoId, polygon) => {
    const id = `poly-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000).toString(36)}`;
    set((s) => ({
      algorithms: s.algorithms.map((a) =>
        a.cameraId === cameraId && a.id === algoId
          ? { ...a, polygons: [...(a.polygons ?? []), { ...polygon, id }] }
          : a,
      ),
    }));
    return id;
  },
  removeAlgorithmPolygon: (cameraId, algoId, polygonId) =>
    set((s) => ({
      algorithms: s.algorithms.map((a) =>
        a.cameraId === cameraId && a.id === algoId
          ? { ...a, polygons: (a.polygons ?? []).filter((p) => p.id !== polygonId) }
          : a,
      ),
    })),
}));
