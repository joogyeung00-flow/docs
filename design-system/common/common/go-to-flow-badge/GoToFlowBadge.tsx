'use client';

import { useDeviceContext } from '@/hooks/useDeviceContext';
import { env } from '@/lib/env';
import { getAssetPath } from '@/lib/utils/asset-utils';
import { isFlowAIApp } from '@/lib/utils/device-utils';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';

interface GoToFlowBadgeProps {
  className?: string;
}

/**
 * Electron 데스크탑 앱 환경에서만 표시되는 "플로우로 이동하기" 배지
 * WebView의 "플로우로 돌아가기" 버튼과 동일한 스타일
 */
export function GoToFlowBadge({ className = '' }: GoToFlowBadgeProps) {
  const { isElectron } = useDeviceContext();

  if (!isElectron || isFlowAIApp()) return null;

  const handleClick = () => {
    const flowDomain = env.NEXT_PUBLIC_FLOWAI_DOMAIN;
    window.location.replace(`${flowDomain}/main.act`);
  };

  return (
    <button
      type='button'
      onClick={handleClick}
      className={`flex h-7 cursor-pointer items-center gap-1.5 rounded-full border border-[#9F00BA] bg-[#F9E8FC] px-3 py-1.5 transition-opacity hover:opacity-80 ${className}`}
    >
      <ArrowLeft className='h-4 w-4 text-[#9F00BA]' />
      <Image
        src={getAssetPath('/logo/flow-logo.png')}
        alt='flow logo'
        width={16}
        height={16}
        className='h-4 w-4 object-contain'
      />
      <span className='text-sm font-medium text-[#9F00BA]'>플로우로 이동하기</span>
    </button>
  );
}

export default GoToFlowBadge;
