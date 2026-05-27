import { useLocation } from 'react-router-dom';
import styles from './PageHeader.module.css';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': '대시보드',
  '/monitoring': '모니터링',
  '/alerts': '알림 센터',
  '/search': 'AI 영상 검색',
  '/cases': '사건철',
  '/dispatch': '출동 관제',
  '/camera-settings': '카메라 설정',
  '/site': '사이트 관리',
  '/health': '장비 상태',
  '/user': '사용자 관리',
  '/settings': '환경 설정',
};

export function PageHeader() {
  const loc = useLocation();
  const title = PAGE_TITLES[loc.pathname];
  if (!title) return null;
  return (
    <div className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
    </div>
  );
}
