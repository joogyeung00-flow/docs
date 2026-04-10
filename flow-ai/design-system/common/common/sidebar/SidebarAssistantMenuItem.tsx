import AvatarProfile from '@/components/common/AvatarProfile';
import AssistantDropdown from '@/components/common/dropdown/AssistantDropdown';
import { SidebarMenuAction, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useAssistantStore } from '@/stores/assistant.store';
import { AccessRole, AssistantWithUserLinkResponse, ResourceType } from '@flowai/shared';
import { useRouter } from 'next/navigation';

interface SidebarAssistantMenuItemProps {
  assistantQuickAccess: AssistantWithUserLinkResponse;
  className?: string;
  buttonClassName?: string;
  onItemClick?: () => void;
}

export default function SidebarAssistantMenuItem({
  assistantQuickAccess,
  buttonClassName,
  onItemClick,
}: SidebarAssistantMenuItemProps) {
  const router = useRouter();
  const updateAssistant = useAssistantStore((s) => s.updateAssistant);

  return (
    <SidebarMenuItem className={`ml-1 flex !h-10 items-center justify-start`}>
      <SidebarMenuButton
        className={`${buttonClassName} !h-10 !pr-2 group-hover/menu-item:!pr-6 group-has-[[data-state=open]]/menu-item:!pr-6`}
        onClick={() => {
          router.push(`/assistant/${assistantQuickAccess.assistant.id}`);
          onItemClick?.();
        }}
        tooltip={assistantQuickAccess.assistant.name}
      >
        <AvatarProfile
          profileImageUrl={assistantQuickAccess.assistant.profileImageUrl}
          name={assistantQuickAccess.assistant.name}
          type={ResourceType.ASSISTANT}
          size='sm'
          showInitial
          bordered
          className='scale-125'
        />

        <span className='truncate text-sm'>{assistantQuickAccess.assistant.name}</span>
      </SidebarMenuButton>

      <SidebarMenuAction showOnHover asChild>
        <AssistantDropdown
          mode='sidebar'
          assistant={assistantQuickAccess.assistant}
          isAdmin={
            assistantQuickAccess.userLink.authType === AccessRole.CREATOR ||
            assistantQuickAccess.userLink.authType === AccessRole.ADMIN
          }
          onShareUpdate={(shareInfo) => updateAssistant(assistantQuickAccess.assistant.id, { shareInfo })}
        />
      </SidebarMenuAction>
    </SidebarMenuItem>
  );
}
