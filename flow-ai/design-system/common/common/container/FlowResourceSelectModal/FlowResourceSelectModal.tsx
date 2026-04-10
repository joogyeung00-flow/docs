'use client';

import { FlexibleDialog, useFlexibleDialogContext } from '@/components/common/ui/FlexibleDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { i18n } from '@flowai/i18n';
import type {
  FlowProject,
  FlowProjectResource,
  FlowResource,
  FlowResourceType,
  FlowUser,
  FlowUserResource,
} from '@flowai/shared';
import { memo, useCallback, useEffect, useState } from 'react';
import { FlowSelectProjectContent } from './project';
import { FlowSelectUserDepartmentContent } from './user-department';

/**
 * FlowResourceSelectModal Props
 * value/onValueChange는 FlowResource (공통 타입) 사용
 */
interface FlowResourceSelectModalProps {
  /** 모달 열림 상태 */
  open: boolean;
  /** 모달 닫기 콜백 */
  onClose: () => void;
  /** 선택 가능한 리소스 타입 (현재는 ['project']만 지원) */
  availableResources: [FlowResourceType, ...FlowResourceType[]];
  /** 현재 선택된 리소스 목록 */
  value: FlowResource[];
  /** 선택 완료 콜백 */
  onValueChange: (resources: FlowResource[]) => void;
  /** 선택 모드 (기본: 'multi') */
  selectionMode?: 'single' | 'multi';
  /** 최대 선택 개수 */
  maxSelection?: number;
  /** 모바일 모드 강제 적용 (디자인 시스템 테스트용) */
  forceMobile?: boolean;
}

/** 모달 내부 콘텐츠 (renderMode에 따라 forceMobile 전달) */
function FlowResourceSelectContent({
  open,
  onClose,
  selectedResourceType,
  selectionMode,
  maxSelection,
  initialProjects,
  initialUsers,
  handleConfirmProjects,
  handleConfirmUsers,
}: {
  open: boolean;
  onClose: () => void;
  selectedResourceType: FlowResourceType;
  selectionMode: 'single' | 'multi';
  maxSelection?: number;
  initialProjects: FlowProject[];
  initialUsers: FlowUser[];
  handleConfirmProjects: (selected: FlowProject[]) => void;
  handleConfirmUsers: (selected: FlowUser[]) => void;
}) {
  const { t } = useAppTranslation('common');
  const { renderMode } = useFlexibleDialogContext();
  const forceContentMobile = renderMode === 'bottom-sheet' || renderMode === 'fullscreen';

  switch (selectedResourceType) {
    case 'project':
    case 'folder':
      return (
        <FlowSelectProjectContent
          open={open}
          onClose={onClose}
          selectionMode={selectionMode}
          maxSelection={maxSelection}
          initialProjects={initialProjects}
          onConfirmProjects={handleConfirmProjects}
          forceMobile={forceContentMobile}
        />
      );
    case 'chatroom':
      return (
        <div className='flex flex-1 items-center justify-center'>
          <p className='text-muted-foreground text-sm'>{t(i18n.common.flow_select_modal.chatroom_coming_soon)}</p>
        </div>
      );
    case 'user':
    case 'department':
      return (
        <FlowSelectUserDepartmentContent
          open={open}
          onClose={onClose}
          selectionMode={selectionMode}
          maxSelection={maxSelection}
          initialUsers={initialUsers}
          onConfirmUsers={handleConfirmUsers}
          forceMobile={forceContentMobile}
        />
      );
    default:
      return null;
  }
}

/**
 * 플로우 리소스 선택 모달
 *
 * @example
 * ```tsx
 * <FlowResourceSelectModal
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   availableResources={['project']}
 *   value={selectedResources}
 *   onValueChange={setSelectedResources}
 * />
 * ```
 */
export const FlowResourceSelectModal = memo(function FlowResourceSelectModal({
  open,
  onClose,
  availableResources,
  value,
  onValueChange,
  selectionMode = 'multi',
  maxSelection,
}: FlowResourceSelectModalProps) {
  const { t } = useAppTranslation('common');
  const [selectedResourceType, setSelectedResourceType] = useState<FlowResourceType>(availableResources[0]);

  useEffect(() => {
    setSelectedResourceType(availableResources[0]);
  }, [availableResources]);

  const hasMultipleResourceTypes = availableResources.length > 1;

  const getResourceTypeLabel = (type: FlowResourceType) => {
    switch (type) {
      case 'project':
        return t(i18n.common.flow_select_modal.resource_type_project);
      case 'folder':
        return t(i18n.common.flow_select_modal.resource_type_folder);
      case 'chatroom':
        return t(i18n.common.flow_select_modal.resource_type_chat);
      case 'user':
        return t(i18n.common.flow_select_modal.resource_type_user);
      case 'department':
        return t(i18n.common.flow_select_modal.resource_type_department);
      default:
        return t(i18n.common.flow_select_modal.resource_type_resource);
    }
  };

  const modalTitle = `${getResourceTypeLabel(selectedResourceType)} ${t(i18n.common.flow_select_modal.title_suffix)}`;

  const handleConfirmProjects = useCallback(
    (selected: FlowProject[]) => {
      const resources: FlowProjectResource[] = selected.map((project) => ({
        type: 'project' as const,
        id: project.projectId,
        name: project.title ?? project.projectId,
        description: project.description || '',
        colorCode: project.colorCode,
        data: project,
      }));
      onValueChange(resources);
      onClose();
    },
    [onValueChange, onClose],
  );

  const handleConfirmUsers = useCallback(
    (selected: FlowUser[]) => {
      const resources: FlowUserResource[] = selected.map((user) => ({
        type: 'user' as const,
        id: user.thirdPartyUserId,
        name: user.name,
        department: user.division,
        position: user.position,
        profileImage: user.profileImageUrl,
        data: user,
      }));
      onValueChange(resources);
      onClose();
    },
    [onValueChange, onClose],
  );

  const initialProjects = value.filter((r): r is FlowProjectResource => r.type === 'project').map((r) => r.data);
  const initialUsers = value.filter((r): r is FlowUserResource => r.type === 'user').map((r) => r.data);

  const headerTitle = hasMultipleResourceTypes ? (
    <Select value={selectedResourceType} onValueChange={(v) => setSelectedResourceType(v as FlowResourceType)}>
      <SelectTrigger className='w-[180px]'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {availableResources.map((type) => (
          <SelectItem key={type} value={type}>
            {getResourceTypeLabel(type)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ) : (
    modalTitle
  );

  return (
    <FlexibleDialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      width={selectionMode === 'single' ? 'standard' : 'wide'}
      webViewMode='fullscreen'
      bottomSheetHeight={95}
      title={headerTitle}
      contentClassName='px-3 md:px-0'
      className='h-[720px]'
    >
      <FlowResourceSelectContent
        open={open}
        onClose={onClose}
        selectedResourceType={selectedResourceType}
        selectionMode={selectionMode}
        maxSelection={maxSelection}
        initialProjects={initialProjects}
        initialUsers={initialUsers}
        handleConfirmProjects={handleConfirmProjects}
        handleConfirmUsers={handleConfirmUsers}
      />
    </FlexibleDialog>
  );
});

export default FlowResourceSelectModal;
