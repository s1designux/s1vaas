import { useEffect } from 'react';
import { AppRouter } from '@/router';
import { useAuthStore } from '@/store/authStore';
import { ToastProvider } from '@/hooks/useToast';

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrateFromStorage);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  return (
    <ToastProvider>
      <AppRouter />
    </ToastProvider>
  );
}
