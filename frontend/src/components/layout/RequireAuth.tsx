import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export function RequireAuth({ children }: { children: ReactNode }) {
  const isAuthed = useAuthStore((s) => s.isAuthed);
  if (!isAuthed) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
