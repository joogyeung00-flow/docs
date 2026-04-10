import { getAssetPath } from '@/lib/utils/asset-utils';
import Image from 'next/image';
import React from 'react';

interface EmptyContentProps {
  /** 메인 타이틀 */
  title: string;
  /** 서브 설명 텍스트 */
  subtitle?: string;
  /** 액션 버튼 텍스트 */
  actionLabel?: string;
  /** 액션 버튼 클릭 핸들러 */
  onAction?: () => void;
}

/**
 * 리스트가 비어있을 때 표시하는 공통 빈 콘텐츠 컴포넌트
 *
 * flowai-empty.png 일러스트 + 타이틀 + 서브텍스트 + 액션 버튼
 */
export const EmptyContent = React.memo(function EmptyContent({
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyContentProps) {
  return (
    <div className='flex size-full flex-col items-center justify-center py-12'>
      <div className='relative mb-6 h-40 w-40'>
        <Image src={getAssetPath('/assets/png/flowai-empty.png')} alt={title} fill className='object-contain' />
      </div>

      <p className='mb-1 text-center text-base font-bold text-[#333]'>{title}</p>

      {subtitle && <p className='mb-0 text-center text-sm text-[#777]'>{subtitle}</p>}

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className='mt-5 rounded-md bg-[#5b40f8] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4c35d4]'
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
});
