'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getAssetPath } from '@/lib/utils/asset-utils';

type UserProfileSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizeConfig: Record<
  UserProfileSize,
  { avatar: string; name: string; position: string; division: string; gap: string; fallback: string }
> = {
  xs: {
    avatar: 'h-6 w-6',
    name: 'text-xs',
    position: 'text-2xs',
    division: 'text-2xs',
    gap: 'gap-2',
    fallback: 'text-2xs',
  },
  sm: {
    avatar: 'h-7 w-7',
    name: 'text-xs',
    position: 'text-2xs',
    division: 'text-2xs',
    gap: 'gap-2',
    fallback: 'text-2xs',
  },
  md: {
    avatar: 'h-8 w-8',
    name: 'text-sm',
    position: 'text-xs',
    division: 'text-xs',
    gap: 'gap-2.5',
    fallback: 'text-xs',
  },
  lg: {
    avatar: 'h-10 w-10',
    name: 'text-base',
    position: 'text-sm',
    division: 'text-sm',
    gap: 'gap-3',
    fallback: 'text-sm',
  },
  xl: {
    avatar: 'h-14 w-14',
    name: 'text-lg',
    position: 'text-base',
    division: 'text-base',
    gap: 'gap-3',
    fallback: 'text-base',
  },
};

/** compact 모드 사이즈 (조직도용: 작은 아바타, 이름+직책만, 부서명 숨김) */
const compactSizeConfig: Record<
  UserProfileSize,
  { avatar: string; name: string; position: string; gap: string; fallback: string }
> = {
  xs: { avatar: 'h-3 w-3', name: 'text-2xs', position: 'text-2xs', gap: 'gap-2', fallback: 'text-4xs' },
  sm: { avatar: 'h-4 w-4', name: 'text-xs', position: 'text-2xs', gap: 'gap-2', fallback: 'text-2xs' },
  md: { avatar: 'h-4 w-4', name: 'text-xs', position: 'text-2xs', gap: 'gap-2', fallback: 'text-2xs' },
  lg: { avatar: 'h-5 w-5', name: 'text-sm', position: 'text-xs', gap: 'gap-2', fallback: 'text-xs' },
  xl: { avatar: 'h-7 w-7', name: 'text-base', position: 'text-sm', gap: 'gap-2.5', fallback: 'text-sm' },
};

interface UserProfileProps {
  /** 사용자 이름 */
  name?: string | null;
  /** 프로필 이미지 URL */
  profileImageUrl?: string | null;
  /** 부서 */
  division?: string | null;
  /** 직책 */
  position?: string | null;
  /** 컴포넌트 크기 (기본: md) */
  size?: UserProfileSize;
  /** 텍스트 정보 표시 여부 (기본: true) */
  showInfo?: boolean;
  /** compact 모드: 작은 아바타, 이름+직책만, 부서명 숨김 (조직도용) */
  compact?: boolean;
  /** 로딩 상태 */
  loading?: boolean;
  /** 컨테이너 className */
  className?: string;
}

function getInitials(name?: string | null): string {
  return name?.slice(0, 2) || '?';
}

/**
 * 사용자 프로필 컴포넌트
 *
 * 표시 형식:
 * - 이름 직책
 * - 부서이름
 */
export function UserProfile({
  name,
  profileImageUrl,
  division,
  position,
  size = 'md',
  showInfo = true,
  compact = false,
  loading = false,
  className,
}: UserProfileProps) {
  const config = compact ? compactSizeConfig[size] : sizeConfig[size];
  const avatarSize = config.avatar;
  const gapSize = config.gap;

  if (loading) {
    return (
      <div className={cn('flex items-center', gapSize, className)}>
        <Skeleton className={cn('shrink-0 rounded-full', avatarSize)} />
        {showInfo && (
          <div className='flex min-w-0 flex-1 flex-col gap-1'>
            <Skeleton className='h-4 w-24' />
            {!compact && <Skeleton className='h-3 w-16' />}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('group flex min-h-10 items-center', gapSize, className)}>
      <Avatar className={cn('shrink-0 transition-transform duration-200', avatarSize)}>
        {profileImageUrl && (
          <AvatarImage src={getAssetPath(profileImageUrl)} alt={name ?? ''} className='object-cover' />
        )}
        <AvatarFallback className={cn('bg-slate-200 font-medium text-slate-700', config.fallback)}>
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>

      {showInfo && (
        <div className='flex min-w-0 flex-1 flex-col overflow-hidden'>
          <div className='flex items-center gap-1'>
            {name && (
              <span className={cn('text-foreground truncate font-medium leading-tight', config.name)}>{name}</span>
            )}
            {position && (
              <span className={cn('text-muted-foreground shrink-0 font-normal', config.position)}>{position}</span>
            )}
          </div>
          {!compact && 'division' in config && division && (
            <span className={cn('text-muted-foreground truncate font-normal leading-tight', (config as any).division)}>
              {division}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
