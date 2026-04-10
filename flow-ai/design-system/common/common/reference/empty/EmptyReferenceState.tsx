'use client';

import { useAppTranslation } from '@/hooks/useAppTranslation';
import { i18n } from '@flowai/i18n';
import React from 'react';

/**
 * Reference가 없을 때 표시하는 빈 상태 컴포넌트
 */
export const EmptyReferenceState = React.memo(function EmptyReferenceState() {
  const { t } = useAppTranslation('common');
  return (
    <div className='flex flex-col items-center justify-center py-16 text-center'>
      <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50'>
        <svg className='h-8 w-8 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1.5}
            d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
          />
        </svg>
      </div>
      <div className='text-lg font-medium text-gray-900'>{t(i18n.common.reference.empty_title)}</div>
      <div className='text-sm text-gray-500'>{t(i18n.common.reference.empty_description)}</div>
    </div>
  );
});

EmptyReferenceState.displayName = 'EmptyReferenceState';
