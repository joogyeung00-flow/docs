'use client';

import { ChatbotColorIcon, ConverterColorIcon, ProjectConsultantColorIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { getAssetPath } from '@/lib/utils/asset-utils';
import { ResourceType } from '@flowai/shared';
import Image from 'next/image';
import { useState } from 'react';

const SIZE_MAP = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 36,
  xxl: 48,
} as const;

type SizeKey = keyof typeof SIZE_MAP;

interface AvatarProfileProps {
  /** 프로필 이미지 URL */
  profileImageUrl?: string | null;
  /** 이름 (이미지 없을 때 이니셜용) */
  name: string;
  /** 퀵액세스 타입 (이미지 없을 때 타입 아이콘용) */
  type?: ResourceType;
  /** 크기: 'sm'=16, 'md'=24, 'lg'=32, 또는 숫자 */
  size?: SizeKey | number;
  /** 이미지 없을 때 이니셜 표시 여부 (false면 타입 아이콘) */
  showInitial?: boolean;
  /** 둥근 모서리 스타일 */
  rounded?: boolean;
  /** 테두리 표시 여부 */
  bordered?: boolean;
  /** 퀵액세스 관련 ID */
  relationId?: string;
  className?: string;
}

/**
 * 범용 아바타 프로필 컴포넌트
 * - 프로필 이미지가 있으면 이미지 표시
 * - 없으면 이니셜 또는 타입별 컬러 아이콘 표시
 */
export default function AvatarProfile({
  profileImageUrl,
  name,
  type,
  size = 'md',
  showInitial = false,
  rounded = true,
  className,
  relationId,
}: AvatarProfileProps) {
  const sizeValue = typeof size === 'number' ? size : SIZE_MAP[size];
  const [imageError, setImageError] = useState(false);

  // 프로필 이미지가 있고 로드 에러가 없는 경우
  if (profileImageUrl && !imageError) {
    return (
      <Image
        src={getAssetPath(profileImageUrl)}
        alt={name}
        width={sizeValue}
        height={sizeValue}
        sizes={`${sizeValue}px`} // 고정 크기로 최적화
        quality={70} // 아바타용 품질 최적화
        className={cn(
          'object-cover',
          `w-[${sizeValue}px] h-[${sizeValue}px]`, // width, height 클래스 추가
          rounded && 'rounded-full',
          'border',
          className,
        )}
        style={{
          borderWidth: '0.5px', // 0.5px로 매우 얇은 보더
        }}
        onError={() => setImageError(true)}
      />
    );
  }

  // 이니셜 표시
  if (showInitial) {
    const fontSize = Math.max(8, Math.floor(sizeValue * 0.5));
    //bg-[#FFF0DB]
    return (
      <span
        className={cn(
          'text-foreground flex items-center justify-center bg-gray-200 uppercase',
          rounded && 'rounded-full',
          'border',
          className,
        )}
        style={{ minWidth: sizeValue, width: sizeValue, height: sizeValue, fontSize, borderWidth: '0.5px' }}
      >
        {name.charAt(0) || '?'}
      </span>
    );
  }

  // 타입별 컬러 아이콘
  return <TypeColorIcon type={type} relationId={relationId} size={sizeValue} className={className} />;
}

/** 타입별 컬러 아이콘 */
function TypeColorIcon({
  type,
  relationId,
  size,
  className,
}: {
  type?: ResourceType;
  relationId?: string;
  size: number;
  className?: string;
}) {
  switch (type) {
    case 'ASSISTANT':
      return <ChatbotColorIcon size={size} className={className} />;
    case 'AGENT':
      if (relationId === 'ai-consultant') {
        return <ProjectConsultantColorIcon size={size} className={className} />;
      } else if (relationId === 'ai-converter') {
        return <ConverterColorIcon size={size} className={className} />;
      } else {
        return <ChatbotColorIcon size={size} className={className} />;
      }
    default:
      return <ChatbotColorIcon size={size} className={className} />;
  }
}
