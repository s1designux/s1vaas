import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export function PublicOnly({ children }: { children: ReactNode }) {
  const isAuthed = useAuthStore((s) => s.isAuthed);
  if (isAuthed) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
