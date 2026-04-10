'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, Check, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import type { DepartmentTreeNode } from '@/types/admin-dashboard-widget';
import type { DivisionHierarchy } from '@/stores/company.store';
import { cn } from '@/lib/utils';
import { i18n } from '@flowai/i18n';

// ─── Tree Item ───────────────────────────────────────────────

interface DepartmentTreeItemProps {
  node: DepartmentTreeNode;
  level: number;
  isExpanded: boolean;
  isSelected: boolean;
  searchTerm: string;
  selectedValue: string;
  expandedNodes: Set<string>;
  onToggle: (nodeId: string) => void;
  onSelect: (nodeId: string) => void;
}

const DepartmentTreeItem = React.memo<DepartmentTreeItemProps>(
  ({ node, level, isExpanded, isSelected, searchTerm, selectedValue, expandedNodes, onToggle, onSelect }) => {
    const hasChildren = node.children && node.children.length > 0;
    const matchesSearch = searchTerm === '' || node.name.toLowerCase().includes(searchTerm.toLowerCase());

    const hasMatchingChildren = useMemo(() => {
      if (!hasChildren || searchTerm === '') return false;

      const checkChildrenRecursively = (children: DepartmentTreeNode[]): boolean => {
        return children.some((child) => {
          if (child.name.toLowerCase().includes(searchTerm.toLowerCase())) {
            return true;
          }
          if (child.children) {
            return checkChildrenRecursively(child.children);
          }
          return false;
        });
      };

      return checkChildrenRecursively(node.children!);
    }, [hasChildren, node.children, searchTerm]);

    const shouldShow = matchesSearch || hasMatchingChildren;

    if (!shouldShow) return null;

    const handleExpandClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (hasChildren) {
        onToggle(node.id);
      }
    };

    return (
      <div className='w-full'>
        <div
          className={cn(
            'flex h-9 w-full items-center gap-2 py-1.5 text-xs leading-[20px] transition-colors',
            'cursor-pointer hover:bg-slate-50',
            isSelected ? 'bg-slate-100 text-slate-950' : 'bg-white text-slate-950',
          )}
          style={{
            paddingLeft: `${Math.max(8 + level * 16, 8)}px`,
            paddingRight: `${isSelected ? '8px' : '0px'}`,
          }}
          onClick={() => onSelect(node.id)}
        >
          <div className='flex shrink-0 items-center'>
            {hasChildren ? (
              <Button
                variant='outline'
                size='icon'
                className='h-4 w-4 rounded-none hover:bg-slate-200'
                onClick={handleExpandClick}
              >
                {isExpanded ? <Minus className='!w-[12px]' /> : <Plus className='!w-[12px]' />}
              </Button>
            ) : (
              <div className='w-4' />
            )}
          </div>

          <div className='line-clamp-1 flex w-full flex-1 items-center gap-1 font-normal leading-5'>
            <span className='truncate text-slate-950'>{node.name}</span>
            <span className='shrink-0 text-xs text-slate-500'>({node.count})</span>
          </div>

          {isSelected && (
            <div className='flex shrink-0 items-center'>
              <Check className='text-primary h-4 w-4' />
            </div>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className='w-full'>
            {node.children!.map((child) => (
              <DepartmentTreeItem
                key={child.id}
                node={child}
                level={level + 1}
                isExpanded={expandedNodes.has(child.id)}
                isSelected={child.id === selectedValue}
                searchTerm={searchTerm}
                selectedValue={selectedValue}
                expandedNodes={expandedNodes}
                onToggle={onToggle}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    );
  },
);

DepartmentTreeItem.displayName = 'DepartmentTreeItem';

// ─── Utility ─────────────────────────────────────────────────

export function convertDivisionHierarchyToTree(hierarchy: DivisionHierarchy): DepartmentTreeNode[] {
  const rootNodes = Object.values(hierarchy).filter(
    (node) => !node.higherDivisionCode || node.higherDivisionCode === '',
  );

  const buildTree = (divisionCode: string): DepartmentTreeNode => {
    const node = hierarchy[divisionCode];
    const childNodes =
      node.children && node.children.length > 0 ? node.children.map((childCode) => buildTree(childCode)) : undefined;

    const count =
      node.allUserIds?.length ||
      (node.employeeCount
        ? typeof node.employeeCount === 'number'
          ? node.employeeCount
          : parseInt(node.employeeCount, 10)
        : 0);

    return {
      id: node.divisionCode,
      name: node.divisionName,
      count,
      children: childNodes,
      parentId: node.higherDivisionCode || undefined,
      isLastDivision: node.isLastDivision,
      isChildrenLoaded: node.isChildrenLoaded,
      allUserIds: node.allUserIds,
    };
  };

  return rootNodes.map((root) => buildTree(root.divisionCode));
}

export function computeTotalCount(hierarchy: DivisionHierarchy): number {
  const allUserIds = new Set<number>();
  Object.values(hierarchy).forEach((node) => {
    if (node.userIds && node.userIds.length > 0) {
      node.userIds.forEach((userId) => allUserIds.add(userId));
    }
  });
  return allUserIds.size;
}

// ─── Hook: search + expand state ─────────────────────────────

export function useDepartmentTreeState(departmentTreeData: DepartmentTreeNode[]) {
  const [searchTerm, setSearchTerm] = useState('');
  // Default: expand 1st depth (root nodes)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    return new Set(departmentTreeData.filter((n) => n.children && n.children.length > 0).map((n) => n.id));
  });

  const handleToggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  // Auto-expand root (1st depth) nodes when tree data loads
  const initializedRef = React.useRef(false);
  useEffect(() => {
    if (!initializedRef.current && departmentTreeData.length > 0) {
      initializedRef.current = true;
      const rootIds = departmentTreeData.filter((n) => n.children && n.children.length > 0).map((n) => n.id);
      if (rootIds.length > 0) {
        setExpandedNodes((prev) => {
          const next = new Set(prev);
          rootIds.forEach((id) => next.add(id));
          return next;
        });
      }
    }
  }, [departmentTreeData]);

  // 검색 시 매칭되는 노드의 모든 상위 노드를 자동 확장
  useEffect(() => {
    if (searchTerm) {
      const newExpanded = new Set<string>();

      const expandParentsOfMatchingNodes = (nodes: DepartmentTreeNode[], parentId?: string): boolean => {
        nodes.forEach((node) => {
          let hasMatch = node.name.toLowerCase().includes(searchTerm.toLowerCase());

          if (node.children) {
            const childMatch = expandParentsOfMatchingNodes(node.children, node.id);
            if (childMatch) {
              hasMatch = true;
              newExpanded.add(node.id);
            }
          }

          if (hasMatch && parentId) {
            newExpanded.add(parentId);
          }

          return hasMatch;
        });

        return nodes.some(
          (node) =>
            node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (node.children && expandParentsOfMatchingNodes(node.children, node.id)),
        );
      };

      expandParentsOfMatchingNodes(departmentTreeData);
      setExpandedNodes(newExpanded);
    }
  }, [searchTerm, departmentTreeData]);

  return { searchTerm, setSearchTerm, expandedNodes, handleToggleExpand };
}

// ─── Content Component ───────────────────────────────────────

export interface DepartmentTreeContentProps {
  divisionHierarchy: DivisionHierarchy;
  value: string;
  onSelect: (nodeId: string) => void;
  showSearch?: boolean;
  className?: string;
}

export function DepartmentTreeContent({
  divisionHierarchy,
  value,
  onSelect,
  showSearch = true,
  className,
}: DepartmentTreeContentProps) {
  const { t } = useAppTranslation('common');

  const departmentTreeData = useMemo(() => {
    if (!divisionHierarchy || Object.keys(divisionHierarchy).length === 0) {
      return [];
    }
    return convertDivisionHierarchyToTree(divisionHierarchy);
  }, [divisionHierarchy]);

  const totalCount = useMemo(() => computeTotalCount(divisionHierarchy), [divisionHierarchy]);

  const { searchTerm, setSearchTerm, expandedNodes, handleToggleExpand } = useDepartmentTreeState(departmentTreeData);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    [setSearchTerm],
  );

  return (
    <div className={cn('flex flex-col overflow-hidden', className)}>
      {showSearch && (
        <>
          <div className='p-1'>
            <div className='flex items-center gap-2 px-2 py-2.5'>
              <Search className='h-4 w-4 flex-shrink-0 text-slate-950' />
              <Input
                type='text'
                placeholder={t(i18n.common.department_tree.search_placeholder)}
                value={searchTerm}
                onChange={handleSearchChange}
                className='h-auto border-0 p-0 text-sm leading-[20px] text-slate-500 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0'
              />
            </div>
          </div>
          <div className='border-border h-0 border-t' />
        </>
      )}

      <div className='scrollbar-none flex-1 overflow-y-auto p-1'>
        <div className='px-[5px] pb-[5px] pt-0'>
          {/* 전체 부서 옵션 */}
          <div
            className={cn(
              'flex h-9 w-full cursor-pointer items-center gap-2 px-2 py-1.5 text-xs leading-[20px] transition-colors',
              value === 'all' ? 'bg-slate-100 text-slate-950' : 'bg-white text-slate-950 hover:bg-slate-50',
            )}
            onClick={() => onSelect('all')}
          >
            <div className='flex flex-1 items-center gap-1 font-normal'>
              <span>{t(i18n.common.department_tree.all_departments)}</span>
              <span className='text-slate-500'>({totalCount})</span>
            </div>
            {value === 'all' && (
              <div className='flex shrink-0 items-center'>
                <Check className='text-primary h-4 w-4' />
              </div>
            )}
          </div>

          {/* 부서 트리 */}
          {departmentTreeData.map((dept) => (
            <DepartmentTreeItem
              key={dept.id}
              node={dept}
              level={0}
              isExpanded={expandedNodes.has(dept.id)}
              isSelected={value === dept.id}
              searchTerm={searchTerm}
              selectedValue={value}
              expandedNodes={expandedNodes}
              onToggle={handleToggleExpand}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
