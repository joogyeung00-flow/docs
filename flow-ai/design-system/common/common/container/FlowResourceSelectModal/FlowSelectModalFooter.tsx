'use client';

import { Button } from '@/components/ui/button';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { cn } from '@/lib/utils';
import { i18n } from '@flowai/i18n';
import { memo } from 'react';

interface FlowSelectModalFooterProps {
  onCancel: () => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

/**
 * 모달 푸터 (선택 개수 / 취소/확인 버튼)
 */
export const FlowSelectModalFooter = memo(function FlowSelectModalFooter({
  onCancel,
  onConfirm,
  confirmDisabled = false,
  isLoading = false,
  className,
}: FlowSelectModalFooterProps) {
  const { t } = useAppTranslation('common');
  return (
    <div className={cn('flex items-center justify-end border-t px-6 py-4', className)}>
      <div className='flex items-center gap-3'>
        <Button variant='outline' onClick={onCancel} disabled={isLoading}>
          {t(i18n.common.alert_dialog.cancel)}
        </Button>
        <Button onClick={onConfirm} disabled={confirmDisabled || isLoading}>
          {isLoading ? t(i18n.common.ui.processing) : t(i18n.common.alert_dialog.confirm)}
        </Button>
      </div>
    </div>
  );
});
