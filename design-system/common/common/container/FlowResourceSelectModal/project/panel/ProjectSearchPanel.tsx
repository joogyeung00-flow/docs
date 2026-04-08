'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import type { FlowProject, FlowProjectFolder, FlowSelectProjectSearchType } from '@flowai/shared';
import { i18n } from '@flowai/i18n';
import { Fragment, memo, useMemo } from 'react';
import { ResourceTabSearchLayout } from '../../common/ResourceTabSearchLayout';
import { FolderGroupItem } from '../item/FolderGroupItem';
import { ProjectListItem } from '../item/ProjectListItem';

const SKELETON_ITEM_COUNT = 8;

/**
 * 플랫 리스트 뷰 - 즐겨찾기 / 참여중 구분하여 표시
 */
const FlatProjectListView = memo(function FlatProjectListView({
  projects,
  selectedProjectIds,
  projectFolderMap,
  onToggleProject,
  showCheckbox,
  isSearching,
  noResultsLabel,
  favoritesLabel,
  participatingLabel,
}: {
  projects: FlowProject[];
  selectedProjectIds: Set<string>;
  projectFolderMap: Map<string, string>;
  onToggleProject: (project: FlowProject, folderId?: string) => void;
  showCheckbox: boolean;
  isSearching: boolean;
  noResultsLabel: string;
  favoritesLabel: string;
  participatingLabel: string;
}) {
  const { importantProjects, participatingProjects } = useMemo(() => {
    const important: FlowProject[] = [];
    const participating: FlowProject[] = [];

    projects.forEach((project) => {
      if (project.isImportant) {
        important.push(project);
      } else {
        participating.push(project);
      }
    });

    return { importantProjects: important, participatingProjects: participating };
  }, [projects]);

  if (projects.length === 0) {
    return <p className='text-muted-foreground p-4 text-center text-sm'>{noResultsLabel}</p>;
  }

  const renderProjectItem = (project: FlowProject) => {
    const selectedInFolderId = projectFolderMap.get(project.projectId);
    const isDisabledByOtherFolder = !!selectedInFolderId;

    return (
      <ProjectListItem
        key={project.projectId}
        project={project}
        isSelected={selectedProjectIds.has(project.projectId)}
        isDisabled={isDisabledByOtherFolder}
        onToggle={(p) => onToggleProject(p, undefined)}
        showCheckbox={showCheckbox}
        className='h-9'
      />
    );
  };

  // 검색 중일 때는 라벨 없이 플랫하게 표시
  if (isSearching) {
    return <div className='h-full overflow-y-auto overflow-x-hidden'>{projects.map(renderProjectItem)}</div>;
  }

  return (
    <div className='h-full overflow-y-auto overflow-x-hidden'>
      {/* 즐겨찾기 섹션 */}
      {importantProjects.length > 0 && (
        <Fragment>
          <div className='text-foreground px-3 pb-1 pt-1 text-sm font-semibold'>{favoritesLabel}</div>
          {importantProjects.map(renderProjectItem)}
        </Fragment>
      )}

      {participatingProjects.length > 0 && (
        <Fragment>
          <div className='text-foreground px-3 pb-1 pt-2 text-sm font-semibold'>{participatingLabel}</div>
          {participatingProjects.map(renderProjectItem)}
        </Fragment>
      )}
    </div>
  );
});

interface ProjectSearchPanelProps {
  // 데이터
  filteredProjects: FlowProject[];
  filteredFolders: FlowProjectFolder[];

  // 검색 상태
  searchType: FlowSelectProjectSearchType;
  onSearchTypeChange: (type: FlowSelectProjectSearchType) => void;
  searchKeyword: string;
  onSearchKeywordChange: (keyword: string) => void;

  // 선택 상태
  selectedProjectIds: Set<string>;
  /** 프로젝트가 어느 폴더에서 선택되었는지 (projectId -> folderId) */
  projectFolderMap: Map<string, string>;
  onToggleProject: (project: FlowProject, folderId?: string) => void;
  onToggleFolder: (folder: FlowProjectFolder) => void;

  // 선택 모드
  selectionMode?: 'single' | 'multi';

  // 상태
  isLoading: boolean;
  error: Error | null;

  className?: string;
}

/**
 * 프로젝트 검색 및 리스트 패널 (좌측 영역)
 */
export const ProjectSearchPanel = memo(function ProjectSearchPanel({
  filteredProjects,
  filteredFolders,
  searchType,
  onSearchTypeChange,
  searchKeyword,
  onSearchKeywordChange,
  selectedProjectIds,
  projectFolderMap,
  onToggleProject,
  onToggleFolder,
  selectionMode = 'multi',
  isLoading,
  error,
  className,
}: ProjectSearchPanelProps) {
  const { t } = useAppTranslation('common');
  const projectTabs = useMemo(
    () => [
      { value: 'name' as const, label: t(i18n.common.flow_select_modal.tab_project) },
      { value: 'folder' as const, label: t(i18n.common.flow_select_modal.tab_folder) },
    ],
    [t],
  );

  const handleSearchTypeChange = (value: string) => {
    if (value === 'name' || value === 'folder') {
      onSearchTypeChange(value);
    }
  };

  const isSingleMode = selectionMode === 'single';
  const showCheckbox = !isSingleMode;

  return (
    <ResourceTabSearchLayout
      tabs={[...projectTabs]}
      activeTab={searchType}
      onTabChange={handleSearchTypeChange}
      searchKeyword={searchKeyword}
      onSearchKeywordChange={onSearchKeywordChange}
      showBorderRight={!isSingleMode}
      className={className}
    >
      {isLoading ? (
        // 로딩 스켈레톤 (ProjectListItem과 동일한 높이: py-2)
        <div className='py-1'>
          {Array.from({ length: SKELETON_ITEM_COUNT }).map((_, i) => (
            <div key={i} className='flex h-9 items-center gap-3 px-3 py-2'>
              {showCheckbox && <Skeleton className='h-4 w-4 rounded' />}
              <Skeleton className='h-2.5 w-2.5 rounded-full' />
              <Skeleton className='h-4 flex-1' />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className='p-4 text-center'>
          <p className='text-destructive text-sm'>{error.message}</p>
        </div>
      ) : searchType === 'folder' ? (
        <div className='h-full overflow-y-auto overflow-x-hidden py-1'>
          {filteredFolders.length === 0 ? (
            <p className='text-muted-foreground p-4 text-center text-sm'>
              {t(i18n.common.flow_select_modal.no_search_results)}
            </p>
          ) : (
            filteredFolders.map((folder) => (
              <FolderGroupItem
                key={folder.folderId}
                folder={folder}
                selectedProjectIds={selectedProjectIds}
                projectFolderMap={projectFolderMap}
                onToggleProject={onToggleProject}
                onToggleFolder={onToggleFolder}
                selectionMode={selectionMode}
              />
            ))
          )}
        </div>
      ) : (
        <FlatProjectListView
          projects={filteredProjects}
          selectedProjectIds={selectedProjectIds}
          projectFolderMap={projectFolderMap}
          onToggleProject={onToggleProject}
          showCheckbox={showCheckbox}
          isSearching={!!searchKeyword.trim()}
          noResultsLabel={t(i18n.common.flow_select_modal.no_search_results)}
          favoritesLabel={t(i18n.common.flow_select_modal.section_favorites)}
          participatingLabel={t(i18n.common.flow_select_modal.section_participating)}
        />
      )}
    </ResourceTabSearchLayout>
  );
});
