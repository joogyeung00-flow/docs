'use client';

import { Button } from '@/components/ui/button';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { cn } from '@/lib/utils';
import type { FlowUser } from '@flowai/shared';
import { i18n } from '@flowai/i18n';
import { User, X } from 'lucide-react';
import { memo } from 'react';

interface UserSelectionPanelProps {
  selectedUsers: FlowUser[];
  onRemove: (userId: string) => void;
  onClearAll: () => void;
  maxSelection?: number;
  className?: string;
}

/**
 * 선택된 사용자를 Chip 형태로 표시하는 우측 패널
 */
export const UserSelectionPanel = memo(function UserSelectionPanel({
  selectedUsers,
  onRemove,
  onClearAll,
  maxSelection,
  className,
}: UserSelectionPanelProps) {
  const { t } = useAppTranslation('common');
  const count = selectedUsers.length;

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className='box-border flex h-[52px] items-center justify-between border-b border-t px-4 py-2 md:border-t-0'>
        <span className='text-sm font-medium'>
          {maxSelection
            ? t(i18n.common.flow_select_modal.selection_count_user, { count: count, max: maxSelection })
            : t(i18n.common.flow_select_modal.selection_count_user_only, { count: count })}
        </span>
        {count > 0 && (
          <Button variant='ghost' size='sm' onClick={onClearAll} className='text-muted-foreground px-2 py-1'>
            {t(i18n.common.flow_select_modal.reset)}
          </Button>
        )}
      </div>

      <div className='flex flex-wrap gap-2 overflow-y-auto p-4'>
        {selectedUsers.length === 0 ? (
          <p className='text-muted-foreground text-sm'>{t(i18n.common.flow_select_modal.empty_users)}</p>
        ) : (
          selectedUsers.map((user) => (
            <div
              key={user.thirdPartyUserId}
              className='bg-secondary text-secondary-foreground inline-flex min-w-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs'
            >
              <div className='flex min-w-0 flex-1 items-center gap-1.5'>
                {/* 프로필 이미지 또는 기본 아이콘 */}
                {user.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt={user.name}
                    className='h-4 w-4 shrink-0 rounded-full object-cover'
                  />
                ) : (
                  <User className='text-muted-foreground h-3.5 w-3.5 shrink-0' />
                )}
                <span className='max-w-[120px] truncate'>{user.name}</span>
                {user.position && <span className='text-muted-foreground text-2xs truncate'>{user.position}</span>}
              </div>

              {/* 삭제 버튼 */}
              <button
                type='button'
                onClick={() => onRemove(user.thirdPartyUserId)}
                className='hover:bg-secondary-foreground/10 -mr-0.5 rounded-full p-0.5 transition-colors'
                aria-label={t(i18n.common.flow_select_modal.deselect_aria, { name: user.name })}
              >
                <X className='h-3.5 w-3.5' />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
});
