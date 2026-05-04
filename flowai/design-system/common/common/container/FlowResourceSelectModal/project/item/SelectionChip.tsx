'use client';

import { useAppTranslation } from '@/hooks/useAppTranslation';
import { cn } from '@/lib/utils';
import type { FlowProject } from '@flowai/shared';
import { i18n } from '@flowai/i18n';
import { X } from 'lucide-react';
import { memo, useMemo } from 'react';

interface SelectionChipProps {
  project: FlowProject;
  onRemove: (projectId: string) => void;
  onClick?: () => void;
  className?: string;
}

/**
 * 검색 하이라이팅 마커(!#!...!#!)를 제거하고 순수 텍스트만 반환
 */
const stripHighlightMarkers = (text: string): string => {
  return text.replace(/!#!(.+?)!#!/g, '$1');
};

/**
 * 선택된 프로젝트를 표시하는 Chip 컴포넌트
 */
export const SelectionChip = memo(function SelectionChip({
  project,
  onRemove,
  onClick,
  className,
}: SelectionChipProps) {
  const { t } = useAppTranslation('common');
  const displayTitle = useMemo(() => {
    const title = project.title ?? project.projectId;
    return stripHighlightMarkers(title);
  }, [project.title, project.projectId]);

  return (
    <div
      onClick={onClick}
      className={cn(
        'inline-flex min-w-0 items-center gap-1.5 rounded-full px-3 py-1.5',
        'items-center justify-between',
        'bg-secondary text-secondary-foreground',
        'text-xs',
        onClick && 'hover:bg-secondary/80 cursor-pointer transition-colors',
        className,
      )}
    >
      <div className='flex min-w-0 flex-1 items-center gap-1.5'>
        {/* 색상 인디케이터 */}
        {project.colorCode && (
          <span
            className='h-3 w-3 shrink-0 rounded-full'
            style={{ backgroundColor: project.colorCode }}
            aria-hidden='true'
          />
        )}

        {/* 프로젝트명 (하이라이팅 마커 제거됨) */}
        <span className='max-w-[140px] truncate'>{displayTitle}</span>
      </div>

      {/* 삭제 버튼 */}
      <button
        type='button'
        onClick={(e) => {
          e.stopPropagation();
          onRemove(project.projectId);
        }}
        className='hover:bg-secondary-foreground/10 -mr-0.5 rounded-full p-0.5 transition-colors'
        aria-label={t(i18n.common.flow_select_modal.deselect_aria, { name: project.title ?? project.projectId })}
      >
        <X className='h-3.5 w-3.5' />
      </button>
    </div>
  );
});
