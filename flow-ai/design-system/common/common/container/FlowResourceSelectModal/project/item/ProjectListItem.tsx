'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils/date-formatter';
import type { FlowProject } from '@flowai/shared';
import { Check } from 'lucide-react';
import { memo } from 'react';
import { FlowSearchHighlightedText } from './FlowSearchHighlightedText';

/**
 * 색상의 밝기를 계산하여 밝으면 true 반환
 */
function isLightColor(hexColor: string): boolean {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  // YIQ 공식으로 밝기 계산
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128;
}

interface ProjectListItemProps {
  project: FlowProject;
  isSelected: boolean;
  onToggle: (project: FlowProject) => void;
  /** 다른 폴더에서 이미 선택되어 비활성화됨 */
  isDisabled?: boolean;
  disabled?: boolean;
  /** 체크박스 표시 여부 (기본: true) */
  showCheckbox?: boolean;
  className?: string;
}

/**
 * 프로젝트 리스트 아이템 (체크박스 포함)
 */
export const ProjectListItem = memo(function ProjectListItem({
  project,
  isSelected,
  onToggle,
  isDisabled = false,
  disabled = false,
  showCheckbox = true,
  className,
}: ProjectListItemProps) {
  const isItemDisabled = disabled || isDisabled;
  const handleClick = () => {
    if (!isItemDisabled) {
      onToggle(project);
    }
  };

  return (
    <div
      role='button'
      tabIndex={isItemDisabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors',
        'hover:bg-accent',
        isSelected && 'bg-accent',
        isItemDisabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      {/* 체크박스 (multi 모드) */}
      {showCheckbox && (
        <Checkbox
          checked={isSelected}
          disabled={isItemDisabled}
          className='pointer-events-none border-gray-300 shadow-none'
          aria-hidden='true'
        />
      )}

      {/* 색상 인디케이터: 둥근 네모 + 색상 채움 (싱글 모드에서만 선택 시 체크) */}
      {project.colorCode && (
        <span
          className='flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-all'
          style={{
            backgroundColor: project.colorCode,
            opacity: !showCheckbox && isSelected ? 1 : 0.9,
            ...(!showCheckbox && isSelected && { ringColor: project.colorCode }),
          }}
          aria-hidden='true'
        >
          {!showCheckbox && isSelected && (
            <Check
              className='h-3 w-3'
              strokeWidth={3}
              style={{ color: isLightColor(project.colorCode) ? '#000' : '#fff' }}
            />
          )}
        </span>
      )}

      {/* 프로젝트명 */}
      <FlowSearchHighlightedText text={project.title ?? project.projectId} className='flex-1 truncate text-sm' />

      {/* 업데이트 시간 */}
      {project.updatedAt && (
        <span className='text-muted-foreground shrink-0 text-xs' title={project.updatedAt}>
          {formatRelativeTime(project.updatedAt)}
        </span>
      )}
    </div>
  );
});
