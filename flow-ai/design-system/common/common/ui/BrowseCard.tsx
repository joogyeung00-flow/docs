'use client';

import { useAppTranslation } from '@/hooks/useAppTranslation';
import { cn } from '@/lib/utils';
import { i18n } from '@flowai/i18n';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';
import { RecommendBadge } from './RecommendBadge';

// ============================================
// Type Definitions
// ============================================

type BadgeType = 'new' | 'recommended';

interface BrowseCardProps {
  avatar?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  badges?: BadgeType[];
  /** 우상단 커스텀 액션 영역 (즐겨찾기 별, Switch, 버튼 등) */
  headerAction?: ReactNode;
  typeBadge?: ReactNode;
  /** 우하단 커스텀 액션 영역 (입장 버튼 등) */
  footerAction?: ReactNode;
  highlightQuery?: string;
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
}

/**
 * BrowseCard - 챗봇 목록, 즐겨찾기 등에 사용되는 카드 컴포넌트
 *
 * @description
 * 아바타, 제목, 설명, 뱃지 등을 개별 props로 전달하여 사용합니다.
 * 우상단 액션 영역은 headerAction으로 자유롭게 커스텀 가능합니다.
 *
 * @example
 * ```tsx
 * <BrowseCard
 *   avatar={<AvatarProfile profileImageUrl="..." name="AI 챗봇" type="assistant" size="xl" />}
 *   title="AI 업무 매니저"
 *   description="대화로 프로젝트와 업무를 자동 생성합니다."
 *   badges={['new', 'recommended']}
 *   headerAction={<QuickAccessButton isQuickAccess={true} onToggle={handleToggle} />}
 *   typeBadge={<ChatbotTypeBadge type="assistant" authType="public" />}
 *   highlightQuery="검색어"
 *   onClick={() => {}}
 * />
 * ```
 */
export function BrowseCard({
  avatar,
  title,
  description,
  badges,
  headerAction,
  typeBadge,
  footerAction,
  highlightQuery,
  onClick,
  className,
  children,
}: BrowseCardProps) {
  // Determine usage mode
  const isPropsMode = avatar || title || description;
  const isCompositionMode = !!children;

  // Highlight helper
  const renderHighlighted = (text: string) => {
    if (!highlightQuery) return text;
    const escaped = highlightQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'ig');
    const parts = text.split(regex);
    return parts.map((part, idx) =>
      regex.test(part) ? (
        <mark key={idx} className='rounded-sm bg-amber-100 px-0.5 text-amber-900'>
          {part}
        </mark>
      ) : (
        <span key={idx}>{part}</span>
      ),
    );
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'inline-flex w-full cursor-pointer flex-col items-start justify-start gap-2 self-stretch rounded-lg p-4 outline outline-1 outline-offset-[-1px] transition-colors',
        'bg-[#f7fbff] outline-slate-200 hover:bg-[#f0f7ff]',
        className,
      )}
      style={{
        outlineStyle: 'solid',
      }}
    >
      {/* Composition mode */}
      {isCompositionMode && children}

      {/* Props mode */}
      {isPropsMode && !isCompositionMode && (
        <>
          {/* Header: Avatar + Badges + Action */}
          {(avatar || headerAction) && (
            <div className='inline-flex w-full items-start justify-between'>
              {/* Avatar with badges */}
              {avatar && (
                <div className='-ml-0.5 flex items-end justify-center gap-2'>
                  {avatar}
                  {badges && badges.length > 0 && (
                    <div className='flex items-end gap-[6px] pb-0.5'>
                      {badges.map((badgeType) => (
                        <BrowseCard.Badge key={badgeType} type={badgeType} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Header Action */}
              {headerAction && <div onClick={(e) => e.stopPropagation()}>{headerAction}</div>}
            </div>
          )}

          {/* Content: Title + Description */}
          {(title || description) && (
            <div className='flex w-full flex-col items-start justify-center gap-1'>
              {title && (
                <div className='line-clamp-1 w-full text-left text-sm font-semibold leading-4 text-slate-950 md:text-base md:leading-5'>
                  {typeof title === 'string' ? renderHighlighted(title) : title}
                </div>
              )}
              {description ? (
                <div className='text-muted-foreground line-clamp-2 h-10 w-full text-left text-xs font-normal leading-5 md:text-sm'>
                  {typeof description === 'string' ? renderHighlighted(description) : description}
                </div>
              ) : (
                <div className='h-10' />
              )}
            </div>
          )}

          {/* Footer: Type Badge + Action */}
          {(typeBadge || footerAction) && (
            <div className='flex w-full items-center justify-between gap-2'>
              <div className='flex items-center gap-2'>{typeBadge}</div>
              {footerAction && <div onClick={(e) => e.stopPropagation()}>{footerAction}</div>}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================
// 레이아웃 서브 컴포넌트
// ============================================

// Header: 상단 영역 (아바타/아이콘 + 뱃지 + 액션)
interface HeaderProps {
  children: ReactNode;
  className?: string;
}

BrowseCard.Header = function BrowseCardHeader({ children, className }: HeaderProps) {
  return <div className={cn('inline-flex w-full items-start justify-between', className)}>{children}</div>;
};

// Content: 제목 + 설명 영역
interface ContentProps {
  title: string;
  description: ReactNode;
  className?: string;
  highlightQuery?: string;
}

BrowseCard.Content = function BrowseCardContent({ title, description, className, highlightQuery }: ContentProps) {
  const renderHighlighted = (text: string) => {
    if (!highlightQuery) return text;
    const escaped = highlightQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'ig');
    const parts = text.split(regex);
    return parts.map((part, idx) =>
      regex.test(part) ? (
        <mark key={idx} className='rounded-sm bg-amber-100 px-0.5 text-amber-900'>
          {part}
        </mark>
      ) : (
        <span key={idx}>{part}</span>
      ),
    );
  };

  return (
    <div className={cn('flex w-full flex-col items-start justify-center gap-1', className)}>
      <div className='line-clamp-1 w-full text-left text-sm font-semibold leading-4 text-slate-950 md:text-base md:leading-5'>
        {typeof title === 'string' ? renderHighlighted(title) : title}
      </div>
      <div className='text-muted-foreground line-clamp-2 h-10 w-full text-left text-xs font-normal leading-5 md:text-sm'>
        {typeof description === 'string' ? renderHighlighted(description) : description}
      </div>
    </div>
  );
};

// Footer: 하단 영역 (타입 뱃지 등)
interface FooterProps {
  children: ReactNode;
  className?: string;
}

BrowseCard.Footer = function BrowseCardFooter({ children, className }: FooterProps) {
  return <div className={cn('flex w-full items-center gap-2', className)}>{children}</div>;
};

// ============================================
// 컨텐츠 서브 컴포넌트
// ============================================

// Avatar: 아바타/아이콘 (QuickAccessItem의 AvatarProfile 대체용)
interface AvatarProps {
  children: ReactNode; // AvatarProfile이나 커스텀 아이콘
  className?: string;
}

BrowseCard.Avatar = function BrowseCardAvatar({ children, className }: AvatarProps) {
  return (
    <div className={cn('flex items-end justify-center gap-2', className)}>
      <div className='h-9 w-9 flex-shrink-0 overflow-hidden rounded-full [&>*]:h-full [&>*]:w-full [&>*]:rounded-full'>
        {children}
      </div>
    </div>
  );
};

// Badges: 뱃지 컨테이너 (New, 추천 등)
interface BadgesProps {
  children: ReactNode;
  className?: string;
}

BrowseCard.Badges = function BrowseCardBadges({ children, className }: BadgesProps) {
  return <div className={cn('flex items-end gap-[6px] pb-0.5', className)}>{children}</div>;
};

// Badge: 개별 뱃지 (New, 추천)
interface BadgeProps {
  type: 'new' | 'recommended';
  className?: string;
}

BrowseCard.Badge = function BrowseCardBadge({ type, className }: BadgeProps) {
  if (type === 'recommended') {
    return <RecommendBadge className={className} />;
  }

  return (
    <div
      className={cn(
        'text-2xs flex h-4 w-4 items-center justify-center rounded-sm font-semibold leading-none text-white shadow-sm',
        className,
      )}
      style={{ backgroundColor: '#d77a00' }}
    >
      N
    </div>
  );
};

// TypeBadge: 타입 뱃지 (공개/비공개 등) - children으로 ChatbotTypeBadge 같은 걸 받음
interface TypeBadgeProps {
  children?: ReactNode;
  label?: string;
  className?: string;
}

BrowseCard.TypeBadge = function BrowseCardTypeBadge({ children, label, className }: TypeBadgeProps) {
  if (children) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn('bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-xs font-normal', className)}>
      {label}
    </div>
  );
};

// Tags: 태그 목록
interface TagsProps {
  tags: string[];
  className?: string;
}

BrowseCard.Tags = function BrowseCardTags({ tags, className }: TagsProps) {
  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {tags.map((tag) => (
        <span key={tag} className='bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-xs font-normal leading-5'>
          {tag}
        </span>
      ))}
    </div>
  );
};

// ============================================
// 레거시 서브 컴포넌트 (하위 호환)
// ============================================

// Icon (레거시)
interface IconProps {
  icon: LucideIcon;
  bgColor?: string;
  textClass?: string;
  size?: number;
}

BrowseCard.Icon = function BrowseCardIcon({ icon: Icon, bgColor, textClass, size = 14 }: IconProps) {
  return (
    <div className='m-0.5'>
      <Icon className={cn(`h-${size} w-${size}`, textClass)} style={{ backgroundColor: bgColor }} />
    </div>
  );
};

// AgentButton
interface AgentButtonProps {
  onClick: (e: React.MouseEvent) => void;
  label?: string;
  className?: string;
}

BrowseCard.AgentButton = function BrowseCardAgentButton({ onClick, label, className }: AgentButtonProps) {
  const { t } = useAppTranslation('common');
  const displayLabel = label ?? t(i18n.common.browse_card.agent_default_label);
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'bg-flow-project-flow-green hover:bg-flow-project-flow-green/90 rounded-full px-4 py-2 text-xs font-medium text-white transition-colors',
        className,
      )}
    >
      {displayLabel}
    </button>
  );
};
