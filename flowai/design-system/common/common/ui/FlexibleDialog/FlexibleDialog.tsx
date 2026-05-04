'use client';

import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { ArrowLeft, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Z_INDEX } from '@/constants/z-index';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  FlowBottomSheet,
  FlowBottomSheetHeader,
  FlowBottomSheetContent,
  FlowBottomSheetFooter,
} from '@/components/common/ui/FlowBottomSheet';
import { FLEXIBLE_WIDTH } from './types';
import type { FlexibleDialogProps, FlexibleDialogContextValue } from './types';

// ============================================================================
// Context
// ============================================================================

const FlexibleDialogContext = createContext<FlexibleDialogContextValue | null>(null);

export function useFlexibleDialogContext() {
  const context = useContext(FlexibleDialogContext);
  if (!context) {
    throw new Error('FlexibleDialog 컴포넌트 내부에서만 사용할 수 있습니다.');
  }
  return context;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_NARROW_MESSAGE = 'PC 환경에서 이용해주세요';

const Z_INDEX_MAP = {
  1: Z_INDEX.DIALOG_OVERLAY,
  2: Z_INDEX.NESTED_DIALOG_OVERLAY,
  3: Z_INDEX.CONFIRM_DIALOG_OVERLAY,
} as const;

// ============================================================================
// Component
// ============================================================================

export function FlexibleDialog({
  open,
  onOpenChange,
  mode = 'flexible',
  webViewMode,
  width = 'standard',
  padding = 'md',
  scroll = 'none',
  closeButton = false,
  zLevel = 1,
  height,
  maxHeight = '85vh',
  bottomSheetHeight,
  bottomSheetMaxHeight = 95,
  narrowScreenMessage,
  title,
  headerLeftAction,
  headerRightAction,
  showHeaderCloseButton,
  headerClassName,
  contentClassName,
  footer,
  footerClassName,
  className,
  overlayClassName,
  children,
}: FlexibleDialogProps) {
  const isMobile = useIsMobile();
  const toastShownRef = useRef(false);
  const onClose = () => onOpenChange(false);

  // only-wide 모드에서 좁은 화면이면 토스트 안내
  useEffect(() => {
    if (mode === 'only-wide' && isMobile && open) {
      if (!toastShownRef.current) {
        toast.info(narrowScreenMessage ?? DEFAULT_NARROW_MESSAGE);
        toastShownRef.current = true;
      }
      onOpenChange(false);
    }
    if (!open) {
      toastShownRef.current = false;
    }
  }, [mode, isMobile, open, narrowScreenMessage, onOpenChange]);

  const shouldRenderFullscreen = mode === 'flexible' && isMobile && webViewMode === 'fullscreen';
  const shouldRenderBottomSheet = mode === 'flexible' && isMobile && !shouldRenderFullscreen;

  const contextValue = useMemo<FlexibleDialogContextValue>(
    () => ({
      renderMode: shouldRenderFullscreen ? 'fullscreen' : shouldRenderBottomSheet ? 'bottom-sheet' : 'dialog',
      onClose,
      zLevel,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shouldRenderFullscreen, shouldRenderBottomSheet, onOpenChange, zLevel],
  );

  const hasHeader = title !== undefined;
  const shouldShowCloseButton = showHeaderCloseButton ?? hasHeader;

  // only-wide + 모바일이면 렌더링하지 않음
  if (mode === 'only-wide' && isMobile) return null;

  // Fullscreen 렌더링 (웹뷰 전체화면)
  if (shouldRenderFullscreen && open) {
    return createPortal(
      <FlexibleDialogContext.Provider value={contextValue}>
        <div className='fixed inset-0 z-[9999] flex flex-col bg-white'>
          {/* 헤더 — AppHeader 모바일과 동일한 레이아웃 */}
          {hasHeader && (
            <header className='relative flex h-[48px] w-full shrink-0 items-center border-b border-gray-100 p-2'>
              {headerLeftAction ?? (
                <button
                  onClick={onClose}
                  className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-gray-100'
                  aria-label='닫기'
                >
                  <ArrowLeft className='h-5 w-5' />
                </button>
              )}
              {title && (
                <div className='mx-2 flex min-w-0 flex-1 items-center'>
                  <h2 className='truncate text-lg font-bold'>{title}</h2>
                </div>
              )}
              {headerRightAction ? (
                headerRightAction
              ) : shouldShowCloseButton && headerLeftAction ? (
                <button
                  onClick={onClose}
                  className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-gray-100'
                  aria-label='닫기'
                >
                  <X className='h-4 w-4' />
                </button>
              ) : (
                <div className='w-8 shrink-0' />
              )}
            </header>
          )}

          {/* 본문 */}
          <div
            className={cn(
              'flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-hidden px-4 pt-4',
              contentClassName,
            )}
          >
            {children}
          </div>

          {/* 푸터 */}
          {footer && (
            <div className={cn('shrink-0 px-4 pb-[max(env(safe-area-inset-bottom),24px)]', footerClassName)}>
              {footer}
            </div>
          )}
        </div>
      </FlexibleDialogContext.Provider>,
      document.body,
    );
  }

  // BottomSheet 렌더링
  if (shouldRenderBottomSheet) {
    return (
      <FlexibleDialogContext.Provider value={contextValue}>
        <FlowBottomSheet
          open={open}
          onOpenChange={onOpenChange}
          height={bottomSheetHeight}
          maxHeight={bottomSheetMaxHeight}
          zLevel={zLevel}
        >
          {hasHeader && (
            <FlowBottomSheetHeader
              title={title}
              showCloseButton={shouldShowCloseButton}
              leftAction={headerLeftAction}
              rightAction={headerRightAction}
              className={headerClassName}
            />
          )}
          <FlowBottomSheetContent className={contentClassName}>{children}</FlowBottomSheetContent>
          {footer && (
            <FlowBottomSheetFooter className={cn('flex gap-2 pb-4', footerClassName)}>{footer}</FlowBottomSheetFooter>
          )}
        </FlowBottomSheet>
      </FlexibleDialogContext.Provider>
    );
  }

  // Dialog 렌더링
  const widthClass = FLEXIBLE_WIDTH[width];
  const zIndex = Z_INDEX_MAP[zLevel];

  return (
    <FlexibleDialogContext.Provider value={contextValue}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          closeButton={closeButton}
          padding={padding}
          height={height}
          maxHeight={maxHeight}
          scroll={scroll}
          overlayClassName={overlayClassName}
          zIndex={zIndex}
          className={cn('w-[calc(100%-32px)] sm:w-full', widthClass, className)}
        >
          {hasHeader && (
            <DialogHeader className={cn('flex flex-row items-center justify-between gap-4 space-y-0', headerClassName)}>
              <div className='flex items-center gap-2'>
                {headerLeftAction}
                {title && (
                  <DialogTitle className='text-lg font-semibold leading-none tracking-tight'>{title}</DialogTitle>
                )}
              </div>
              {headerRightAction ? (
                headerRightAction
              ) : shouldShowCloseButton ? (
                <button
                  onClick={onClose}
                  className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200'
                  aria-label='닫기'
                >
                  <X className='h-4 w-4 text-gray-600' />
                </button>
              ) : null}
            </DialogHeader>
          )}
          <div className={cn('flex min-h-0 flex-1 flex-col overflow-hidden', contentClassName)}>{children}</div>
          {footer && <DialogFooter className={cn(footerClassName)}>{footer}</DialogFooter>}
        </DialogContent>
      </Dialog>
    </FlexibleDialogContext.Provider>
  );
}
