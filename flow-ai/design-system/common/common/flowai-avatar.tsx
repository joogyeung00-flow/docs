import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAssetPath } from '@/lib/utils/asset-utils';

interface FlowAIAvatarProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export function FlowAIAvatar({ className, size = 'medium' }: FlowAIAvatarProps) {
  return (
    <Avatar
      className={`rounded-none ${size === 'small' ? 'h-4 w-4' : size === 'medium' ? 'h-6 w-6' : 'h-8 w-8'} ${className}`}
    >
      <AvatarImage src={getAssetPath('/logo/flow-logo.png')} alt='Avatar' />
      <AvatarFallback>X</AvatarFallback>
    </Avatar>
  );
}
