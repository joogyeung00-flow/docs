'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

// 테마 색상 매핑
const THEME_COLOR_MAP: Record<string, string> = {
  primary: '91, 64, 248',
  'flow-project-flow-green': '0, 176, 28',
  'flow-project-flow-yellow': '255, 184, 0',
  'flow-project-flow-orange': '255, 140, 0',
  'flow-project-flow-blue': '0, 122, 255',
  'flow-project-flow-purple': '175, 82, 222',
  'flow-project-flow-red': '255, 59, 48',
  slate: '100, 116, 139',
};

// 배지 색상 프리셋
const BADGE_COLOR_PRESETS = {
  success: 'bg-green-600 text-white',
  warning: 'bg-flow-project-flow-orange text-white',
  neutral: 'bg-slate-100 text-slate-700 border border-slate-300',
  info: 'bg-blue-100 text-blue-700 border border-blue-200',
} as const;

export type BadgeColorPreset = keyof typeof BADGE_COLOR_PRESETS;

export interface InsightCardConfig {
  /** 카드 제목 */
  title: string;
  /** 표시할 값 (숫자 또는 문자열) */
  value: string | number;
  /** 값의 단위 (예: '회', '명', '단계') */
  unit?: string;
  /** 배지 텍스트 또는 JSX */
  badge?: ReactNode;
  /** 배지 색상 프리셋 또는 커스텀 클래스 */
  badgeColor?: BadgeColorPreset | string;
  /** 테마 색상 (값 색상에 적용) */
  themeColor?: string;
  /** 값 텍스트 커스텀 클래스 (themeColor보다 우선순위 높음) */
  valueTextClass?: string;
  /** 배경색 (기본: white) */
  backgroundColor?: string;
}

interface InsightCardProps {
  config: InsightCardConfig;
  /** 카드 클릭 핸들러 */
  onClick?: () => void;
  /** 배지 클릭 핸들러 (onClick과 별도) */
  onBadgeClick?: () => void;
  /** 추가 클래스명 */
  className?: string;
  /** 카드 variant */
  variant?: 'default' | 'highlight';
  /** 값 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 하단 커스텀 영역 */
  footer?: ReactNode;
}

/**
 * InsightCard - 핵심 지표/인사이트를 표시하는 카드 컴포넌트
 *
 * @description
 * 어드민 대시보드의 핵심 인사이트, 개인설정의 이번달 사용량 등
 * 주요 수치를 강조하여 표시하는 카드 컴포넌트입니다.
 *
 * @example
 * ```tsx
 * // 기본 사용법 (어드민 대시보드 스타일)
 * <InsightCard
 *   config={{
 *     title: '총 AI 요청 수',
 *     value: '123.5만',
 *     unit: '회',
 *     badge: '지난달 대비 15% 증가',
 *     badgeColor: 'success',
 *   }}
 *   onBadgeClick={() => openDialog()}
 * />
 *
 * // 하이라이트 variant (개인설정 스타일)
 * <InsightCard
 *   config={{
 *     title: '이번달 나의 사용량',
 *     value: 1234,
 *     unit: '회',
 *     themeColor: 'primary',
 *   }}
 *   variant='highlight'
 * />
 *
 * // 커스텀 배지 색상
 * <InsightCard
 *   config={{
 *     title: 'AI 활용 수준',
 *     value: '정착',
 *     unit: '단계',
 *     badge: '조직 전반에서 고르게 활용됨',
 *     badgeColor: 'bg-green-600 text-white', // 커스텀 클래스
 *   }}
 * />
 * ```
 */
export function InsightCard({
  config,
  onClick,
  onBadgeClick,
  className,
  variant = 'default',
  size = 'md',
  footer,
}: InsightCardProps) {
  const { title, value, unit, badge, badgeColor = 'neutral', themeColor, valueTextClass, backgroundColor } = config;

  // 값 색상 결정
  const getValueColorStyle = () => {
    if (valueTextClass) return { className: valueTextClass };
    if (themeColor && THEME_COLOR_MAP[themeColor]) {
      const rgb = THEME_COLOR_MAP[themeColor];
      return { style: { color: `rgba(${rgb}, 1)` } };
    }
    return { className: 'text-primary' };
  };

  const valueColorProps = getValueColorStyle();

  // 배지 색상 결정
  const getBadgeColorClass = () => {
    if (badgeColor in BADGE_COLOR_PRESETS) {
      return BADGE_COLOR_PRESETS[badgeColor as BadgeColorPreset];
    }
    return badgeColor; // 커스텀 클래스
  };

  // 값 크기 결정
  const valueSizeClass = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  }[size];

  // 단위 크기 결정
  const unitSizeClass = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }[size];

  // variant별 스타일
  const variantStyles = {
    default: 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md',
    highlight: 'bg-[#f7fbff] border-slate-200',
  };

  const CardWrapper = onClick ? 'button' : 'div';
  const cardProps = onClick
    ? {
        type: 'button' as const,
        onClick,
      }
    : {};

  return (
    <CardWrapper
      {...cardProps}
      className={cn(
        'flex flex-col rounded-lg border shadow-sm transition-all duration-200',
        variantStyles[variant],
        onClick && 'cursor-pointer',
        className,
      )}
      style={{ backgroundColor }}
    >
      <div className='flex flex-col gap-3 px-5 py-4'>
        {/* 타이틀 */}
        <div className='w-full text-sm font-semibold text-slate-700'>{title}</div>

        {/* 값 (중앙 강조) */}
        <div className='flex items-end justify-center gap-1 py-2'>
          <div
            className={cn('line-clamp-1 font-bold leading-none', valueSizeClass, valueColorProps.className)}
            style={valueColorProps.style}
          >
            {value}
          </div>
          {unit && <div className={cn('pb-0.5 text-neutral-500', unitSizeClass)}>{unit}</div>}
        </div>

        {/* 배지 (하단) */}
        {badge &&
          (onBadgeClick ? (
            <button
              type='button'
              onClick={(e) => {
                e.stopPropagation();
                onBadgeClick();
              }}
              className={cn(
                'text-2xs cursor-pointer self-center rounded-md px-2 py-0.5 transition-all duration-200 hover:scale-105 hover:shadow-sm',
                getBadgeColorClass(),
              )}
            >
              {badge}
            </button>
          ) : (
            <span className={cn('text-2xs self-center rounded-md px-2 py-0.5', getBadgeColorClass())}>{badge}</span>
          ))}

        {/* 커스텀 푸터 */}
        {footer}
      </div>
    </CardWrapper>
  );
}

/**
 * InsightCardGrid - InsightCard를 그리드로 배치하는 컨테이너
 *
 * @example
 * ```tsx
 * <InsightCardGrid columns={4}>
 *   <InsightCard config={{ title: '총 요청', value: 123 }} />
 *   <InsightCard config={{ title: '활성 사용자', value: 56 }} />
 * </InsightCardGrid>
 * ```
 */
interface InsightCardGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function InsightCardGrid({ children, columns = 4, className }: InsightCardGridProps) {
  const columnClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return <div className={cn('grid gap-4', columnClasses[columns], className)}>{children}</div>;
}
