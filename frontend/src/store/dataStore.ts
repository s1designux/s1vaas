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
  FavoriteView,
} from '@/types';
import { contractsSeed } from '@/mock/contracts';
import { sitesSeed } from '@/mock/sites';
import { camerasSeed } from '@/mock/cameras';
import { usersSeed } from '@/mock/users';
import { eventsSeed } from '@/mock/events';
import { schedulesSeed } from '@/mock/schedules';
import { algorithmsSeed } from '@/mock/algorithms';
import { favoritesSeed } from '@/mock/favorites';

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
  favorites: FavoriteView[];
  patchCamera: (id: string, patch: Partial<Camera>) => void;
  ackEvent: (id: string) => void;
  patchEvent: (id: string, patch: Partial<AppEvent>) => void;
  patchUser: (id: string, patch: Partial<AppUser>) => void;
  updateSite: (id: string, patch: Partial<Site>) => void;
  addSite: (input: Omit<Site, 'id' | 'cameraCount' | 'onlineCount'>) => string;
  removeSite: (id: string) => void;
  /** 카메라의 단일 홈 사이트 배치(소속 이동). null = 미지정으로. */
  assignCameraToSite: (cameraId: string, siteId: string | null) => void;
  /** 계약처 별칭 등 수정 */
  updateContract: (id: string, patch: Partial<Contract>) => void;
  /** 즐겨찾기(빠른 보기) CRUD — 카메라는 참조만(소속 불변) */
  addFavorite: (ownerId: string, name: string) => string;
  updateFavorite: (id: string, patch: Partial<Pick<FavoriteView, 'name' | 'cameraIds'>>) => void;
  removeFavorite: (id: string) => void;
  toggleFavoriteCamera: (favoriteId: string, cameraId: string) => void;
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
  favorites: favoritesSeed,
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
  addSite: (input) => {
    const id = `site-${Date.now().toString(36)}`;
    set((s) => ({
      sites: [...s.sites, { ...input, id, cameraCount: 0, onlineCount: 0 }],
    }));
    return id;
  },
  removeSite: (id) =>
    set((s) => ({
      sites: s.sites.filter((st) => st.id !== id),
      // 사이트 삭제 시 소속 카메라는 미지정으로 되돌림(소유 계약처는 유지).
      cameras: s.cameras.map((c) => (c.siteId === id ? { ...c, siteId: null } : c)),
    })),
  assignCameraToSite: (cameraId, siteId) =>
    set((s) => ({
      cameras: s.cameras.map((c) => (c.id === cameraId ? { ...c, siteId } : c)),
    })),
  updateContract: (id, patch) =>
    set((s) => ({
      contracts: s.contracts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),
  addFavorite: (ownerId, name) => {
    const id = `fav-${Date.now().toString(36)}`;
    set((s) => ({ favorites: [...s.favorites, { id, ownerId, name, cameraIds: [] }] }));
    return id;
  },
  updateFavorite: (id, patch) =>
    set((s) => ({
      favorites: s.favorites.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    })),
  removeFavorite: (id) =>
    set((s) => ({ favorites: s.favorites.filter((f) => f.id !== id) })),
  toggleFavoriteCamera: (favoriteId, cameraId) =>
    set((s) => ({
      favorites: s.favorites.map((f) =>
        f.id !== favoriteId
          ? f
          : {
              ...f,
              cameraIds: f.cameraIds.includes(cameraId)
                ? f.cameraIds.filter((cid) => cid !== cameraId)
                : [...f.cameraIds, cameraId],
            },
      ),
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
