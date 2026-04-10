'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { cn } from '@/lib/utils';
import { i18n } from '@flowai/i18n';
import type { FlowProject, FlowProjectFolder } from '@flowai/shared';
import { ChevronDown, Tag } from 'lucide-react';
import { memo, useState } from 'react';
import { ProjectListItem } from './ProjectListItem';

interface FolderGroupItemProps {
  folder: FlowProjectFolder;
  selectedProjectIds: Set<string>;
  /** 프로젝트가 어느 폴더에서 선택되었는지 (projectId -> folderId) */
  projectFolderMap: Map<string, string>;
  onToggleProject: (project: FlowProject, folderId?: string) => void;
  onToggleFolder: (folder: FlowProjectFolder) => void;
  /** 선택 모드 (기본: multi) */
  selectionMode?: 'single' | 'multi';
  disabled?: boolean;
  className?: string;
}

/**
 * 폴더별 프로젝트 그룹 아이템 (아코디언 형태)
 */
export const FolderGroupItem = memo(function FolderGroupItem({
  folder,
  selectedProjectIds,
  projectFolderMap,
  onToggleProject,
  onToggleFolder,
  selectionMode = 'multi',
  disabled = false,
  className,
}: FolderGroupItemProps) {
  const { t } = useAppTranslation('common');
  const [isOpen, setIsOpen] = useState(false);

  const isSingleMode = selectionMode === 'single';
  const showCheckbox = !isSingleMode;

  // 이 폴더에서 선택된 프로젝트 (이 폴더를 통해 선택된 것만)
  const selectedInThisFolder = folder.projects.filter(
    (p) => selectedProjectIds.has(p.projectId) && projectFolderMap.get(p.projectId) === folder.folderId,
  );
  // 이 폴더에서 선택 가능한 프로젝트 (아직 선택 안 됐거나, 이 폴더에서 선택된 것)
  const selectableProjects = folder.projects.filter((p) => {
    const selectedFromFolder = projectFolderMap.get(p.projectId);
    return !selectedFromFolder || selectedFromFolder === folder.folderId;
  });
  const selectedCount = selectedInThisFolder.length;
  const selectableCount = selectableProjects.length;
  const totalCount = folder.projects.length;
  // 선택 가능한 모든 프로젝트가 선택됨 (다른 폴더에서 선택된 건 제외)
  const isAllSelected = selectableCount > 0 && selectedCount === selectableCount;

  const handleFolderCheckClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFolder(folder);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={cn('border-b last:border-b-0', className)}>
      {/* 폴더 헤더 */}
      <CollapsibleTrigger asChild>
        <div
          className={cn(
            'flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors',
            'hover:bg-accent',
            disabled && 'cursor-not-allowed opacity-50',
          )}
        >
          {/* 폴더 체크박스 (multi 모드에서만 표시) */}
          {showCheckbox && (
            <div onClick={handleFolderCheckClick} className='flex items-center'>
              <Checkbox
                checked={isAllSelected}
                // indeterminate 상태는 요구사항에서 제외됨
                disabled={disabled}
                className='pointer-events-none'
                aria-hidden='true'
              />
            </div>
          )}

          {/* 폴더 아이콘 */}
          <Tag className='h-4 w-4 shrink-0 -scale-x-100 text-[rgba(224,41,184,1)]' aria-hidden='true' />

          {/* 폴더명 + 개수 */}
          <span className='flex-1 truncate text-sm font-medium'>
            {folder.folderName} ({totalCount})
          </span>

          {/* 선택 개수 표시 */}
          {selectedCount > 0 && (
            <span className='text-muted-foreground text-xs'>
              {t(i18n.common.flow_select_modal.selection_count_item_only, { count: selectedCount })}
            </span>
          )}

          {/* 확장 아이콘 */}
          <ChevronDown
            className={cn('text-muted-foreground h-4 w-4 shrink-0 transition-transform', isOpen && 'rotate-180')}
          />
        </div>
      </CollapsibleTrigger>

      {/* 프로젝트 목록 */}
      <CollapsibleContent>
        <div className='bg-muted/30 py-1 pl-6'>
          {folder.projects.map((project) => {
            const selectedInFolderId = projectFolderMap.get(project.projectId);
            // 다른 폴더에서 선택된 경우 disabled
            const isDisabledByOtherFolder = !!selectedInFolderId && selectedInFolderId !== folder.folderId;
            return (
              <ProjectListItem
                key={project.projectId}
                project={project}
                isSelected={selectedProjectIds.has(project.projectId)}
                isDisabled={disabled || isDisabledByOtherFolder}
                onToggle={(p) => onToggleProject(p, folder.folderId)}
                showCheckbox={showCheckbox}
              />
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});
