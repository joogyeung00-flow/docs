'use client';

import { ReactNode } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, LucideIcon } from 'lucide-react';

interface CompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  icon?: LucideIcon;
  confirmText?: string;
  /** z-index 오버라이드 (overlay: zIndex, content: zIndex + 1) */
  zIndex?: number;
  /** overlay 추가 클래스 */
  overlayClassName?: string;
}

/**
 * CompletionDialog - 완료/결과 안내용 공통 다이얼로그
 *
 * @example
 * ```tsx
 * <CompletionDialog
 *   open={open}
 *   onOpenChange={onOpenChange}
 *   title="업그레이드 신청 완료"
 *   description="내부 확인 후 처리됩니다."
 * />
 * ```
 */
export function CompletionDialog({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon = CheckCircle,
  confirmText = '확인',
  zIndex,
  overlayClassName,
}: CompletionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent
        className='inline-flex max-w-[512px] flex-col items-start justify-start gap-7 p-6'
        closeButton={false}
        zIndex={zIndex}
        overlayClassName={overlayClassName}
      >
        <div className='flex flex-col items-center justify-center gap-4 self-stretch'>
          <div className='bg-secondary inline-flex h-12 w-12 items-center justify-center gap-2.5 rounded-[50px]'>
            <Icon className='text-primary h-6 w-6' />
          </div>
          <DialogTitle className='text-foreground text-lg font-semibold leading-7'>{title}</DialogTitle>
          <div className='text-muted-foreground text-center text-sm font-normal leading-5'>{description}</div>
        </div>
        <div className='flex flex-col items-end justify-center gap-3 self-stretch'>
          <Button onClick={() => onOpenChange(false)} className='h-12 self-stretch'>
            {confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
