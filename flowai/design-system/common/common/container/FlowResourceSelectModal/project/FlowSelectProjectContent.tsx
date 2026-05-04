'use client';

import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFlowSelectProject } from '@/hooks/useFlowSelect';
import type { FlowProject, FlowProjectFolder, FlowSelectProjectSearchType } from '@flowai/shared';
import { i18n } from '@flowai/i18n';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { FlowSelectModalFooter } from '../FlowSelectModalFooter';
import { ProjectSearchPanel } from './panel/ProjectSearchPanel';
import { SelectionChipPanel } from './panel/SelectionChipPanel';

export interface FlowSelectProjectContentProps {
  open: boolean;
  onClose: () => void;
  selectionMode?: 'single' | 'multi';
  maxSelection?: number;
  initialProjects?: FlowProject[];
  onConfirmProjects?: (projects: FlowProject[]) => void;
  /** 모바일 모드 강제 적용 (BottomSheet에서 사용) */
  forceMobile?: boolean;
}

/**
 * 선택 상태 인터페이스
 * - 프로젝트 목록과 폴더 매핑을 하나의 상태로 관리
 */
interface SelectionState {
  projects: FlowProject[];
  folderMap: Map<string, string>;
}

/**
 * 플로우 프로젝트 선택 컨텐츠
 * - 검색 패널 (좌측)
 * - 선택 패널 (우측)
 * - 푸터 (취소/확인)
 */
export const FlowSelectProjectContent = memo(function FlowSelectProjectContent({
  open,
  onClose,
  selectionMode = 'multi',
  maxSelection,
  initialProjects = [],
  onConfirmProjects,
  forceMobile,
}: FlowSelectProjectContentProps) {
  const { t } = useAppTranslation('common');
  const isMobileDevice = useIsMobile();
  const isMobile = forceMobile ?? isMobileDevice;

  // 통합된 선택 상태 (모달 내부용)
  const [selectionState, setSelectionState] = useState<SelectionState>({
    projects: initialProjects,
    folderMap: new Map(),
  });

  // 프로젝트 데이터 fetch
  const {
    filteredProjects,
    filteredFolders,
    searchType,
    setSearchType,
    searchKeyword,
    setSearchKeyword,
    isLoading,
    error,
  } = useFlowSelectProject({ enabled: open });

  const handleSearchTypeChange = (v: FlowSelectProjectSearchType) => {
    setSearchType(v);
    // 검색 타입 변경 시 로컬 선택 상태만 클리어 (전역 store는 확인 버튼 클릭 시에만 업데이트)
    setSelectionState({
      projects: [],
      folderMap: new Map(),
    });
  };

  // 선택된 프로젝트 ID Set
  const selectedProjectIds = useMemo(
    () => new Set(selectionState.projects.map((p) => p.projectId)),
    [selectionState.projects],
  );

  // 모달 열릴 때 초기값 설정
  useEffect(() => {
    if (open) {
      setSelectionState({
        projects: initialProjects,
        folderMap: new Map(),
      });
      setSearchKeyword('');
    }
  }, [open, initialProjects, setSearchKeyword]);

  // 프로젝트 토글 (folderId: 어느 폴더에서 선택했는지)
  const handleToggleProject = useCallback(
    (project: FlowProject, folderId?: string) => {
      setSelectionState((prev) => {
        const exists = prev.projects.some((p) => p.projectId === project.projectId);

        if (exists) {
          // 선택 해제 시 폴더 매핑도 제거
          const newFolderMap = new Map(prev.folderMap);
          newFolderMap.delete(project.projectId);
          return {
            projects: prev.projects.filter((p) => p.projectId !== project.projectId),
            folderMap: newFolderMap,
          };
        } else {
          // 단일 선택 모드에서는 기존 선택 대체
          if (selectionMode === 'single') {
            const newFolderMap = new Map<string, string>();
            if (folderId) {
              newFolderMap.set(project.projectId, folderId);
            }
            return {
              projects: [project],
              folderMap: newFolderMap,
            };
          }

          // 최대 선택 개수 체크
          if (maxSelection && prev.projects.length >= maxSelection) {
            toast.error(t(i18n.common.flow_select_modal.max_selection_toast_item, { max: String(maxSelection) }));
            return prev;
          }

          // 선택 시 폴더 매핑 추가
          const newFolderMap = new Map(prev.folderMap);
          if (folderId) {
            newFolderMap.set(project.projectId, folderId);
          }

          return {
            projects: [...prev.projects, project],
            folderMap: newFolderMap,
          };
        }
      });
    },
    [selectionMode, maxSelection],
  );

  // 폴더 내 선택된 프로젝트 계산
  const getSelectedProjectsInFolder = useCallback(
    (folder: FlowProjectFolder) => {
      const folderProjectIds = new Set(folder.projects.map((p) => p.projectId));
      return selectionState.projects.filter(
        (p) => folderProjectIds.has(p.projectId) && selectionState.folderMap.get(p.projectId) === folder.folderId,
      );
    },
    [selectionState],
  );

  // 폴더 내 선택 가능한 프로젝트 계산
  const getSelectableProjectsInFolder = useCallback(
    (folder: FlowProjectFolder) => {
      return folder.projects.filter((p) => {
        const selectedFromFolder = selectionState.folderMap.get(p.projectId);
        return !selectedFromFolder || selectedFromFolder === folder.folderId;
      });
    },
    [selectionState.folderMap],
  );

  // 폴더 전체 해제
  const deselectAllInFolder = useCallback((projectIds: string[]) => {
    const idsToRemove = new Set(projectIds);
    setSelectionState((prev) => {
      const newFolderMap = new Map(prev.folderMap);
      idsToRemove.forEach((id) => newFolderMap.delete(id));
      return {
        projects: prev.projects.filter((p) => !idsToRemove.has(p.projectId)),
        folderMap: newFolderMap,
      };
    });
  }, []);

  // 폴더 전체 선택
  const selectAllInFolder = useCallback(
    (projects: FlowProject[], folderId: string) => {
      setSelectionState((prev) => {
        let actualToAdd = projects;

        // 최대 선택 개수 체크
        if (maxSelection && prev.projects.length + projects.length > maxSelection) {
          const available = maxSelection - prev.projects.length;
          if (available <= 0) {
            toast.error(t(i18n.common.flow_select_modal.max_selection_toast_item, { max: String(maxSelection) }));
            return prev;
          }
          toast.warning(
            t(i18n.common.flow_select_modal.max_selection_warning_item, {
              max: String(maxSelection),
              available: String(available),
            }),
          );
          actualToAdd = projects.slice(0, available);
        }

        // 폴더 매핑 추가
        const newFolderMap = new Map(prev.folderMap);
        actualToAdd.forEach((p) => newFolderMap.set(p.projectId, folderId));

        return {
          projects: [...prev.projects, ...actualToAdd],
          folderMap: newFolderMap,
        };
      });
    },
    [maxSelection],
  );

  // 폴더 전체 토글
  const handleToggleFolder = useCallback(
    (folder: FlowProjectFolder) => {
      const selectedInThisFolder = getSelectedProjectsInFolder(folder);
      const selectableProjects = getSelectableProjectsInFolder(folder);
      const toAdd = selectableProjects.filter(
        (p) => !selectionState.projects.some((existing) => existing.projectId === p.projectId),
      );

      if (toAdd.length === 0 && selectedInThisFolder.length > 0) {
        // 추가할 게 없고, 이미 선택된 게 있으면 → 전체 해제
        deselectAllInFolder(selectedInThisFolder.map((p) => p.projectId));
      } else if (toAdd.length > 0) {
        // 추가할 게 있으면 → 전체 선택
        selectAllInFolder(toAdd, folder.folderId);
      }
    },
    [
      deselectAllInFolder,
      getSelectableProjectsInFolder,
      getSelectedProjectsInFolder,
      selectAllInFolder,
      selectionState.projects,
    ],
  );

  // 개별 삭제
  const handleRemoveProject = useCallback((projectId: string) => {
    setSelectionState((prev) => {
      const newFolderMap = new Map(prev.folderMap);
      newFolderMap.delete(projectId);
      return {
        projects: prev.projects.filter((p) => p.projectId !== projectId),
        folderMap: newFolderMap,
      };
    });
  }, []);

  // 전체 삭제
  const handleClearAll = useCallback(() => {
    setSelectionState({
      projects: [],
      folderMap: new Map(),
    });
  }, []);

  // 취소
  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  // 확인
  const handleConfirm = useCallback(() => {
    onConfirmProjects?.(selectionState.projects);
    onClose();
  }, [selectionState.projects, onConfirmProjects, onClose]);

  const isSingleMode = selectionMode === 'single';

  return (
    <>
      {/* 바디 */}
      <div className={`mt-2 flex min-h-0 flex-1 flex-col gap-3 overflow-hidden ${isMobile ? '' : 'md:flex-row'}`}>
        {/* 좌측: 검색 및 리스트 (스크롤 영역) */}
        <ProjectSearchPanel
          filteredProjects={filteredProjects}
          filteredFolders={filteredFolders}
          searchType={searchType}
          onSearchTypeChange={handleSearchTypeChange}
          searchKeyword={searchKeyword}
          onSearchKeywordChange={setSearchKeyword}
          selectedProjectIds={selectedProjectIds}
          projectFolderMap={selectionState.folderMap}
          onToggleProject={handleToggleProject}
          onToggleFolder={handleToggleFolder}
          selectionMode={selectionMode}
          isLoading={isLoading}
          error={error}
        />

        {/* 우측: 선택된 항목 (multi 모드에서만 표시) */}
        {!isSingleMode && (
          <div
            className={`w-full overflow-y-auto ${isMobile ? 'max-h-[30dvh] shrink-0' : 'flex-1 border-l md:w-[280px]'}`}
          >
            <SelectionChipPanel
              selectedProjects={selectionState.projects}
              onRemove={handleRemoveProject}
              onClearAll={handleClearAll}
              maxSelection={maxSelection}
            />
          </div>
        )}
      </div>

      {/* 푸터 */}
      <div className='shrink-0'>
        <FlowSelectModalFooter
          onCancel={handleCancel}
          onConfirm={handleConfirm}
          confirmDisabled={selectionState.projects.length === 0}
        />
      </div>
    </>
  );
});
