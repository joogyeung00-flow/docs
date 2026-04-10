'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { cn } from '@/lib/utils';
import type { FlowDepartment, FlowUser } from '@flowai/shared';
import { i18n } from '@flowai/i18n';
import { Minus, Plus } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { UserListItem } from '../item/UserListItem';

/** 트리 노드 타입 */
interface OrgTreeNode {
  divisionCode: string;
  divisionName: string;
  employeeCount: number;
  children: OrgTreeNode[];
}

/** 부서 플랫 리스트 → 트리 구조로 변환 */
function buildDepartmentTree(departments: FlowDepartment[]): OrgTreeNode[] {
  const nodeMap = new Map<string, OrgTreeNode>();
  const roots: OrgTreeNode[] = [];

  for (const dept of departments) {
    nodeMap.set(dept.divisionCode, {
      divisionCode: dept.divisionCode,
      divisionName: dept.divisionName,
      employeeCount: dept.employeeCount,
      children: [],
    });
  }

  for (const dept of departments) {
    const node = nodeMap.get(dept.divisionCode)!;
    if (dept.higherDivisionCode && nodeMap.has(dept.higherDivisionCode)) {
      nodeMap.get(dept.higherDivisionCode)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

/** 트리 노드에서 모든 하위 divisionCode를 재귀 수집 */
function collectAllDivisionCodes(node: OrgTreeNode): string[] {
  const codes = [node.divisionCode];
  for (const child of node.children) {
    codes.push(...collectAllDivisionCodes(child));
  }
  return codes;
}

// ──────────────────────────────────────────────────────────
// OrgTreeItem
// ──────────────────────────────────────────────────────────

const SKELETON_USER_COUNT = 3;

/** 체크박스 우측 고정 여백 — 부서 행과 유저 행 모두 동일하게 적용 */
const RIGHT_PAD = 12;

interface OrgTreeItemProps {
  node: OrgTreeNode;
  level: number;
  expandedNodes: Set<string>;
  onToggleExpand: (code: string) => void;
  fetchUsers: (divisionCode: string) => Promise<{ users: FlowUser[]; hasNext: boolean }>;
  selectedUserIds: Set<string>;
  onToggleUser: (user: FlowUser) => void;
  onToggleDepartmentUsers: (divisionCodes: string[]) => void;
  selectionMode: 'single' | 'multi';
  searchTerm: string;
  loadedUsersMap: Map<string, FlowUser[]>;
  onSetLoadedUsers: (divisionCode: string, users: FlowUser[]) => void;
}

const OrgTreeItem = memo(function OrgTreeItem({
  node,
  level,
  expandedNodes,
  onToggleExpand,
  fetchUsers,
  selectedUserIds,
  onToggleUser,
  onToggleDepartmentUsers,
  selectionMode,
  searchTerm,
  loadedUsersMap,
  onSetLoadedUsers,
}: OrgTreeItemProps) {
  const { t } = useAppTranslation('common');
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [isCheckLoading, setIsCheckLoading] = useState(false);

  const hasChildren = node.children.length > 0;
  const isExpanded = expandedNodes.has(node.divisionCode);
  const showCheckbox = selectionMode !== 'single';

  const users = loadedUsersMap.get(node.divisionCode) ?? [];

  // 검색 필터링
  const matchesSearch = searchTerm === '' || node.divisionName.toLowerCase().includes(searchTerm.toLowerCase());
  const hasMatchingDescendant = useMemo(() => {
    if (searchTerm === '') return false;
    const check = (children: OrgTreeNode[]): boolean =>
      children.some(
        (child) => child.divisionName.toLowerCase().includes(searchTerm.toLowerCase()) || check(child.children),
      );
    return check(node.children);
  }, [node.children, searchTerm]);

  // 이 부서(+하위)의 로드된 유저 기반 선택 상태 — early return 전에 모든 hooks 호출
  const allDivisionCodes = useMemo(() => collectAllDivisionCodes(node), [node]);
  const allDeptUsers = useMemo(() => {
    const result: FlowUser[] = [];
    for (const code of allDivisionCodes) {
      const u = loadedUsersMap.get(code);
      if (u) result.push(...u);
    }
    return result;
  }, [allDivisionCodes, loadedUsersMap]);

  const selectedInDept = allDeptUsers.filter((u) => selectedUserIds.has(u.thirdPartyUserId)).length;
  const totalInDept = allDeptUsers.length;
  const isAllSelected = totalInDept > 0 && selectedInDept === totalInDept;
  const isPartiallySelected = selectedInDept > 0 && selectedInDept < totalInDept;

  if (!matchesSearch && !hasMatchingDescendant) return null;

  const handleExpandClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const willExpand = !isExpanded;
    onToggleExpand(node.divisionCode);

    if (willExpand && !hasFetched) {
      setHasFetched(true);
      setIsLoading(true);
      try {
        const result = await fetchUsers(node.divisionCode);
        onSetLoadedUsers(node.divisionCode, result.users);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 부서 체크: 미로드 하위 부서 자동 fetch 후 토글
  const handleDepartmentCheck = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const unloadedCodes = allDivisionCodes.filter((code) => !loadedUsersMap.has(code));

    if (unloadedCodes.length > 0) {
      setIsCheckLoading(true);
      try {
        await Promise.all(
          unloadedCodes.map(async (code) => {
            const result = await fetchUsers(code);
            onSetLoadedUsers(code, result.users);
          }),
        );
      } finally {
        setIsCheckLoading(false);
      }
    }

    onToggleDepartmentUsers(allDivisionCodes);
  };

  // 바깥 컨테이너에 px-2(8px) → 내부 paddingLeft는 4px부터 시작 (8+4=12=검색바 px-3)
  const leftPad = 4 + level * 16;
  const userLeftPad = 4 + (level + 1) * 16;

  return (
    <div className='w-full'>
      {/* 부서 행 */}
      <div
        className={cn(
          'flex h-10 w-full items-center gap-2 rounded py-1.5 text-xs leading-[20px] transition-colors',
          'cursor-pointer hover:bg-slate-50',
        )}
        style={{ paddingLeft: `${leftPad}px`, paddingRight: `${RIGHT_PAD}px` }}
        onClick={handleExpandClick}
      >
        {/* +/- 버튼 */}
        <div className='flex shrink-0 items-center'>
          <Button
            variant='outline'
            size='icon'
            className='h-4 w-4 rounded-none hover:bg-slate-200'
            onClick={handleExpandClick}
          >
            {isExpanded ? <Minus className='!w-[12px]' /> : <Plus className='!w-[12px]' />}
          </Button>
        </div>

        {/* 부서명 + 인원수 */}
        <div className='line-clamp-1 flex w-full flex-1 items-center gap-1 font-normal leading-5'>
          <span className='truncate text-slate-950'>{node.divisionName}</span>
          <span className='shrink-0 text-xs text-slate-500'>({node.employeeCount})</span>
        </div>

        {/* 선택 개수 */}
        {selectedInDept > 0 && (
          <span className='text-muted-foreground shrink-0 text-xs'>
            {t(i18n.common.flow_select_modal.selection_count_user_only, { count: selectedInDept })}
          </span>
        )}

        {/* 부서 체크박스 (우측) */}
        {showCheckbox && (
          <div onClick={handleDepartmentCheck} className='flex shrink-0 items-center'>
            <Checkbox
              checked={isAllSelected ? true : isPartiallySelected ? 'indeterminate' : false}
              disabled={isCheckLoading}
              className='pointer-events-none border-gray-300 shadow-none'
              aria-label={t(i18n.common.flow_select_modal.select_all_aria, { name: node.divisionName })}
            />
          </div>
        )}
      </div>

      {/* 펼쳐진 상태: 자식 부서 + 사용자 목록 */}
      {isExpanded && (
        <div className='w-full'>
          {/* 하위 부서 (재귀) */}
          {hasChildren &&
            node.children.map((child) => (
              <OrgTreeItem
                key={child.divisionCode}
                node={child}
                level={level + 1}
                expandedNodes={expandedNodes}
                onToggleExpand={onToggleExpand}
                fetchUsers={fetchUsers}
                selectedUserIds={selectedUserIds}
                onToggleUser={onToggleUser}
                onToggleDepartmentUsers={onToggleDepartmentUsers}
                selectionMode={selectionMode}
                searchTerm={searchTerm}
                loadedUsersMap={loadedUsersMap}
                onSetLoadedUsers={onSetLoadedUsers}
              />
            ))}

          {/* 사용자 목록 */}
          <div style={{ paddingLeft: `${userLeftPad}px`, paddingRight: `${RIGHT_PAD}px` }}>
            {isLoading ? (
              Array.from({ length: SKELETON_USER_COUNT }).map((_, i) => (
                <div key={i} className='flex h-10 items-center gap-2'>
                  <Skeleton className='h-5 w-5 rounded-full' />
                  <Skeleton className='h-3 flex-1' />
                  {showCheckbox && <Skeleton className='h-4 w-4 rounded' />}
                </div>
              ))
            ) : users.length === 0 && !hasChildren ? (
              <p className='text-muted-foreground py-2 text-xs'>
                {t(i18n.common.flow_select_modal.no_members_in_dept)}
              </p>
            ) : (
              users.map((user) => (
                <UserListItem
                  key={user.thirdPartyUserId}
                  user={user}
                  isSelected={selectedUserIds.has(user.thirdPartyUserId)}
                  onToggle={onToggleUser}
                  showCheckbox={showCheckbox}
                  compact
                  className='px-0'
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
});

// ──────────────────────────────────────────────────────────
// OrganizationTreePanel
// ──────────────────────────────────────────────────────────

interface OrganizationTreePanelProps {
  departments: FlowDepartment[];
  selectedUserIds: Set<string>;
  onToggleUser: (user: FlowUser) => void;
  onToggleDepartmentUsers: (users: FlowUser[], allSelected: boolean) => void;
  fetchUsersByDepartment: (divisionCode: string) => Promise<{ users: FlowUser[]; hasNext: boolean }>;
  selectionMode?: 'single' | 'multi';
  searchKeyword: string;
  isLoading: boolean;
  error: Error | null;
  className?: string;
}

export const OrganizationTreePanel = memo(function OrganizationTreePanel({
  departments,
  selectedUserIds,
  onToggleUser,
  onToggleDepartmentUsers,
  fetchUsersByDepartment,
  selectionMode = 'multi',
  searchKeyword,
  isLoading,
  error,
  className,
}: OrganizationTreePanelProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [loadedUsersMap, setLoadedUsersMap] = useState<Map<string, FlowUser[]>>(new Map());
  const { t } = useAppTranslation('common');

  const treeData = useMemo(() => buildDepartmentTree(departments), [departments]);

  // 1뎁스 자동 펼침 + 유저 로드
  const hasAutoExpanded = useRef(false);
  useEffect(() => {
    if (hasAutoExpanded.current || treeData.length === 0) return;
    hasAutoExpanded.current = true;

    const rootCodes = treeData.map((n) => n.divisionCode);
    setExpandedNodes(new Set(rootCodes));

    // 루트 부서들의 유저를 자동 로드
    Promise.all(
      rootCodes.map(async (code) => {
        const result = await fetchUsersByDepartment(code);
        return { code, users: result.users };
      }),
    ).then((results) => {
      setLoadedUsersMap((prev) => {
        const next = new Map(prev);
        for (const { code, users } of results) {
          next.set(code, users);
        }
        return next;
      });
    });
  }, [treeData, fetchUsersByDepartment]);

  const handleToggleExpand = useCallback((code: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  }, []);

  const handleSetLoadedUsers = useCallback((divisionCode: string, users: FlowUser[]) => {
    setLoadedUsersMap((prev) => {
      const next = new Map(prev);
      next.set(divisionCode, users);
      return next;
    });
  }, []);

  const handleToggleDepartmentUsers = useCallback(
    (divisionCodes: string[]) => {
      const deptUsers: FlowUser[] = [];
      for (const code of divisionCodes) {
        const users = loadedUsersMap.get(code);
        if (users) deptUsers.push(...users);
      }
      if (deptUsers.length === 0) return;

      const allSelected = deptUsers.every((u) => selectedUserIds.has(u.thirdPartyUserId));
      onToggleDepartmentUsers(deptUsers, allSelected);
    },
    [loadedUsersMap, selectedUserIds, onToggleDepartmentUsers],
  );

  // 검색 시 매칭 노드의 부모 자동 펼침
  useEffect(() => {
    if (!searchKeyword.trim()) return;
    const keyword = searchKeyword.trim().toLowerCase();
    const toExpand = new Set<string>();

    const findMatches = (nodes: OrgTreeNode[], parentCodes: string[]): boolean => {
      let anyMatch = false;
      for (const node of nodes) {
        const selfMatch = node.divisionName.toLowerCase().includes(keyword);
        const childMatch = findMatches(node.children, [...parentCodes, node.divisionCode]);
        if (selfMatch || childMatch) {
          anyMatch = true;
          parentCodes.forEach((code) => toExpand.add(code));
          if (childMatch) toExpand.add(node.divisionCode);
        }
      }
      return anyMatch;
    };

    findMatches(treeData, []);
    setExpandedNodes(toExpand);
  }, [searchKeyword, treeData]);

  if (isLoading) {
    return (
      <div className={cn('h-full overflow-hidden px-2 py-1', className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className='flex h-10 items-center gap-3'
            style={{ paddingLeft: '4px', paddingRight: `${RIGHT_PAD}px` }}
          >
            <Skeleton className='h-4 w-4 rounded' />
            <Skeleton className='h-4 flex-1' />
            <Skeleton className='h-4 w-4 rounded' />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('h-full overflow-hidden', className)}>
        <div className='p-4 text-center'>
          <p className='text-destructive text-sm'>{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('h-full overflow-y-auto overflow-x-hidden px-2 py-1', className)}>
      {treeData.length === 0 ? (
        <p className='text-muted-foreground p-4 text-center text-sm'>{t(i18n.common.flow_select_modal.no_org_data)}</p>
      ) : (
        treeData.map((node) => (
          <OrgTreeItem
            key={node.divisionCode}
            node={node}
            level={0}
            expandedNodes={expandedNodes}
            onToggleExpand={handleToggleExpand}
            fetchUsers={fetchUsersByDepartment}
            selectedUserIds={selectedUserIds}
            onToggleUser={onToggleUser}
            onToggleDepartmentUsers={handleToggleDepartmentUsers}
            selectionMode={selectionMode}
            searchTerm={searchKeyword.trim()}
            loadedUsersMap={loadedUsersMap}
            onSetLoadedUsers={handleSetLoadedUsers}
          />
        ))
      )}
    </div>
  );
});
