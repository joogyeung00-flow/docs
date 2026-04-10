'use client';

import { cn } from '@/lib/utils';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { ReactNode, useState, useMemo } from 'react';

// 테마 색상 매핑
const THEME_COLOR_MAP: Record<string, string> = {
  primary: '91, 64, 248',
  'flow-project-flow-green': '0, 176, 28',
  'flow-project-flow-yellow': '255, 184, 0',
  'flow-project-flow-orange': '255, 140, 0',
  'flow-project-flow-blue': '0, 122, 255',
  'flow-project-flow-purple': '175, 82, 222',
  'flow-project-flow-red': '255, 59, 48',
  'flow-project-flow-pink': '255, 105, 180',
};

function generateColorsFromTheme(themeColor: string, hasIcon: boolean = true) {
  const rgb = THEME_COLOR_MAP[themeColor] || THEME_COLOR_MAP.primary;
  return {
    iconBgColor: `rgba(${rgb}, 0.15)`,
    iconColor: `rgba(${rgb}, 1)`,
    iconTextClass: undefined,
    buttonBgColor: `rgba(${rgb}, 1)`,
    buttonHoverBgColor: `rgba(${rgb}, 0.9)`,
    hoverOutlineColor: `rgba(${rgb}, 1)`,
  };
}

export interface ActionCardConfig {
  // 테마 색상 (권장)
  themeColor?: string;
  // 개별 색상 (themeColor보다 우선순위 높음)
  icon?: LucideIcon;
  // 아이콘 대신 커스텀 슬롯 (icon보다 우선순위 높음)
  iconSlot?: ReactNode;
  iconBgColor?: string;
  iconTextClass?: string;
  buttonBgColor?: string;
  buttonHoverBgColor?: string;
  hoverOutlineColor?: string;
  // 필수
  title: string;
  description: ReactNode;
  buttonText: string;
}

interface ActionCardProps {
  config: ActionCardConfig;
  onClick: () => void;
  className?: string;
}

/**
 * ActionCard - 아이콘, 제목, 설명, 버튼을 포함한 클릭 가능한 카드 컴포넌트
 *
 * @description
 * Atomic 디자인 컴포넌트로, 아이콘, 제목, 설명, 액션 버튼으로 구성된 선택 가능한 카드입니다.
 * ConverterWelcomeScreen, UpgradeInquiryDialog 등에서 사용됩니다.
 *
 * @example
 * ```tsx
 * // 간편한 방법 (권장): themeColor 사용
 * <ActionCard
 *   config={{
 *     themeColor: 'primary', // 'flow-project-flow-green', 'flow-project-flow-yellow' 등
 *     icon: MessageCircle,
 *     title: '대화로 시작하기',
 *     description: '동료에게 말하듯이 편하게 요청해 보세요.',
 *     buttonText: '대화 시작하기',
 *   }}
 *   onClick={() => console.log('clicked')}
 * />
 *
 * // 세밀한 제어: 개별 색상 지정 (themeColor보다 우선)
 * <ActionCard
 *   config={{
 *     icon: MessageCircle,
 *     iconBgColor: 'rgba(91, 64, 248, 0.15)',
 *     iconTextClass: 'text-primary',
 *     buttonBgColor: 'rgba(91, 64, 248, 1)',
 *     buttonHoverBgColor: 'rgba(91, 64, 248, 0.9)',
 *     hoverOutlineColor: 'rgba(91, 64, 248, 1)',
 *     title: '대화로 시작하기',
 *     description: '동료에게 말하듯이 편하게 요청해 보세요.',
 *     buttonText: '대화 시작하기',
 *   }}
 *   onClick={() => console.log('clicked')}
 * />
 * ```
 */
export function ActionCard({ config, onClick, className }: ActionCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // themeColor가 있으면 자동 생성, 없으면 개별 속성 사용
  const colors = useMemo(() => {
    if (config.themeColor) {
      return generateColorsFromTheme(config.themeColor, !!config.icon);
    }
    return {
      iconBgColor: config.iconBgColor,
      iconColor: undefined,
      iconTextClass: config.iconTextClass,
      buttonBgColor: config.buttonBgColor,
      buttonHoverBgColor: config.buttonHoverBgColor,
      hoverOutlineColor: config.hoverOutlineColor,
    };
  }, [config]);

  const { icon: Icon, iconSlot, title, description, buttonText } = config;
  const { iconBgColor, iconColor, iconTextClass, buttonBgColor, buttonHoverBgColor, hoverOutlineColor } = colors;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'bg-background outline-border group flex w-full flex-1 cursor-pointer flex-col items-start justify-between self-stretch rounded-lg p-4 outline outline-1 outline-offset-[-1px] transition-all',
        className,
      )}
      style={{
        outlineColor: isHovered && hoverOutlineColor ? hoverOutlineColor : undefined,
      }}
    >
      <div className='flex flex-col items-start justify-start gap-3 self-stretch'>
        {iconSlot
          ? iconSlot
          : Icon && (
              <div
                className='inline-flex items-center justify-start gap-2.5 rounded-lg p-2'
                style={{ backgroundColor: iconBgColor }}
              >
                <Icon className={cn('h-6 w-6', iconTextClass)} style={{ color: iconColor }} />
              </div>
            )}
        <div className='flex flex-col items-start justify-start gap-2 self-stretch'>
          <div className='text-foreground text-left text-base font-semibold leading-6'>{title}</div>
          <div className='self-stretch whitespace-pre-line text-left text-xs font-thin leading-5 tracking-tighter text-[#7f7f7f]'>
            {description}
          </div>
        </div>
      </div>
      {buttonText && (
        <div
          className='mt-4 inline-flex w-full items-center justify-center gap-1 rounded-md px-4 py-2.5 transition-colors'
          style={{
            backgroundColor: isHovered && buttonHoverBgColor ? buttonHoverBgColor : buttonBgColor,
          }}
        >
          <div className='text-sm font-medium leading-5 text-white'>{buttonText}</div>
          <ArrowRight className='h-4 w-4 text-white' />
        </div>
      )}
    </button>
  );
}
