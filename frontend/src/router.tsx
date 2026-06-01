import { HashRouter as BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RequireAuth } from '@/components/layout/RequireAuth';
import { PublicOnly } from '@/components/layout/PublicOnly';
import { AppShell } from '@/components/layout/AppShell';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Monitoring from '@/pages/Monitoring';
import SearchHub from '@/pages/SearchHub';
import AiSafety from '@/pages/AiSafety';
import Cases from '@/pages/Cases';
import Dispatch from '@/pages/Dispatch';
import CameraSettings from '@/pages/CameraSettings';
import Site from '@/pages/Site';
import Health from '@/pages/Health';
import User from '@/pages/User';
import Settings from '@/pages/Settings';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          }
        />
        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/monitoring" element={<Monitoring />} />
          {/* 알림 센터는 지난 영상 찾기 > 알림 대시보드 하위 탭으로 흡수 */}
          <Route path="/alerts" element={<Navigate to="/search/alerts" replace />} />
          <Route path="/search" element={<SearchHub />} />
          <Route path="/search/alerts" element={<SearchHub />} />
          <Route path="/ai-safety" element={<AiSafety />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/dispatch" element={<Dispatch />} />
          <Route path="/camera-settings" element={<CameraSettings />} />
          <Route path="/site" element={<Site />} />
          <Route path="/health" element={<Health />} />
          <Route path="/user" element={<User />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
