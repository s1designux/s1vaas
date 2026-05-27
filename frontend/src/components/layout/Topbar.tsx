import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useDataStore } from '@/store/dataStore';
import { useUIStore } from '@/store/uiStore';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { EventDrawer } from '@/components/ui/EventDrawer';
import { useToast } from '@/hooks/useToast';
import { relativeTime } from '@/lib/time';
import type { AppEvent, EventLevel } from '@/types';
import styles from './Topbar.module.css';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': '대시보드',
  '/monitoring': '실시간 보기',
  '/alerts': '알림 센터',
  '/search': '지난 영상 찾기',
  '/ai-safety': '안심 AI 설정',
  '/cases': '사건철',
  '/dispatch': '출동 관제',
  '/camera-settings': '카메라 관리',
  '/site': '매장 관리',
  '/health': '장비 상태',
  '/user': '사용자 관리',
  '/settings': '환경 설정',
};

const LEVEL_TONE: Record<EventLevel, BadgeTone> = {
  info: 'info',
  warning: 'warn',
  danger: 'danger',
  success: 'success',
};

export function Topbar() {
  const loc = useLocation();
  const nav = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const events = useDataStore((s) => s.events);
  const patchEvent = useDataStore((s) => s.patchEvent);
  const toggleMobileNav = useUIStore((s) => s.toggleMobileNav);
  const toast = useToast();

  const [notifOpen, setNotifOpen] = useState(false);
  const [eventDetail, setEventDetail] = useState<AppEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const bellWrapRef = useRef<HTMLDivElement>(null);

  const unread = useMemo(
    () =>
      [...events]
        .filter((e) => !e.acknowledged)
        .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
        .slice(0, 8),
    [events],
  );

  useEffect(() => {
    if (!notifOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (bellWrapRef.current && !bellWrapRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [notifOpen]);

  const title = PAGE_TITLES[loc.pathname] ?? '';
  const initial = user?.displayName?.charAt(0) ?? 'U';

  function handleLogout() {
    logout();
    nav('/login', { replace: true });
  }

  const ackAll = () => {
    const count = unread.length;
    unread.forEach((e) => patchEvent(e.id, { acknowledged: true }));
    toast.success('모두 확인', `${count}건의 이벤트를 확인 처리했습니다.`);
    setNotifOpen(false);
  };

  const openEventDetail = (ev: AppEvent) => {
    setEventDetail(ev);
    setNotifOpen(false);
  };

  function handleSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && searchQuery.trim()) {
      nav(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button
          type="button"
          className={styles.hamburger}
          onClick={toggleMobileNav}
          aria-label="메뉴 열기"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <span className={styles.title}>{title}</span>
      </div>

      <div className={styles.center}>
        <div className={styles.searchWrap}>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="자연어로 사람·차량·이벤트를 검색하세요"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKey}
            aria-label="빠른 검색"
          />
          <span className={styles.searchIcon} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </span>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.bellWrap} ref={bellWrapRef}>
          <button
            type="button"
            className={styles.bell}
            onClick={() => setNotifOpen((p) => !p)}
            aria-label={`알림 ${unread.length}건`}
            aria-expanded={notifOpen}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6 8a6 6 0 0 1 12 0v5l1.5 2.5A.75.75 0 0 1 18.9 17H5.1a.75.75 0 0 1-.65-1.125L6 13V8Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path d="M9.5 19.5a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            {unread.length > 0 && (
              <span className={styles.bellBadge}>{unread.length > 9 ? '9+' : unread.length}</span>
            )}
          </button>
          {notifOpen && (
            <div className={styles.popover} role="dialog" aria-label="알림">
              <div className={styles.popoverHeader}>
                <span className={styles.popoverTitle}>미확인 이벤트 ({unread.length})</span>
                {unread.length > 0 && (
                  <button type="button" className={styles.popoverAckAll} onClick={ackAll}>
                    모두 확인
                  </button>
                )}
              </div>
              <div className={styles.popoverList}>
                {unread.length === 0 && (
                  <div className={styles.popoverEmpty}>미확인 이벤트가 없습니다.</div>
                )}
                {unread.map((e) => (
                  <div
                    key={e.id}
                    className={styles.popoverItem}
                    onClick={() => openEventDetail(e)}
                  >
                    <Badge tone={LEVEL_TONE[e.level]} dot>
                      {e.level}
                    </Badge>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className={styles.popoverItemMsg}>{e.message}</div>
                      <div className={styles.popoverItemMeta}>{relativeTime(e.occurredAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <ThemeToggle />
        {user && (
          <span className={styles.user}>
            <span className={styles.avatar}>{initial}</span>
            <span className={styles.userLabel}>
              {user.displayName}
              <span className={styles.role}>{user.role}</span>
            </span>
          </span>
        )}
        <span className={styles.desktopLogout}>
          <Button variant="secondary" size="sm" onClick={handleLogout}>
            로그아웃
          </Button>
        </span>
      </div>

      <EventDrawer event={eventDetail} onClose={() => setEventDetail(null)} />
    </header>
  );
}
