'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { forwardRef, ReactNode } from 'react';

// ============================================================================
// BaseReferenceCard - 모든 Reference 타입의 공통 카드 컨테이너
// ============================================================================

export interface BaseReferenceCardProps {
  /** 하이라이팅 상태 */
  isHighlighted?: boolean;
  /** 클릭 핸들러 */
  onClick?: () => void;
  /** 더블클릭 핸들러 */
  onDoubleClick?: () => void;
  /** 마우스 진입 핸들러 */
  onMouseEnter?: () => void;
  /** 마우스 이탈 핸들러 */
  onMouseLeave?: () => void;
  /** 카드 내부 콘텐츠 */
  children: ReactNode;
  /** 추가 className */
  className?: string;
}

/**
 * 모든 Reference 카드의 공통 컨테이너
 *
 * VectorReference, WebSearchReference, FlowSearchReference 카드의
 * 일관된 레이아웃과 하이라이팅 스타일을 제공합니다.
 */
export const BaseReferenceCard = forwardRef<HTMLDivElement, BaseReferenceCardProps>(
  ({ isHighlighted = false, onClick, onDoubleClick, onMouseEnter, onMouseLeave, children, className }, ref) => {
    return (
      <Card
        ref={ref}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={cn(
          // 기본 레이아웃 (웹서치와 동일하게 고정 높이 제거)
          'group flex w-full min-w-0 cursor-pointer flex-col rounded-lg shadow-md',
          // 애니메이션
          'transition-colors duration-200 ease-out',
          // 하이라이팅 상태
          isHighlighted
            ? 'border-2 border-purple-500 bg-purple-50 shadow-lg shadow-purple-200'
            : 'border-border bg-card hover:bg-accent border',
          className,
        )}
      >
        {children}
      </Card>
    );
  },
);

BaseReferenceCard.displayName = 'BaseReferenceCard';

// ============================================================================
// 하이라이팅 상태에 따른 텍스트 스타일 유틸리티
// ============================================================================

export const highlightStyles = {
  /** 메타 정보 (출처, 날짜 등) */
  meta: (isHighlighted: boolean) => cn('text-xs', isHighlighted ? 'text-purple-600' : 'text-muted-foreground'),
  /** 날짜 */
  date: (isHighlighted: boolean) =>
    cn('flex-shrink-0 text-2xs', isHighlighted ? 'text-purple-500' : 'text-muted-foreground/70'),
  /** 제목 */
  title: (isHighlighted: boolean) =>
    cn('line-clamp-1 text-sm font-medium', isHighlighted ? 'text-purple-900' : 'text-foreground'),
  /** 설명 */
  description: (isHighlighted: boolean) =>
    cn('line-clamp-2 text-xs leading-relaxed', isHighlighted ? 'text-purple-700' : 'text-muted-foreground'),
  /** 인덱스 뱃지 */
  indexBadge: (isHighlighted: boolean) =>
    cn(
      'text-4xs flex h-4 w-4 items-center justify-center rounded-lg border text-center',
      isHighlighted ? 'border-[#5B40F8] text-[#5B40F8]' : 'border-black text-black',
    ),
};
