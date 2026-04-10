import DeleteConfirmDialog from '@/components/agent/assistant/crud/delete/DeleteConfirmDialog';
import { getAssistantPermissions } from '@/components/agent/assistant/util/assistant-util';
import MasterChip from '@/components/assistant/ui/MasterChip';
import ShareDialog from '@/components/share/dialog/ShareDialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenuAction } from '@/components/ui/sidebar';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useCanEditAssistant } from '@/hooks/useCanEditAssistant';
import { useOptimisticQuickAccessAssistantUpdate } from '@/hooks/useOptimisticAssistantUpdate';
import { QuickAccessApi } from '@/lib/api/quick-access/quick-access.api';
import { useQuickAccessStore } from '@/stores/quick-access.store';
import { i18n } from '@flowai/i18n';
import type { AssistantWithUserLinkResponse } from '@flowai/shared';
import { Assistant, ResourceType, type AssistantShareInfo } from '@flowai/shared';
import { EllipsisVertical, MoreHorizontal, Pencil, Pin, PinOff, Share, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface AssistantDropdownProps {
  mode: 'edit' | 'sidebar' | 'card';
  assistant: Assistant;
  isAdmin: boolean;
  isHovered?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 공유 상태 변경 시 부모에게 알림 (배지 갱신용) */
  onShareUpdate?: (shareInfo: AssistantShareInfo) => void;
}

export default function AssistantDropdown({
  mode = 'edit',
  assistant,
  isAdmin,
  onOpenChange,
  onShareUpdate,
}: AssistantDropdownProps) {
  const { t } = useAppTranslation('common');
  const router = useRouter();
  const [isOpenAssistantDeletedDialog, setIsOpenAssistantDeletedDialog] = useState(false);
  const [isOpenAssistantShareDialog, setIsOpenAssistantShareDialog] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { deleteAssistant } = useOptimisticQuickAccessAssistantUpdate();
  const setSidebarQuickAccess = useQuickAccessStore((state) => state.setSidebarQuickAccess);
  const sidebarQuickAccess = useQuickAccessStore((state) => state.sidebarQuickAccess);

  const setDropdownMenuOpen = useCallback(
    (open: boolean) => {
      setIsDropdownOpen(open);
      onOpenChange?.(open);
    },
    [onOpenChange],
  );

  const handleTriggerPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  const handleTriggerClick = (event: ReactMouseEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  const { canEdit: canEditAssistant, showMasterChip } = useCanEditAssistant({
    isAdmin,
    assistantType: assistant.type,
  });
  const { showShareButton } = getAssistantPermissions(assistant);

  // 현재 어시스턴트가 사이드바에 고정되어 있는지 확인
  const isFixedInSidebar =
    sidebarQuickAccess?.assistants?.some((item: AssistantWithUserLinkResponse) => item.assistant.id === assistant.id) ||
    false;

  const isFixSpaceAvailable = sidebarQuickAccess?.assistants && sidebarQuickAccess.assistants.length < 10;

  const handleEditAssistant = () => {
    if (!canEditAssistant) return;
    const query = showMasterChip ? '?master=1' : '';
    router.push(`/assistant/${assistant.id}/edit${query}`);
  };

  const handleFixLeftMenu = async () => {
    const newFixedState = !isFixedInSidebar;
    try {
      if (!isFixSpaceAvailable && newFixedState) {
        toast.error(t(i18n.common.assistant_dropdown.max_pin_toast));
        return;
      }
      const updatedSidebarData = await QuickAccessApi.updateSidebarQuickAccess(assistant.id, newFixedState);
      setSidebarQuickAccess(updatedSidebarData);
      toast.info(
        newFixedState
          ? t(i18n.common.assistant_dropdown.pin_success, { name: assistant.name })
          : t(i18n.common.assistant_dropdown.unpin_success, { name: assistant.name }),
      );
    } catch (error) {
      toast.error(t(i18n.common.assistant_dropdown.pin_fail));
    }
  };

  const handleOpenShareDialog = () => {
    setIsOpenAssistantShareDialog(true);
  };

  const handleDeleteAssistant = () => {
    setIsOpenAssistantDeletedDialog(true);
  };

  const handleDeleteConfirm = async (totalRemove: boolean) => {
    try {
      await deleteAssistant(assistant.id, totalRemove);
      toast.success(t(i18n.common.assistant_dropdown.delete_success));
    } catch (error) {
      toast.error(t(i18n.common.assistant_dropdown.delete_failed));
      console.error('챗봇 삭제 중 오류가 발생했습니다.', error);
    }
  };

  return (
    <div>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setDropdownMenuOpen}>
        <DropdownMenuTrigger asChild>
          {mode === 'edit' ? (
            <Button
              variant='ghost'
              size='icon'
              aria-label='assistant_options'
              onPointerDown={handleTriggerPointerDown}
              onPointerUp={handleTriggerPointerDown}
              onClick={handleTriggerClick}
            >
              <EllipsisVertical className='!h-5 !w-5' />
            </Button>
          ) : mode === 'sidebar' ? (
            <SidebarMenuAction
              showOnHover
              className='top-1/2 -translate-y-1/2'
              aria-label='assistant_options'
              onPointerDown={handleTriggerPointerDown}
              onPointerUp={handleTriggerPointerDown}
              onClick={handleTriggerClick}
            >
              <MoreHorizontal size={16} />
            </SidebarMenuAction>
          ) : (
            <Button
              variant='ghost'
              size='icon'
              aria-label='assistant_options'
              onPointerDown={handleTriggerPointerDown}
              onPointerUp={handleTriggerPointerDown}
              onClick={handleTriggerClick}
            >
              <MoreHorizontal size={16} />
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side={mode === 'sidebar' ? 'right' : 'bottom'}
          align='end'
          className={mode === 'card' ? 'min-w-[220px]' : 'w-full'}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          {canEditAssistant && (
            <DropdownMenuItem
              onSelect={(event) => {
                event.stopPropagation();
                handleEditAssistant();
              }}
              className='cursor-pointer'
            >
              <Pencil className='h-4 w-4' />
              <span className='flex items-center gap-1 text-sm font-normal leading-5 tracking-normal'>
                {t(i18n.common.assistant_dropdown.edit)}
                {showMasterChip && <MasterChip size='xs' />}
              </span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onSelect={(event) => {
              event.stopPropagation();
              handleFixLeftMenu();
            }}
            className='cursor-pointer'
          >
            {isFixedInSidebar ? (
              <>
                <PinOff className='h-4 w-4' />
                <span className='text-sm font-normal leading-5 tracking-normal'>
                  {t(i18n.common.assistant_dropdown.unpin)}
                </span>
              </>
            ) : (
              <>
                <Pin className='h-4 w-4' />
                <span className='text-sm font-normal leading-5 tracking-normal'>
                  {t(i18n.common.assistant_dropdown.pin)}
                </span>
              </>
            )}
          </DropdownMenuItem>
          {showShareButton && (
            <DropdownMenuItem
              onSelect={(event) => {
                event.stopPropagation();
                handleOpenShareDialog();
              }}
              className='cursor-pointer'
            >
              <Share className='h-4 w-4' />
              <span className='text-sm font-normal leading-5 tracking-normal'>
                {t(i18n.common.assistant_dropdown.share)}
              </span>
            </DropdownMenuItem>
          )}
          {isAdmin && (
            <DropdownMenuItem
              onSelect={(event) => {
                event.stopPropagation();
                handleDeleteAssistant();
              }}
              className='cursor-pointer'
            >
              <Trash2 className='text-destructive h-4 w-4' />
              <span className='text-destructive text-sm font-normal leading-5 tracking-normal'>
                {t(i18n.common.assistant_dropdown.delete)}
              </span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {isOpenAssistantDeletedDialog && (
        <DeleteConfirmDialog
          open={isOpenAssistantDeletedDialog}
          onOpenChange={setIsOpenAssistantDeletedDialog}
          onConfirm={handleDeleteConfirm}
          isAdmin={isAdmin}
        />
      )}
      {isOpenAssistantShareDialog && (
        <ShareDialog
          isOpen={isOpenAssistantShareDialog}
          onClose={() => setIsOpenAssistantShareDialog(false)}
          resourceType={ResourceType.ASSISTANT}
          resourceId={assistant.id}
          resourceMeta={undefined}
          title={assistant.name}
          assistantType={assistant.type}
          isOwner={isAdmin}
          onShareUpdate={(scope, targetCount) => {
            onShareUpdate?.({ scope, targetCount });
          }}
        />
      )}
    </div>
  );
}
