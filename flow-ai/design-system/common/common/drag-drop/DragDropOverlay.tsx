'use client';

import React from 'react';
import Image from 'next/image';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { getAssetPath } from '@/lib/utils/asset-utils';
import { i18n } from '@flowai/i18n';

interface DragDropOverlayProps {
  isVisible: boolean;
  isDragActive: boolean;
}

export const DragDropOverlay: React.FC<DragDropOverlayProps> = ({ isVisible, isDragActive }) => {
  const { t } = useAppTranslation('common');
  if (!isVisible) return null;

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md'
      style={{ pointerEvents: 'none' }}
    >
      <Image
        src={getAssetPath('/assets/png/draganddrop.png')}
        alt={t(i18n.common.drag_drop.alt_upload)}
        width={300}
        height={200}
        className='object-contain'
        priority
      />
    </div>
  );
};
