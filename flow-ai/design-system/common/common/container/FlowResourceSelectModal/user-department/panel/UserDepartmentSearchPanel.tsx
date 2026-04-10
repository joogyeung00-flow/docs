'use client';

import { useAppTranslation } from '@/hooks/useAppTranslation';
import { i18n } from '@flowai/i18n';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { FlowUser } from '@flowai/shared';
import { Loader2 } from 'lucide-react';
import { memo, useRef, useEffect } from 'react';
import { UserListItem } from '../item/UserListItem';

const SKELETON_ITEM_COUNT = 6;

interface UserDepartmentSearchPanelProps {
  /** 전체 사용자 리스트 */
  allUsers: FlowUser[];
  /** 선택된 사용자 ID Set */
  selectedUserIds: Set<string>;
  /** 사용자 토글 */
  onToggleUser: (user: FlowUser) => void;
  /** 검색 키워드 (외부에서 전달) */
  searchKeyword: string;
  /** 검색 결과 */
  searchResults: FlowUser[] | null;
  searchHasNext: boolean;
  onLoadMoreSearchResults: () => Promise<void>;
  /** 선택 모드 */
  selectionMode?: 'single' | 'multi';
  /** 상태 */
  isLoading: boolean;
  error: Error | null;
  className?: string;
}

/**
 * 임직원 플랫 리스트 패널
 * - 기본: 전체 사용자를 이름순으로 플랫하게 표시
 * - 검색 시: 서버 검색 결과를 플랫하게 표시
 */
export const UserDepartmentSearchPanel = memo(function UserDepartmentSearchPanel({
  allUsers,
  selectedUserIds,
  onToggleUser,
  searchKeyword,
  searchResults,
  searchHasNext,
  onLoadMoreSearchResults,
  selectionMode = 'multi',
  isLoading,
  error,
  className,
}: UserDepartmentSearchPanelProps) {
  const { t } = useAppTranslation('common');
  const udsp = i18n.common.user_department_search_panel;
  const showCheckbox = selectionMode !== 'single';
  const isSearching = searchKeyword.trim().length > 0;

  // 검색 결과 무한 스크롤
  const searchLoadMoreRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = searchLoadMoreRef.current;
    if (!el || !searchHasNext || !isSearching) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMoreSearchResults();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [searchHasNext, isSearching, onLoadMoreSearchResults]);

  return (
    <div className={cn('h-full overflow-hidden', className)}>
      {isLoading && !isSearching ? (
        // 초기 로딩 스켈레톤
        <div className='py-1'>
          {Array.from({ length: SKELETON_ITEM_COUNT }).map((_, i) => (
            <div key={i} className='flex h-10 items-center gap-3 px-3 py-2'>
              <Skeleton className='h-7 w-7 rounded-full' />
              <Skeleton className='h-4 flex-1' />
              {showCheckbox && <Skeleton className='h-4 w-4 rounded' />}
            </div>
          ))}
        </div>
      ) : error ? (
        // 에러 상태
        <div className='p-4 text-center'>
          <p className='text-destructive text-sm'>{error.message}</p>
        </div>
      ) : isSearching ? (
        // 검색 결과 (플랫 리스트)
        <div className='h-full overflow-y-auto overflow-x-hidden py-1'>
          {searchResults === null ? (
            // 검색 중
            <div className='flex items-center justify-center py-8'>
              <Loader2 className='text-muted-foreground h-5 w-5 animate-spin' />
            </div>
          ) : searchResults.length === 0 ? (
            <p className='text-muted-foreground p-4 text-center text-sm'>{t(udsp.no_search_results)}</p>
          ) : (
            <>
              {searchResults.map((user) => (
                <UserListItem
                  key={user.thirdPartyUserId}
                  user={user}
                  isSelected={selectedUserIds.has(user.thirdPartyUserId)}
                  onToggle={onToggleUser}
                  showCheckbox={showCheckbox}
                />
              ))}
              {/* 검색 결과 더보기 */}
              {searchHasNext && (
                <div ref={searchLoadMoreRef} className='flex items-center justify-center py-2'>
                  <Loader2 className='text-muted-foreground h-4 w-4 animate-spin' />
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        // 전체 사용자 플랫 리스트
        <div className='h-full overflow-y-auto overflow-x-hidden py-1'>
          {allUsers.length === 0 ? (
            <p className='text-muted-foreground p-4 text-center text-sm'>{t(udsp.no_employees)}</p>
          ) : (
            allUsers.map((user) => (
              <UserListItem
                key={user.thirdPartyUserId}
                user={user}
                isSelected={selectedUserIds.has(user.thirdPartyUserId)}
                onToggle={onToggleUser}
                showCheckbox={showCheckbox}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
});
