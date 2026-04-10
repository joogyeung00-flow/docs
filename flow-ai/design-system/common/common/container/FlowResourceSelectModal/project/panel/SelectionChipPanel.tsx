'use client';

import { Button } from '@/components/ui/button';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { cn } from '@/lib/utils';
import type { FlowProject } from '@flowai/shared';
import { i18n } from '@flowai/i18n';
import { memo } from 'react';
import { SelectionChip } from '../item/SelectionChip';

interface SelectionChipPanelProps {
  selectedProjects: FlowProject[];
  onRemove: (projectId: string) => void;
  onClearAll: () => void;
  /** 최대 선택 가능 개수 */
  maxSelection?: number;
  className?: string;
}

/**
 * 선택된 프로젝트들을 Chip 형태로 표시하는 우측 패널
 */
export const SelectionChipPanel = memo(function SelectionChipPanel({
  selectedProjects,
  onRemove,
  onClearAll,
  maxSelection,
  className,
}: SelectionChipPanelProps) {
  const { t } = useAppTranslation('common');
  const count = selectedProjects.length;

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* 헤더 */}
      <div className='box-border flex items-center justify-between border-b border-t px-4 py-2 md:border-t-0'>
        <span className='text-sm font-medium'>
          {maxSelection
            ? t(i18n.common.flow_select_modal.selection_count_item, { count, max: maxSelection })
            : t(i18n.common.flow_select_modal.selection_count_item_only, { count: count })}
        </span>
        {count > 0 && (
          <Button variant='ghost' size='sm' onClick={onClearAll} className='text-muted-foreground h-2 px-2'>
            {t(i18n.common.flow_select_modal.reset)}
          </Button>
        )}
      </div>

      {/* Chip 목록 (flex 대신 block+inline-block으로 자연스럽게 column, row 넘어감) */}
      <div className='h-[108px] overflow-y-auto px-3 py-2 md:h-full'>
        {selectedProjects.length === 0 ? (
          <p className='text-muted-foreground text-sm'>{t(i18n.common.flow_select_modal.empty_projects)}</p>
        ) : (
          selectedProjects.map((project) => (
            <span
              key={project.projectId}
              className='mb-1.5 mr-1.5 inline-block align-top'
              style={{ verticalAlign: 'top' }}
            >
              <SelectionChip project={project} onRemove={onRemove} className='h-7 px-2 py-1 text-xs' />
            </span>
          ))
        )}
      </div>
    </div>
  );
});
