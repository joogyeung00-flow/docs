'use client';

import { memo } from 'react';
import { Favicon, type FaviconSize } from '@/components/ui/favicon';
import { cn } from '@/lib/utils';

export interface ReferenceLogoIconsProps {
  /** 표시할 로고 URL 목록 (최대 maxCount개 표시) */
  logoUrls: string[];
  /** 최대 표시 개수 (기본 3) */
  maxCount?: number;
  /** Favicon 크기 (기본 md) */
  faviconSize?: FaviconSize;
  /** 추가 클래스명 */
  className?: string;
}

/**
 * 참조 로고 아이콘 그룹 (순수 UI)
 *
 * 겹치는(overlapping) 형태로 Favicon 아이콘을 렌더링합니다.
 * 채팅 컨텍스트 없이 logoUrls만으로 동작하는 순수 UI 컴포넌트입니다.
 */
export const ReferenceLogoIcons = memo(function ReferenceLogoIcons({
  logoUrls,
  maxCount = 3,
  faviconSize = 'md',
  className,
}: ReferenceLogoIconsProps) {
  const visibleUrls = logoUrls.slice(0, maxCount);

  if (visibleUrls.length === 0) return null;

  return (
    <div className={cn('relative flex shrink-0 flex-row-reverse items-center justify-start py-0 pl-0 pr-3', className)}>
      {visibleUrls.reverse().map((logoUrl, index) => (
        <div
          key={`logo-${logoUrl}-${index}`}
          className='relative mr-[-8px] shrink-0 transition-all duration-200 hover:z-10 hover:scale-110'
        >
          <Favicon src={logoUrl} size={faviconSize} alt={`Reference logo ${index + 1}`} />
        </div>
      ))}
    </div>
  );
});
