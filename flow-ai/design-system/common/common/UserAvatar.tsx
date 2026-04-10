import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAssetPath } from '@/lib/utils/asset-utils';
import { ThirdPartyUserInfo } from '@flowai/shared';
import { useState } from 'react';

interface UserAvatarProps {
  username?: string;
  thirdPartyInfo?: ThirdPartyUserInfo;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export function UserAvatar({ username, thirdPartyInfo, className, size = 'medium' }: UserAvatarProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-6 w-6',
    large: 'h-8 w-8',
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const displayName = username || thirdPartyInfo?.thirdPartyUserName;
  const profileUrl = thirdPartyInfo?.thirdPartyUserProfileUrl;

  return (
    <Avatar className={`${sizeClasses[size]} shadow-md ${className}`}>
      {!imageLoaded && !imageError && (
        <AvatarImage
          src={getAssetPath('/assets/png/default-profile.png')}
          alt='Default profile'
          className='object-cover'
        />
      )}

      {profileUrl && !imageError && (
        <AvatarImage
          src={profileUrl}
          alt={displayName}
          className='object-cover'
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}

      <AvatarFallback className='bg-shadcn-ui-app-primary text-xs text-white' delayMs={1000}>
        {displayName?.charAt(0).toUpperCase() || 'U'}
      </AvatarFallback>
    </Avatar>
  );
}
