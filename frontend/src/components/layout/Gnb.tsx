import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useDataStore } from '@/store/dataStore';
import { useUIStore } from '@/store/uiStore';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { EventDrawer } from '@/components/ui/EventDrawer';
import { useToast } from '@/hooks/useToast';
import { relativeTime } from '@/lib/time';
import type { AppEvent, EventLevel } from '@/types';
import styles from './Gnb.module.css';

const LEVEL_TONE: Record<EventLevel, BadgeTone> = {
  info: 'info',
  warning: 'warn',
  danger: 'danger',
  success: 'success',
};

const ROLE_LABEL: Record<string, string> = {
  admin: '관리자',
  operator: '운영자',
  monitor: '모니터요원',
  inspector: '점검자',
  readonly: '읽기전용',
};

export function Gnb() {
  const nav = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const events = useDataStore((s) => s.events);
  const patchEvent = useDataStore((s) => s.patchEvent);
  const toggleMobileNav = useUIStore((s) => s.toggleMobileNav);
  const toast = useToast();

  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [eventDetail, setEventDetail] = useState<AppEvent | null>(null);

  const bellWrapRef = useRef<HTMLDivElement>(null);
  const userWrapRef = useRef<HTMLDivElement>(null);

  const unread = useMemo(
    () =>
      [...events]
        .filter((e) => !e.acknowledged)
        .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
        .slice(0, 8),
    [events],
  );

  useEffect(() => {
    if (!notifOpen && !userOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (notifOpen && bellWrapRef.current && !bellWrapRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (userOpen && userWrapRef.current && !userWrapRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setNotifOpen(false); setUserOpen(false); }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [notifOpen, userOpen]);

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

  return (
    <header className={styles.gnb}>
      <div className={styles.left}>
        <button
          type="button"
          className={styles.hamburger}
          onClick={toggleMobileNav}
          aria-label="메뉴 열기"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <div className={styles.brand}>
          <Logo size={28} variant="symbol" />
          <div className={styles.brandName}>
            <span className={styles.brandTitle}>에스원 클라우드</span>
            <span className={styles.brandSub}>영상관제시스템</span>
          </div>
        </div>
      </div>

      <div className={styles.right}>
        {/* 알림 */}
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
              <path
                d="M9.5 19.5a2.5 2.5 0 0 0 5 0"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
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

        {/* 모드 변경 */}
        <ThemeToggle />

        {/* 사용자 메뉴 */}
        <div className={styles.userWrap} ref={userWrapRef}>
          <button
            type="button"
            className={styles.userBtn}
            onClick={() => setUserOpen((p) => !p)}
            aria-label="사용자 메뉴"
            aria-expanded={userOpen}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </button>

          {userOpen && user && (
            <div className={styles.userDropdown} role="menu">
              <div className={styles.userInfo}>
                <div className={styles.userInfoName}>{user.displayName}</div>
                <div className={styles.userInfoMeta}>{user.email}</div>
                <div className={styles.userInfoMeta}>에스원 · {ROLE_LABEL[user.role] ?? user.role}</div>
              </div>
              <div className={styles.userDivider} />
              <button
                type="button"
                className={styles.menuItem}
                role="menuitem"
                onClick={() => { setUserOpen(false); nav('/user'); }}
              >
                내 정보
              </button>
              <button
                type="button"
                className={styles.menuItem}
                role="menuitem"
                onClick={() => { setUserOpen(false); handleLogout(); }}
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>

      <EventDrawer event={eventDetail} onClose={() => setEventDetail(null)} />
    </header>
  );
}
