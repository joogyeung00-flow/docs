import type { ReactNode } from 'react';

// ============================================================================
// Width 프리셋
// ============================================================================

export const FLEXIBLE_WIDTH = {
  compact: 'sm:max-w-[400px]',
  standard: 'sm:max-w-[600px]',
  wide: 'sm:max-w-[800px]',
  'extra-wide': 'sm:max-w-[1000px]',
  full: 'sm:max-w-[95vw]',
} as const;

export type FlexibleDialogWidth = keyof typeof FLEXIBLE_WIDTH;

// ============================================================================
// Props
// ============================================================================

export interface FlexibleDialogProps {
  /** 다이얼로그 열림 상태 */
  open: boolean;
  /** 다이얼로그 열림/닫힘 콜백 */
  onOpenChange: (open: boolean) => void;
  /**
   * 렌더링 모드
   * - `flexible`: 모바일(<768px) → BottomSheet, 데스크톱 → Dialog
   * - `only-wide`: 항상 Dialog, 모바일에서는 토스트 안내 후 열지 않음
   */
  mode?: 'flexible' | 'only-wide';

  /**
   * 모바일 환경에서의 렌더링 모드
   * - `fullscreen`: 바텀시트 대신 createPortal로 전체화면 페이지 렌더링 (인풋이 있는 다이얼로그용)
   * - 미지정(기본): 기존 바텀시트 동작 유지
   */
  webViewMode?: 'fullscreen';

  /** 너비 프리셋 (기본: 'standard') */
  width?: FlexibleDialogWidth;

  // Dialog/BottomSheet 공통 props
  /** 패딩 (기본: 'md') */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** 스크롤 모드 (기본: 'inside') */
  scroll?: 'inside' | 'none';
  /** 닫기 버튼 표시 (기본: true) */
  closeButton?: boolean;
  /** z-index 레벨 (1: 기본, 2: 중첩, 3: 확인) */
  zLevel?: 1 | 2 | 3;

  // Dialog 전용 (only-wide 또는 데스크톱에서만 적용)
  /** 고정 높이 */
  height?: '70vh' | '75vh' | '80vh' | '85vh' | '90vh';
  /** 최대 높이 (기본: '85vh') */
  maxHeight?: '70vh' | '75vh' | '80vh' | '85vh' | '90vh' | 'screen';

  // BottomSheet 전용 (flexible 모바일에서만 적용)
  /** 바텀시트 고정 높이 (dvh 기준). 지정하면 항상 이 높이로 열림. */
  bottomSheetHeight?: number;
  /** 바텀시트 최대 높이 (dvh 기준, 기본: 95). bottomSheetHeight 미지정 시에만 적용. */
  bottomSheetMaxHeight?: number;

  /** only-wide 모드 좁은 화면 안내 메시지 (기본: 'PC 환경에서 이용해주세요') */
  narrowScreenMessage?: string;

  // Header 슬롯 props
  /** 헤더 제목 (string | ReactNode) */
  title?: ReactNode;
  /** 헤더 좌측 액션 */
  headerLeftAction?: ReactNode;
  /** 헤더 우측 액션 (닫기 버튼 대체) */
  headerRightAction?: ReactNode;
  /** 헤더 닫기 버튼 표시 여부 (기본: title 있으면 true) */
  showHeaderCloseButton?: boolean;
  /** 헤더 className */
  headerClassName?: string;

  // Content props
  /** 콘텐츠 className */
  contentClassName?: string;

  // Footer 슬롯 props
  /** 푸터 내용 */
  footer?: ReactNode;
  /** 푸터 className */
  footerClassName?: string;

  className?: string;
  overlayClassName?: string;
  children: ReactNode;
}

// ============================================================================
// Context
// ============================================================================

export type FlexibleDialogRenderMode = 'dialog' | 'bottom-sheet' | 'fullscreen';

export interface FlexibleDialogContextValue {
  /** 현재 렌더링 모드 */
  renderMode: FlexibleDialogRenderMode;
  /** 닫기 핸들러 */
  onClose: () => void;
  /** z-index 레벨 (1: 기본, 2: 중첩, 3: 확인) */
  zLevel: number;
}
