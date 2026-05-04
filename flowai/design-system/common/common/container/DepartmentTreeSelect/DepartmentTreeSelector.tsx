'use client';

import React, { useMemo, useCallback, useState, forwardRef } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import type { DepartmentTreeNode, DepartmentTreeProps } from '@/types/admin-dashboard-widget';
import type { DivisionHierarchy } from '@/stores/company.store';
import { cn } from '@/lib/utils';
import { i18n } from '@flowai/i18n';
import { DepartmentTreeContent, convertDivisionHierarchyToTree, computeTotalCount } from './DepartmentTreeContent';

interface ExtendedDepartmentTreeProps extends DepartmentTreeProps {
  divisionHierarchy?: DivisionHierarchy;
}

const DepartmentTreeSelector = forwardRef<HTMLDivElement, ExtendedDepartmentTreeProps>(
  ({ value = 'all', onValueChange, divisionHierarchy, className }, ref) => {
    const [isOpen, setIsOpen] = useState(false);

    const { t } = useAppTranslation('common');

    const departmentTreeData = useMemo(() => {
      if (!divisionHierarchy || Object.keys(divisionHierarchy).length === 0) {
        return [];
      }
      return convertDivisionHierarchyToTree(divisionHierarchy);
    }, [divisionHierarchy]);

    const totalCount = useMemo(
      () => (divisionHierarchy ? computeTotalCount(divisionHierarchy) : 0),
      [divisionHierarchy],
    );

    // 선택된 부서명 표시
    const selectedDepartment = useMemo(() => {
      if (!value || value === 'all') return { name: t(i18n.common.department_tree.all_departments), count: totalCount };
      if (value === 'none')
        return {
          name: t(i18n.common.department_tree.unspecified_department),
          count: divisionHierarchy?.['none']?.employeeCount || 0,
        };

      const findDepartment = (nodes: DepartmentTreeNode[]): { name: string; count: number } | null => {
        for (const node of nodes) {
          if (node.id === value) return { name: node.name, count: node.count };
          if (node.children) {
            const result = findDepartment(node.children);
            if (result) return result;
          }
        }
        return null;
      };

      const result = findDepartment(departmentTreeData);
      if (result) return result;
      return { name: t(i18n.common.department_tree.all_departments), count: totalCount };
    }, [value, totalCount, departmentTreeData, t, divisionHierarchy]);

    const handleSelect = useCallback(
      (nodeId: string) => {
        onValueChange?.(nodeId);
        setIsOpen(false);
      },
      [onValueChange],
    );

    const handleTriggerClick = useCallback(() => {
      setIsOpen(!isOpen);
    }, [isOpen]);

    const handleReset = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onValueChange?.('all');
      },
      [onValueChange],
    );

    return (
      <div ref={ref} className={cn('relative', className)}>
        {/* 트리거 버튼 */}
        <Button
          variant='outline'
          onClick={handleTriggerClick}
          className={cn('h-10 w-full justify-between gap-2 px-3', 'text-left font-normal', 'hover:bg-slate-50')}
        >
          <div className='line-clamp-1 flex min-w-0 flex-1 items-center gap-1 text-sm leading-5'>
            <span className='truncate text-slate-950'>{selectedDepartment.name}</span>
            <span className='shrink-0 text-xs text-slate-500'>({selectedDepartment.count})</span>
          </div>
          <div className='flex shrink-0 items-center gap-1'>
            {value !== 'all' && (
              <div
                role='button'
                tabIndex={0}
                onClick={handleReset}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleReset(e as any);
                  }
                }}
                className='flex h-4 w-4 cursor-pointer items-center justify-center rounded-sm transition-colors hover:bg-slate-200'
                aria-label={t(i18n.common.department_tree.filter_reset_aria)}
              >
                <X className='h-3 w-3 text-slate-500' />
              </div>
            )}
            <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')} />
          </div>
        </Button>

        {/* 드롭다운 콘텐츠 */}
        {isOpen && (
          <>
            <div className='fixed inset-0 z-40' onClick={() => setIsOpen(false)} />
            <div
              className={cn(
                'absolute left-0 top-full z-50 mt-1 w-full',
                'rounded-lg border border-slate-200 bg-white',
                'shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]',
                'overflow-hidden',
              )}
            >
              {divisionHierarchy && (
                <DepartmentTreeContent
                  divisionHierarchy={divisionHierarchy}
                  value={value}
                  onSelect={handleSelect}
                  className='max-h-[340px]'
                />
              )}
            </div>
          </>
        )}
      </div>
    );
  },
);

DepartmentTreeSelector.displayName = 'DepartmentTreeSelector';

export { DepartmentTreeSelector, type DepartmentTreeProps, type ExtendedDepartmentTreeProps };
