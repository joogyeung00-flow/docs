'use client';

import { UserProfile } from '@/components/common/ui/UserProfile';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { FlowUser } from '@flowai/shared';
import { memo } from 'react';

interface UserListItemProps {
  user: FlowUser;
  isSelected: boolean;
  onToggle: (user: FlowUser) => void;
  disabled?: boolean;
  /** 체크박스 표시 여부 (기본: true) */
  showCheckbox?: boolean;
  /** compact 모드: 작은 아바타, 부서명 숨김 (조직도용) */
  compact?: boolean;
  className?: string;
}

/**
 * 사용자 리스트 아이템 (UserProfile + 우측 체크박스)
 */
export const UserListItem = memo(function UserListItem({
  user,
  isSelected,
  onToggle,
  disabled = false,
  showCheckbox = true,
  compact = false,
  className,
}: UserListItemProps) {
  const handleClick = () => {
    if (!disabled) {
      onToggle(user);
    }
  };

  return (
    <div
      role='button'
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className={cn(
        'flex cursor-pointer items-center transition-colors',
        'hover:bg-accent',
        isSelected && 'bg-accent',
        disabled && 'cursor-not-allowed opacity-50',
        compact ? 'h-10 gap-2 rounded px-2' : 'h-10 gap-3 rounded-md px-3',
        className,
      )}
    >
      {/* 사용자 프로필 */}
      <UserProfile
        name={user.name}
        profileImageUrl={user.profileImageUrl}
        position={user.position}
        division={user.division}
        size='sm'
        compact={compact}
        className='min-w-0 flex-1'
      />

      {/* 체크박스 (우측) */}
      {showCheckbox && (
        <Checkbox
          checked={isSelected}
          disabled={disabled}
          className='pointer-events-none shrink-0 border-gray-300 shadow-none'
          aria-hidden='true'
        />
      )}
    </div>
  );
});
