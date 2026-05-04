'use client';

import { useDeviceContext } from '@/hooks/useDeviceContext';
import { Toaster } from 'sonner';

/**
 * 디바이스 환경에 따라 토스트 위치가 변경되는 커스텀 Toaster
 * - 모바일 웹뷰: 화면 상단 중앙 (top-center)
 * - 그 외: 기본 위치 (bottom-right)
 */
export function SonnerToaster() {
  const { isWebView } = useDeviceContext();

  return <Toaster richColors position={isWebView ? 'top-center' : 'bottom-right'} />;
}
