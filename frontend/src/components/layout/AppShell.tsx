import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Gnb } from './Gnb';
import styles from './AppShell.module.css';

export function AppShell() {
  return (
    <div className={styles.shell}>
      <Gnb />
      <Sidebar />
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
