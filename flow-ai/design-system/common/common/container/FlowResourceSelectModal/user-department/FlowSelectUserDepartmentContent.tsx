'use client';

import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFlowSelectUserDepartment } from '@/hooks/useFlowSelectUserDepartment';
import { useFlowSelectStore } from '@/stores/flow-select.store';
import type { FlowUser } from '@flowai/shared';
import { i18n } from '@flowai/i18n';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ResourceTabSearchLayout } from '../common/ResourceTabSearchLayout';
import { FlowSelectModalFooter } from '../FlowSelectModalFooter';
import { OrganizationTreePanel } from './panel/OrganizationTreePanel';
import { UserDepartmentSearchPanel } from './panel/UserDepartmentSearchPanel';
import { UserSelectionPanel } from './panel/UserSelectionPanel';

export interface FlowSelectUserDepartmentContentProps {
  open: boolean;
  onClose: () => void;
  selectionMode?: 'single' | 'multi';
  maxSelection?: number;
  initialUsers?: FlowUser[];
  onConfirmUsers?: (users: FlowUser[]) => void;
  /** 모바일 모드 강제 적용 (BottomSheet에서 사용) */
  forceMobile?: boolean;
}

type UserDepartmentViewTab = 'user' | 'org';

/**
 * 임직원/부서 선택 컨텐츠
 * - 탭 전환: 임직원 (이름 검색 + 플랫 리스트) / 조직도 (부서 트리 탐색 + 사용자 선택)
 * - 선택 패널 (우측): 선택된 사용자 표시 (multi 모드만)
 * - 푸터: 취소/확인 버튼
 */
export const FlowSelectUserDepartmentContent = memo(function FlowSelectUserDepartmentContent({
  open,
  onClose,
  selectionMode = 'multi',
  maxSelection,
  initialUsers = [],
  onConfirmUsers,
  forceMobile,
}: FlowSelectUserDepartmentContentProps) {
  const { t } = useAppTranslation('common');
  const { setSelectedUsers } = useFlowSelectStore();
  const isMobileDevice = useIsMobile();
  const userDepartmentTabs = useMemo(
    () => [
      { value: 'user' as const, label: t(i18n.common.flow_select_modal.tab_user) },
      { value: 'org' as const, label: t(i18n.common.flow_select_modal.tab_org) },
    ],
    [t],
  );
  const isMobile = forceMobile ?? isMobileDevice;

  // 탭 상태
  const [activeTab, setActiveTab] = useState<UserDepartmentViewTab>('user');

  // 데이터 fetch
  const {
    departments,
    allUsers,
    fetchUsersByDepartment,
    searchKeyword,
    setSearchKeyword,
    searchResults,
    searchHasNext,
    loadMoreSearchResults,
    isLoading,
    error,
  } = useFlowSelectUserDepartment({ enabled: open });

  // 선택된 사용자 목록 (모달 내부 상태)
  const [selectedUsers, setLocalSelectedUsers] = useState<FlowUser[]>(initialUsers);

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (open) {
      setLocalSelectedUsers(initialUsers);
      setSearchKeyword('');
      setActiveTab('user');
    }
  }, [open, initialUsers, setSearchKeyword]);

  // 선택된 사용자 ID Set
  const selectedUserIds = useMemo(() => new Set(selectedUsers.map((u) => u.thirdPartyUserId)), [selectedUsers]);

  // 탭 변경
  const handleTabChange = useCallback(
    (value: string) => {
      if (value === 'user' || value === 'org') {
        setActiveTab(value);
        setSearchKeyword('');
      }
    },
    [setSearchKeyword],
  );

  // 사용자 토글
  const handleToggleUser = useCallback(
    (user: FlowUser) => {
      setLocalSelectedUsers((prev) => {
        const exists = prev.some((u) => u.thirdPartyUserId === user.thirdPartyUserId);

        if (exists) {
          return prev.filter((u) => u.thirdPartyUserId !== user.thirdPartyUserId);
        }

        // 단일 선택 모드
        if (selectionMode === 'single') {
          return [user];
        }

        // 최대 선택 개수 체크
        if (maxSelection && prev.length >= maxSelection) {
          toast.error(t(i18n.common.flow_select_modal.max_selection_toast_user, { max: String(maxSelection) }));
          return prev;
        }

        return [...prev, user];
      });
    },
    [selectionMode, maxSelection],
  );

  // 부서 전체 유저 토글 (조직도 탭에서 부서 체크박스 클릭 시)
  const handleToggleDepartmentUsers = useCallback(
    (users: FlowUser[], allSelected: boolean) => {
      setLocalSelectedUsers((prev) => {
        if (allSelected) {
          // 전부 선택된 상태 → 해당 유저들 해제
          const removeIds = new Set(users.map((u) => u.thirdPartyUserId));
          return prev.filter((u) => !removeIds.has(u.thirdPartyUserId));
        } else {
          // 일부 또는 미선택 → 전체 선택 (이미 있는 유저는 중복 추가 안 함)
          const existingIds = new Set(prev.map((u) => u.thirdPartyUserId));
          const toAdd = users.filter((u) => !existingIds.has(u.thirdPartyUserId));

          // 최대 선택 개수 체크
          if (maxSelection && prev.length + toAdd.length > maxSelection) {
            toast.error(t(i18n.common.flow_select_modal.max_selection_toast_user, { max: String(maxSelection) }));
            return prev;
          }

          return [...prev, ...toAdd];
        }
      });
    },
    [maxSelection],
  );

  // 개별 삭제
  const handleRemoveUser = useCallback((thirdPartyUserId: string) => {
    setLocalSelectedUsers((prev) => prev.filter((u) => u.thirdPartyUserId !== thirdPartyUserId));
  }, []);

  // 전체 삭제
  const handleClearAll = useCallback(() => {
    setLocalSelectedUsers([]);
  }, []);

  // 취소
  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  // 확인
  const handleConfirm = useCallback(() => {
    setSelectedUsers(selectedUsers);
    onConfirmUsers?.(selectedUsers);
    onClose();
  }, [selectedUsers, setSelectedUsers, onConfirmUsers, onClose]);

  const isSingleMode = selectionMode === 'single';

  return (
    <>
      {/* 바디 */}
      <div className={`flex h-full flex-1 flex-col overflow-hidden ${isMobile ? '' : 'md:flex-row'}`}>
        {/* 좌측: 탭 + 검색 + 리스트 */}
        <ResourceTabSearchLayout
          tabs={[...userDepartmentTabs]}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          searchKeyword={searchKeyword}
          onSearchKeywordChange={setSearchKeyword}
          searchPlaceholder={
            activeTab === 'user'
              ? t(i18n.common.flow_select_modal.search_placeholder_user)
              : t(i18n.common.flow_select_modal.search_placeholder_department)
          }
          showBorderRight={!isSingleMode}
        >
          {/* CSS 기반 show/hide — 탭 전환 시 상태(expandedNodes, loadedUsersMap) 보존 */}
          <div className={activeTab !== 'user' ? 'hidden' : 'h-full overflow-hidden'}>
            <UserDepartmentSearchPanel
              allUsers={allUsers}
              selectedUserIds={selectedUserIds}
              onToggleUser={handleToggleUser}
              searchKeyword={searchKeyword}
              searchResults={searchResults}
              searchHasNext={searchHasNext}
              onLoadMoreSearchResults={loadMoreSearchResults}
              selectionMode={selectionMode}
              isLoading={isLoading}
              error={error}
            />
          </div>
          <div className={activeTab !== 'org' ? 'hidden' : 'h-full overflow-hidden'}>
            <OrganizationTreePanel
              departments={departments}
              selectedUserIds={selectedUserIds}
              onToggleUser={handleToggleUser}
              onToggleDepartmentUsers={handleToggleDepartmentUsers}
              fetchUsersByDepartment={fetchUsersByDepartment}
              selectionMode={selectionMode}
              searchKeyword={searchKeyword}
              isLoading={isLoading}
              error={error}
            />
          </div>
        </ResourceTabSearchLayout>

        {/* 우측: 선택된 항목 (multi 모드에서만 표시) */}
        {!isSingleMode && (
          <div className={`w-full flex-1 overflow-y-auto ${isMobile ? '' : 'md:w-[280px]'}`}>
            <UserSelectionPanel
              selectedUsers={selectedUsers}
              onRemove={handleRemoveUser}
              onClearAll={handleClearAll}
              maxSelection={maxSelection}
            />
          </div>
        )}

        {/* 푸터 - 모바일 */}
        {isMobile && (
          <div className='shrink-0'>
            <FlowSelectModalFooter
              onCancel={handleCancel}
              onConfirm={handleConfirm}
              confirmDisabled={selectedUsers.length === 0}
            />
          </div>
        )}
      </div>

      {/* 푸터 - 데스크톱 */}
      {!isMobile && (
        <FlowSelectModalFooter
          onCancel={handleCancel}
          onConfirm={handleConfirm}
          confirmDisabled={selectedUsers.length === 0}
        />
      )}
    </>
  );
});
