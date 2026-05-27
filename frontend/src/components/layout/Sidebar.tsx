import { useEffect, type ReactElement } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useMenuStore } from '@/store/menuStore';
import styles from './Sidebar.module.css';

interface NavItem {
  path: string;
  label: string;
  icon: ReactElement;
}

function Icon({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={styles.icon}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

export const ALL_ITEMS: NavItem[] = [
  { path: '/dashboard',       label: '대시보드',     icon: <Icon d="M3 13h8V3H3v10zm10 8h8V11h-8v10zM3 21h8v-6H3v6zm10-18v6h8V3h-8z" /> },
  { path: '/monitoring',      label: '모니터링',     icon: <Icon d="M2 4h20v12H2zM2 20h20M10 16v4M14 16v4" /> },
  { path: '/alerts',          label: '알림 센터',    icon: <Icon d="M10 5a2 2 0 1 1 4 0v.5a6 6 0 0 1 3 5.5v3l1.5 2H5.5L7 14v-3a6 6 0 0 1 3-5.5V5zM9 19a3 3 0 0 0 6 0" /> },
  { path: '/search',          label: 'AI 영상 검색', icon: <Icon d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm5.5-2.5L21 21" /> },
  { path: '/cases',           label: '사건철',       icon: <Icon d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7zM9 14l2 2 4-4" /> },
  { path: '/dispatch',        label: '출동 관제',    icon: <Icon d="M5 13a7 7 0 0 1 14 0v3l1 2H4l1-2v-3zM3 11l2-1M21 11l-2-1M9 19a3 3 0 0 0 6 0" /> },
  { path: '/camera-settings', label: '카메라 설정',  icon: <Icon d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /> },
  { path: '/site',            label: '사이트 관리',  icon: <Icon d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /> },
  { path: '/health',          label: '장비 상태',    icon: <Icon d="M3 12h4l3-8 4 16 3-8h4" /> },
  { path: '/user',            label: '사용자 관리',  icon: <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /> },
  { path: '/settings',        label: '환경 설정',    icon: <Icon d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /> },
];

export function Sidebar() {
  const mobileNavOpen = useUIStore((s) => s.mobileNavOpen);
  const closeMobileNav = useUIStore((s) => s.closeMobileNav);
  const logout = useAuthStore((s) => s.logout);
  const hiddenPaths = useMenuStore((s) => s.hiddenPaths);
  const nav = useNavigate();
  const loc = useLocation();

  const ITEMS = ALL_ITEMS.filter((item) => !hiddenPaths.includes(item.path));

  // Close drawer on route change (mobile)
  useEffect(() => {
    closeMobileNav();
  }, [loc.pathname, closeMobileNav]);

  // ESC to close
  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobileNav();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileNavOpen, closeMobileNav]);

  function handleLogout() {
    closeMobileNav();
    logout();
    nav('/login', { replace: true });
  }

  return (
    <>
      {mobileNavOpen && (
        <div
          className={styles.overlay}
          onClick={closeMobileNav}
          aria-hidden="true"
        />
      )}
      <aside
        className={[styles.sidebar, mobileNavOpen ? styles.sidebarOpen : '']
          .filter(Boolean)
          .join(' ')}
      >
        <nav className={styles.nav}>
          {ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                [styles.item, isActive ? styles.active : ''].filter(Boolean).join(' ')
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          className={styles.mobileLogout}
          onClick={handleLogout}
        >
          로그아웃
        </button>
        <div className={styles.footer}>
          <span>v2.0.0</span>
          <span>
            <span className={styles.footerDot} /> 모든 시스템 정상
          </span>
        </div>
      </aside>
    </>
  );
}
