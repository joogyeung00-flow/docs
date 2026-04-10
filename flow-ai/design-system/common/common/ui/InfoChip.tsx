'use client';

import { isValidElement, type ElementType, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface InfoChipProps {
  /** 칩에 표시할 텍스트 */
  label: string;
  /**
   * 라벨 앞에 표시할 아이콘.
   * - `LucideIcon` 전달 시 기본 클래스(`h-3 w-3 shrink-0 opacity-60`) 자동 적용
   * - `ReactNode` 전달 시 그대로 렌더링 (커스텀 클래스 직접 지정)
   */
  icon?: LucideIcon | ElementType | ReactNode;
  /** 아이콘 기본 클래스를 오버라이드할 때 사용 (LucideIcon 전달 시에만 적용) */
  iconClassName?: string;
  /** 칩 크기 — `sm`: 기본, `xs`: 더 작은 버전 */
  size?: 'sm' | 'xs';
  /** 라벨 뒤에 표시할 숫자 (생략 시 label만 표시) */
  count?: number;
  /** 숫자 뒤에 붙는 접미사 (예: '건') */
  suffix?: string;
  /** 호버 시 표시할 툴팁 텍스트 (생략 시 툴팁 없음) */
  tooltip?: string;
  /** 추가 CSS 클래스 (색상 오버라이드 등) */
  className?: string;
}

/**
 * InfoChip — 읽기 전용 정보 칩
 *
 * @description
 * 아이콘 + 라벨 + 선택적 카운트를 표시하는 소형 인라인 칩 컴포넌트.
 * 검색 필터, 타입 뱃지, 작성자 표시, 카운트 뱃지 등 다양한 용도로 사용합니다.
 *
 * @example
 * ```tsx
 * // 기본 사용 (라벨만)
 * <InfoChip label="댓글" />
 *
 * // LucideIcon 전달 — 기본 클래스 자동 적용
 * <InfoChip label="June Lee 작성" icon={UserIcon} />
 *
 * // LucideIcon + 추가 아이콘 클래스 (기본 h-3 w-3 shrink-0 opacity-60에 병합)
 * <InfoChip label="연관 결과 발견" icon={Sparkles} iconClassName="animate-pulse opacity-100" />
 *
 * // ReactNode 직접 전달 — 완전한 제어
 * <InfoChip label="스페셜" icon={<Sparkles className="h-3 w-3 animate-pulse" />} />
 *
 * // 카운트 포함
 * <InfoChip label="댓글" count={9} />
 *
 * // 색상 오버라이드
 * <InfoChip label="댓글" count={9} className="bg-amber-100 ring-amber-200 text-amber-500" />
 * ```
 */
export function InfoChip({
  label,
  icon,
  iconClassName,
  size = 'sm',
  count,
  suffix,
  tooltip,
  className,
}: InfoChipProps) {
  const hasColorOverride = !!className;
  const isXs = size === 'xs';

  const renderIcon = () => {
    if (!icon) return null;
    // ReactNode (JSX element)이면 그대로 렌더링
    if (isValidElement(icon)) return icon;
    // LucideIcon (forwardRef object) 또는 함수 컴포넌트이면 기본 클래스 적용
    if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && 'render' in icon)) {
      const Icon = icon as LucideIcon;
      return (
        <Icon
          className={cn(
            isXs ? 'h-2.5 w-2.5 shrink-0' : 'h-3 w-3 shrink-0',
            !hasColorOverride && 'opacity-60',
            iconClassName,
          )}
        />
      );
    }
    return null;
  };

  const chip = (
    <span
      className={cn(
        'inline-flex items-center rounded-md bg-slate-50/60 font-normal text-slate-400 ring-1 ring-inset ring-slate-100',
        isXs ? 'text-3xs gap-0.5 px-1 py-0' : 'text-2xs gap-1 px-2 py-0.5',
        className,
      )}
    >
      {renderIcon()}
      {label}
      {count != null && (
        <span className='font-medium'>
          {count}
          {suffix}
        </span>
      )}
    </span>
  );

  if (!tooltip) return chip;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{chip}</TooltipTrigger>
        <TooltipContent side='top'>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
