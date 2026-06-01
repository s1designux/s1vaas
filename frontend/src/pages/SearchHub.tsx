// 지난 영상 찾기 허브 — 알림 대시보드 / 영상 검색 두 개 하위 탭을 라인탭으로 묶어 표출.
import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs } from '@/components/ui/Tabs';
import Alerts from './Alerts';
import Search from './Search';
import page from './Page.module.css';

type HubTab = 'alerts' | 'video';

export default function SearchHub() {
  const loc = useLocation();
  const nav = useNavigate();
  const active: HubTab = loc.pathname.startsWith('/search/alerts') ? 'alerts' : 'video';

  return (
    <>
      <div className={page.flatTabsWrap}>
        <Tabs
          variant="line"
          active={active}
          onChange={(k) => nav(k === 'alerts' ? '/search/alerts' : '/search')}
          tabs={[
            { key: 'alerts', label: '알림 대시보드' },
            { key: 'video', label: '영상 검색' },
          ]}
        />
      </div>
      {active === 'alerts' ? <Alerts /> : <Search />}
    </>
  );
}
