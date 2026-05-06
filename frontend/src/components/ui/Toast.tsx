// Toast 는 useToast.tsx 의 ToastProvider/useToast 훅을 통해 사용합니다.
// 스택 렌더링은 프로바이더 내부에서 담당하므로 여기서는 타입만 re-export.
export { ToastProvider, useToast } from '@/hooks/useToast';
export type { ToastTone, ToastItem } from '@/hooks/useToast';
