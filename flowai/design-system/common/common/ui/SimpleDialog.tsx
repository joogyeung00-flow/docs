'use client';

import { formatNumber } from '@flowai/shared';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { cn } from '@/lib/utils';
import { i18n } from '@flowai/i18n';
import { ReactNode, useEffect, useState } from 'react';

export type SimpleDialogType = 'info' | 'alert' | 'confirm' | 'prompt';

export interface SimpleDialogConfig {
  /** 다이얼로그 타입 */
  type: SimpleDialogType;
  /** 제목 */
  title: ReactNode;
  /** 설명 (선택) */
  description?: ReactNode;
  /** 확인 버튼 텍스트 (기본: '확인') */
  confirmText?: string;
  /** 취소 버튼 텍스트 (기본: '취소') */
  cancelText?: string;
  /** 확인 버튼 variant (기본: 'default') */
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  /** prompt 타입일 때 기본값 */
  defaultValue?: string;
  /** prompt 타입일 때 placeholder */
  placeholder?: string;
  /** prompt 타입일 때 최대 글자 수 */
  maxLength?: number;
}

interface SimpleDialogProps {
  config: SimpleDialogConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** alert: void, confirm: boolean, prompt: string | null. Promise 반환 시 로딩 상태 자동 처리 */
  onResult: (result: boolean | string | null) => void | Promise<void>;
  /** 외부에서 로딩 상태 제어 (선택) */
  loading?: boolean;
  className?: string;
  /** DialogOverlay에 적용할 클래스 */
  overlayClassName?: string;
  /** z-index 오버라이드 (overlay: zIndex, content: zIndex + 1) */
  zIndex?: number;
}

/**
 * SimpleDialog - Alert, Confirm, Prompt를 하나로 처리하는 범용 다이얼로그
 *
 * @description
 * 간단한 사용자 상호작용을 위한 다이얼로그 컴포넌트입니다.
 * - Info: 정보 표시 (X 버튼으로만 닫기, 하단 버튼 없음)
 * - Alert: 단순 알림 (확인 버튼만)
 * - Confirm: 확인/취소 선택
 * - Prompt: 텍스트 입력 + 확인/취소
 *
 * @example
 * ```tsx
 * // Alert
 * <SimpleDialog
 *   config={{
 *     type: 'alert',
 *     title: '알림',
 *     description: '작업이 완료되었습니다.',
 *   }}
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onResult={() => {}}
 * />
 *
 * // Confirm
 * <SimpleDialog
 *   config={{
 *     type: 'confirm',
 *     title: '삭제 확인',
 *     description: '정말 삭제하시겠습니까?',
 *     confirmText: '삭제',
 *     confirmVariant: 'destructive',
 *   }}
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onResult={(confirmed) => {
 *     if (confirmed) handleDelete();
 *   }}
 * />
 *
 * // Prompt
 * <SimpleDialog
 *   config={{
 *     type: 'prompt',
 *     title: '이름 변경',
 *     description: '새 이름을 입력하세요',
 *     defaultValue: currentName,
 *     maxLength: 100,
 *   }}
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onResult={(value) => {
 *     if (value) handleRename(value);
 *   }}
 * />
 * ```
 */
export function SimpleDialog({
  config,
  open,
  onOpenChange,
  onResult,
  loading: externalLoading,
  className,
  overlayClassName,
  zIndex,
}: SimpleDialogProps) {
  const { t } = useAppTranslation('common');

  const defaultConfirmText = t(i18n.common.alert_dialog.confirm);
  const defaultCancelText = t(i18n.common.alert_dialog.cancel);

  const { type, title, description, confirmVariant = 'default', defaultValue = '', placeholder, maxLength } = config;

  const confirmText = config.confirmText ?? defaultConfirmText;
  const cancelText = config.cancelText ?? defaultCancelText;

  const [inputValue, setInputValue] = useState(defaultValue);
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = externalLoading ?? internalLoading;
  const isOverLimit = maxLength ? inputValue.length > maxLength : false;

  // 다이얼로그가 열릴 때 기본값으로 초기화
  useEffect(() => {
    if (open && type === 'prompt') {
      setInputValue(defaultValue);
    }
  }, [open, defaultValue, type]);

  const handleConfirm = async () => {
    if (isLoading) return;
    if (type === 'prompt' && isOverLimit) return;

    let result: boolean | string | null = null;

    if (type === 'alert') {
      result = true;
    } else if (type === 'confirm') {
      result = true;
    } else if (type === 'prompt') {
      const trimmed = inputValue.trim();
      if (!trimmed) return; // prompt는 빈 값이면 닫지 않음
      result = trimmed;
    }

    try {
      setInternalLoading(true);
      await onResult(result);
      onOpenChange(false);
    } finally {
      setInternalLoading(false);
    }
  };

  const handleCancel = () => {
    if (isLoading) return;

    if (type === 'confirm') {
      onResult(false);
    } else if (type === 'prompt') {
      onResult(null);
    }
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const showCancelButton = type === 'confirm' || type === 'prompt';
  const showButtons = type !== 'info';

  return (
    <Dialog open={open} onOpenChange={(value) => !value && (type === 'info' ? onOpenChange(false) : handleCancel())}>
      <DialogContent
        padding='none'
        closeButton={type === 'info'}
        className={cn('w-[342px] gap-0 rounded-md p-6', className)}
        overlayClassName={overlayClassName}
        zIndex={zIndex}
      >
        <div className='flex flex-col gap-4'>
          {/* Header */}
          <div className='flex flex-col gap-2'>
            <DialogTitle className='text-foreground text-left text-lg font-semibold'>{title}</DialogTitle>
            {description && (
              <DialogDescription asChild>
                <div className='text-muted-foreground text-left text-sm'>{description}</div>
              </DialogDescription>
            )}
          </div>

          {/* Input (prompt only) */}
          {type === 'prompt' && (
            <div className='flex flex-col gap-2'>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                autoFocus
                className={cn('w-full', isOverLimit && 'border-red-300 text-red-900')}
              />
              {maxLength && (
                <div className={cn('text-right text-xs', isOverLimit ? 'text-red-500' : 'text-slate-500')}>
                  {formatNumber(inputValue.length)}/{formatNumber(maxLength)}
                </div>
              )}
            </div>
          )}

          {/* Buttons (info 타입은 버튼 없음) */}
          {showButtons && (
            <div className={cn('flex gap-3', showCancelButton ? 'flex-row' : 'flex-col')}>
              {showCancelButton && (
                <Button onClick={handleCancel} variant='outline' className='w-full' size='default' disabled={isLoading}>
                  {cancelText}
                </Button>
              )}
              <Button
                onClick={handleConfirm}
                variant={confirmVariant}
                className='w-full'
                size='default'
                autoFocus={type !== 'prompt'}
                disabled={isLoading || (type === 'prompt' && isOverLimit)}
              >
                {confirmText}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
