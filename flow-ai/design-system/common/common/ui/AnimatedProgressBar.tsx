'use client';

import { cn } from '@/lib/utils';

/**
 * 테마 색상별 그라데이션 via 색상 정의
 * primary: 인디고 계열, bot-05: 스카이 계열
 */
const THEME_VIA_COLORS: Record<string, string> = {
  primary: 'via-indigo-400',
  'bot-05': 'via-sky-400',
  emerald: 'via-emerald-400',
  teal: 'via-teal-400',
  destructive: 'via-red-400',
};

/** 애니메이션 타입 */
export type ProgressBarAnimation = 'none' | 'shimmer' | 'unlimited';

// Config 인터페이스 정의
export interface AnimatedProgressBarConfig {
  /** 현재 사용량 (percentage 계산에 사용) */
  value: number;
  /** 총량 (percentage 계산에 사용) */
  total: number;
  /** 경고 상태 여부 - true면 destructive 색상 적용 */
  isWarning?: boolean;
  /** 테마 색상 (기본값: 'primary') */
  themeColor?: 'primary' | 'bot-05' | 'emerald' | 'teal' | 'destructive';
  /** 애니메이션 타입 (기본값: 'none') - 'shimmer': 빛 흐름 효과, 'unlimited': 좌우 그라데이션 */
  animation?: ProgressBarAnimation;
}

// Props 인터페이스
interface AnimatedProgressBarProps {
  config: AnimatedProgressBarConfig;
  /** 프로그레스바 높이 (기본값: 'sm') */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * AnimatedProgressBar - 애니메이션 프로그레스바 컴포넌트
 *
 * @description
 * 사용량 표시를 위한 프로그레스바 컴포넌트입니다.
 * 무제한 모드에서는 좌우로 흐르는 그라데이션 애니메이션이 적용됩니다.
 * 경고 상태에서는 빨간색으로 표시됩니다.
 *
 * @example
 * ```tsx
 * // 기본 사용법 - 일반 프로그레스바
 * <AnimatedProgressBar
 *   config={{
 *     value: 75,
 *     total: 100,
 *     themeColor: 'primary',
 *   }}
 * />
 *
 * // 무제한 모드 - 슝슝 애니메이션
 * <AnimatedProgressBar
 *   config={{
 *     value: 1234,
 *     total: 0,
 *     animation: 'unlimited',
 *     themeColor: 'primary',
 *   }}
 * />
 *
 * // shimmer 애니메이션 (진행 중 표시)
 * <AnimatedProgressBar
 *   config={{
 *     value: 3,
 *     total: 10,
 *     animation: 'shimmer',
 *   }}
 * />
 *
 * // 경고 상태
 * <AnimatedProgressBar
 *   config={{
 *     value: 95,
 *     total: 100,
 *     isWarning: true,
 *   }}
 * />
 * ```
 */
export function AnimatedProgressBar({ config, size = 'sm', className }: AnimatedProgressBarProps) {
  const { value, total, isWarning = false, themeColor = 'primary', animation = 'none' } = config;

  // 퍼센티지 계산
  const percentage = total > 0 ? Math.min(100, (value / total) * 100) : 0;

  // 사이즈별 높이
  const sizeClasses: Record<string, string> = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-4',
  };

  // 색상 결정 (경고 > 테마 색상)
  const effectiveColor = isWarning ? 'destructive' : themeColor;

  // 정적 프로그레스바 배경색
  const staticBgColors: Record<string, string> = {
    primary: 'bg-primary',
    'bot-05': 'bg-bot-05',
    emerald: 'bg-emerald-500',
    teal: 'bg-teal-500',
    destructive: 'bg-destructive',
  };

  // unlimited 그라데이션 from/to 색상
  const gradientFromColors: Record<string, string> = {
    primary: 'from-primary',
    'bot-05': 'from-bot-05',
    emerald: 'from-emerald-500',
    teal: 'from-teal-500',
    destructive: 'from-destructive',
  };
  const gradientToColors: Record<string, string> = {
    primary: 'to-primary',
    'bot-05': 'to-bot-05',
    emerald: 'to-emerald-500',
    teal: 'to-teal-500',
    destructive: 'to-destructive',
  };

  return (
    <div className={cn('relative w-full overflow-hidden rounded-full bg-slate-200', sizeClasses[size], className)}>
      {animation === 'unlimited' ? (
        // unlimited: 슝슝 애니메이션 그라데이션 (100% 너비)
        <div
          className={cn(
            'animate-unlimited-progress absolute inset-0 rounded-full bg-gradient-to-r bg-[length:200%_100%]',
            sizeClasses[size],
            gradientFromColors[effectiveColor],
            THEME_VIA_COLORS[effectiveColor],
            gradientToColors[effectiveColor],
          )}
        />
      ) : (
        // none 또는 shimmer: 퍼센티지 기반 프로그레스바
        <div
          className={cn(
            'absolute left-0 top-0 overflow-hidden rounded-full transition-all duration-300',
            sizeClasses[size],
            staticBgColors[effectiveColor],
          )}
          style={{ width: `${percentage}%` }}
        >
          {animation === 'shimmer' && (
            <div className='absolute inset-0 animate-[shimmer-flow_1.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent' />
          )}
        </div>
      )}
    </div>
  );
}
