import { useLocation } from 'react-router-dom';
import styles from './PageHeader.module.css';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': '대시보드',
  '/monitoring': '실시간 보기',
  '/alerts': '알림 센터',
  '/search': '지난 영상 찾기',
  '/ai-safety': '안심 AI 설정',
  '/cases': '사건철',
  '/dispatch': '출동 관제',
  '/camera-settings': '카메라 관리',
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
