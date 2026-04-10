'use client';

import { useAppTranslation } from '@/hooks/useAppTranslation';
import { i18n } from '@flowai/i18n';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { FlowDepartment, FlowUser } from '@flowai/shared';
import { Building2, ChevronDown } from 'lucide-react';
import { memo, useCallback, useRef, useState } from 'react';
import { UserListItem } from './UserListItem';

interface DepartmentGroupItemProps {
  department: FlowDepartment;
  selectedUserIds: Set<string>;
  onToggleUser: (user: FlowUser) => void;
  /** 부서 펼침 시 사용자 목록 fetch */
  fetchUsers: (divisionCode: string) => Promise<{ users: FlowUser[]; hasNext: boolean }>;
  /** 선택 모드 */
  selectionMode?: 'single' | 'multi';
  disabled?: boolean;
  className?: string;
}

const SKELETON_COUNT = 3;

/**
 * 부서 아코디언 컴포넌트
 * - 클릭 시 하위 인원을 낮은 뎁스로 펼침
 * - 전체 사용자 캐시에서 부서 userIds로 즉시 필터
 */
export const DepartmentGroupItem = memo(function DepartmentGroupItem({
  department,
  selectedUserIds,
  onToggleUser,
  fetchUsers,
  selectionMode = 'multi',
  disabled = false,
  className,
}: DepartmentGroupItemProps) {
  const { t } = useAppTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<FlowUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasFetchedRef = useRef(false);

  const isSingleMode = selectionMode === 'single';
  const showCheckbox = !isSingleMode;

  // 부서 내 선택된 사용자 수
  const selectedInDepartment = users.filter((u) => selectedUserIds.has(u.thirdPartyUserId)).length;

  // 펼칠 때 사용자 목록 fetch
  const handleOpenChange = useCallback(
    async (open: boolean) => {
      setIsOpen(open);

      if (open && !hasFetchedRef.current) {
        hasFetchedRef.current = true;
        setIsLoading(true);
        try {
          const result = await fetchUsers(department.divisionCode);
          setUsers(result.users);
        } finally {
          setIsLoading(false);
        }
      }
    },
    [department.divisionCode, fetchUsers],
  );

  return (
    <Collapsible open={isOpen} onOpenChange={handleOpenChange} className={cn('border-b last:border-b-0', className)}>
      {/* 부서 헤더 */}
      <CollapsibleTrigger asChild>
        <div
          className={cn(
            'flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors',
            'hover:bg-accent',
            disabled && 'cursor-not-allowed opacity-50',
          )}
        >
          {/* 부서 아이콘 */}
          <Building2 className='h-4 w-4 shrink-0 text-blue-500' aria-hidden='true' />

          {/* 부서명 + 인원 수 */}
          <span className='flex-1 truncate text-sm font-medium'>
            {department.divisionName} (
            {t(i18n.common.flow_select_modal.employee_count, { count: department.employeeCount })})
          </span>

          {/* 선택 개수 표시 */}
          {selectedInDepartment > 0 && (
            <span className='text-muted-foreground text-xs'>
              {t(i18n.common.flow_select_modal.selection_count_user_only, { count: selectedInDepartment })}
            </span>
          )}

          {/* 확장 아이콘 */}
          <ChevronDown
            className={cn('text-muted-foreground h-4 w-4 shrink-0 transition-transform', isOpen && 'rotate-180')}
          />
        </div>
      </CollapsibleTrigger>

      {/* 사용자 목록 */}
      <CollapsibleContent>
        <div className='bg-muted/30 py-1 pl-6'>
          {isLoading ? (
            // 로딩 스켈레톤
            Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <div key={i} className='flex h-9 items-center gap-3 px-3 py-2'>
                {showCheckbox && <Skeleton className='h-4 w-4 rounded' />}
                <Skeleton className='h-7 w-7 rounded-full' />
                <Skeleton className='h-4 flex-1' />
              </div>
            ))
          ) : users.length === 0 ? (
            <p className='text-muted-foreground px-3 py-3 text-sm'>{t(i18n.common.department_group_item.no_members)}</p>
          ) : (
            users.map((user) => (
              <UserListItem
                key={user.thirdPartyUserId}
                user={user}
                isSelected={selectedUserIds.has(user.thirdPartyUserId)}
                onToggle={onToggleUser}
                disabled={disabled}
                showCheckbox={showCheckbox}
              />
            ))
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});
