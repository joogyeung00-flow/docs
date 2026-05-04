'use client';

import { Z_INDEX } from '@/constants/z-index';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { createContext, ReactNode, useContext } from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';

// ============================================================================
// Types
// ============================================================================

export interface FlowBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;

  /**
   * 고정 높이 (dvh 단위). 지정하면 시트가 항상 이 높이로 열림.
   * 미지정(기본)이면 콘텐츠 크기에 맞춰지고 maxHeight에서 멈춤.
   *
   * @example
   * // 전체 화면 고정 — 코드 프리뷰, 레퍼런스 리스트
   * <FlowBottomSheet open={open} onOpenChange={setOpen} height={95}>
   */
  height?: number;

  /**
   * 시트의 최대 높이 (dvh 단위, 기본: 95).
   * height 미지정(fitContent 모드)일 때만 적용.
   *
   * @example
   * // 짧은 메뉴 — 콘텐츠에 맞추되 70dvh 이하
   * <FlowBottomSheet open={open} onOpenChange={setOpen} maxHeight={70}>
   */
  maxHeight?: number;

  /** z-index 레벨. 중첩 다이얼로그 위에 띄울 때 올려서 사용. */
  zLevel?: 1 | 2 | 3;

  /** Drawer.Content에 적용할 추가 클래스 */
  className?: string;

  /** Overlay에 적용할 추가 클래스 */
  overlayClassName?: string;

  /** 키보드가 올라올 때 input 위치를 재조정할지 여부 (기본: true) */
  repositionInputs?: boolean;
}

export interface FlowBottomSheetHeaderProps {
  title?: ReactNode;
  /** 기본: true. false면 닫기 버튼 숨김. rightAction이 있으면 자동으로 대체됨. */
  showCloseButton?: boolean;
  className?: string;
  leftAction?: ReactNode;
  /** 우측 영역. 지정하면 닫기 버튼 대신 표시. */
  rightAction?: ReactNode;
}

export interface FlowBottomSheetContentProps {
  children: ReactNode;
  /** 기본: overflow-y-auto + pb-8. 필요시 오버라이드. */
  className?: string;
}

export interface FlowBottomSheetFooterProps {
  children: ReactNode;
  className?: string;
}

// ============================================================================
// Context
// ============================================================================

interface FlowBottomSheetContextValue {
  onClose: () => void;
}

const FlowBottomSheetContext = createContext<FlowBottomSheetContextValue | null>(null);

export const useFlowBottomSheet = () => {
  const ctx = useContext(FlowBottomSheetContext);
  if (!ctx) throw new Error('FlowBottomSheet 내부에서만 사용할 수 있습니다.');
  return ctx;
};

// ============================================================================
// z-index
// ============================================================================

const OVERLAY_Z: Record<1 | 2 | 3, number> = {
  1: Z_INDEX.DIALOG_OVERLAY,
  2: Z_INDEX.NESTED_DIALOG_OVERLAY,
  3: Z_INDEX.CONFIRM_DIALOG_OVERLAY,
};

const CONTENT_Z: Record<1 | 2 | 3, number> = {
  1: Z_INDEX.DIALOG_CONTENT,
  2: Z_INDEX.NESTED_DIALOG_CONTENT,
  3: Z_INDEX.CONFIRM_DIALOG_CONTENT,
};

// ============================================================================
// FlowBottomSheet
// ============================================================================

/**
 * Vaul(shadcn Drawer) 기반 모바일 바텀시트.
 *
 * 구조: `FlowBottomSheet` > `FlowBottomSheetHeader` + `FlowBottomSheetContent` + `FlowBottomSheetFooter`
 *
 * 드래그, 스냅, 스크롤↔드래그 경계 처리는 Vaul이 자동으로 해줌.
 * 스타일은 className / overlayClassName으로 외부에서 오버라이드 가능.
 */
export function FlowBottomSheet({
  open,
  onOpenChange,
  children,
  height,
  maxHeight = 95,
  zLevel = 1,
  className,
  overlayClassName,
  repositionInputs,
}: FlowBottomSheetProps) {
  const onClose = () => onOpenChange(false);

  return (
    <FlowBottomSheetContext.Provider value={{ onClose }}>
      <DrawerPrimitive.Root open={open} onOpenChange={onOpenChange} repositionInputs={repositionInputs}>
        <DrawerPrimitive.Portal>
          <DrawerPrimitive.Overlay
            className={cn('fixed inset-0 bg-black/50', overlayClassName)}
            style={{ zIndex: OVERLAY_Z[zLevel] }}
          />
          <DrawerPrimitive.Content
            className={cn(
              'fixed inset-x-0 bottom-0 flex flex-col rounded-t-2xl bg-white shadow-2xl outline-none',
              className,
            )}
            style={{
              zIndex: CONTENT_Z[zLevel],
              ...(height ? { height: `${height}dvh` } : { maxHeight: `${maxHeight}dvh` }),
            }}
          >
            <DrawerPrimitive.Title className='sr-only'>Sheet</DrawerPrimitive.Title>
            <DrawerPrimitive.Description className='sr-only'>Sheet content</DrawerPrimitive.Description>
            <DrawerPrimitive.Handle className='mx-auto mb-1 mt-3 h-1 w-9 rounded-full bg-gray-300' />
            {children}
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Portal>
      </DrawerPrimitive.Root>
    </FlowBottomSheetContext.Provider>
  );
}

// ============================================================================
// FlowBottomSheetHeader
// ============================================================================

/**
 * 바텀시트 헤더. 48px 고정 높이.
 * title 가운데, 좌측 leftAction, 우측 닫기 버튼(또는 rightAction).
 */
export function FlowBottomSheetHeader({
  title,
  showCloseButton = true,
  className,
  leftAction,
  rightAction,
}: FlowBottomSheetHeaderProps) {
  const { onClose } = useFlowBottomSheet();

  return (
    <div className={cn('flex h-12 shrink-0 items-center gap-2 px-4', className)}>
      <div className='min-w-0 flex-1 items-center gap-2 truncate'>
        <div className='flex shrink-0 items-center'>{leftAction}</div>
        {title && <span className='min-w-0 flex-1 truncate text-base font-semibold text-gray-900'>{title}</span>}
      </div>
      <div className='flex shrink-0 items-center'>
        {rightAction ??
          (showCloseButton && (
            <button
              onClick={onClose}
              className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200'
              aria-label='닫기'
            >
              <X className='h-4 w-4 text-gray-600' />
            </button>
          ))}
      </div>
    </div>
  );
}

// ============================================================================
// FlowBottomSheetContent
// ============================================================================

/**
 * 스크롤 가능한 콘텐츠 영역.
 * flex-1로 남은 공간을 채우고, 넘치면 overflow-y-auto.
 * 기본 pb-8 하단 여백 (터치 영역 확보).
 */
export function FlowBottomSheetContent({ children, className }: FlowBottomSheetContentProps) {
  return <div className={cn('flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-8', className)}>{children}</div>;
}

// ============================================================================
// FlowBottomSheetFooter
// ============================================================================

/** 하단 고정 영역. 상단 border 포함. 버튼 등 액션 배치용. */
export function FlowBottomSheetFooter({ children, className }: FlowBottomSheetFooterProps) {
  return <div className={cn('shrink-0 border-t border-gray-100 px-4 py-3', className)}>{children}</div>;
}
