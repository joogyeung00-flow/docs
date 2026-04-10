'use client';

import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogOverlay, DialogPortal, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Z_INDEX } from '@/constants/z-index';
import { ReactNode } from 'react';

/**
 * 테이블 컬럼 정의
 */
export interface StatDetailColumn {
  /** 컬럼 헤더 텍스트 */
  header: string;
  /** 최소 너비 Tailwind 클래스 (예: 'min-w-16') */
  minWidth?: string;
}

/**
 * 테이블 행 데이터
 */
export interface StatDetailRow {
  /** 고유 키 */
  key: string;
  /** 각 컬럼에 대응하는 셀 값 배열 */
  cells: ReactNode[];
}

/**
 * 테이블 섹션 설정
 */
export interface StatDetailTableConfig {
  /** 테이블 섹션 제목 */
  title: string;
  /** 컬럼 정의 */
  columns: StatDetailColumn[];
  /** 행 데이터 */
  rows: StatDetailRow[];
  /** 데이터 없을 때 표시할 텍스트 */
  emptyText?: string;
}

/**
 * 뱃지 설정
 */
export interface StatDetailBadge {
  /** 뱃지 텍스트 */
  text: string;
}

/**
 * StatDetailModal 설정 인터페이스
 *
 * JSON 형태로 config만 넘기면 모달이 렌더링됩니다.
 * 모델 정보, 사용자 상세, 부서 상세 등 다양한 통계 팝업에 공통으로 사용됩니다.
 */
export interface StatDetailModalConfig {
  /** 모달 제목 (좌상단) */
  title: string;
  /** 중앙 아이콘/아바타 영역 (ReactNode로 자유롭게 구성) */
  centerContent?: ReactNode;
  /** 중앙 메인 이름 (모델명, 사용자명, 부서명 등) */
  name: string;
  /** 이름 아래 부가 설명 (예: 제공사 정보) */
  subtitle?: string;
  /** 뱃지 목록 (사용량, 비율 등) */
  badges?: StatDetailBadge[];
  /** 이름/뱃지 아래 설명 텍스트 */
  description?: string;
  /** 테이블 섹션 목록 (기능별 사용량, Top 5 등) */
  tables?: StatDetailTableConfig[];
  /** 로딩 상태 */
  loading?: boolean;
  /** 로딩 중 텍스트 */
  loadingText?: string;
  /** 에러/실패 상태 텍스트 */
  errorText?: string;
  /** 에러 상태 여부 */
  hasError?: boolean;
}

/**
 * StatDetailModal Props
 */
interface StatDetailModalProps {
  /** 모달 열림/닫힘 상태 */
  open: boolean;
  /** 열림/닫힘 변경 핸들러 */
  onOpenChange: (open: boolean) => void;
  /** 모달 설정 */
  config: StatDetailModalConfig;
  /** 추가 className */
  className?: string;
}

const CELL_CLASS =
  "border-border text-foreground border-l border-t p-2 text-center font-['Noto_Sans_KR'] text-xs font-normal leading-5";
const HEADER_CELL_CLASS =
  "border-border text-foreground flex-1 border-l border-t p-2 text-center font-['Noto_Sans_KR'] text-xs font-medium leading-5";

/**
 * StatDetailModal - 통계 상세 정보 팝업
 *
 * @description
 * 모델, 사용자, 부서 등 다양한 통계 항목의 상세 정보를 표시하는 공통 모달 컴포넌트입니다.
 * Config 객체만 전달하면 자동으로 레이아웃이 구성됩니다.
 *
 * @example
 * ```tsx
 * // 사용자 상세
 * <StatDetailModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   config={{
 *     title: '사용자 정보',
 *     centerContent: <UserProfile name="홍길동" size="lg" />,
 *     name: '홍길동',
 *     badges: [{ text: '총 사용량: 150건' }, { text: '사용 비율: 12.5%' }],
 *     tables: [{
 *       title: '기능별 사용 현황',
 *       columns: [{ header: '기능' }, { header: '사용량' }, { header: '비율' }],
 *       rows: [{ key: 'general', cells: ['일반 대화', '100건', '66.7%'] }],
 *     }],
 *   }}
 * />
 * ```
 */
export function StatDetailModal({ open, onOpenChange, config, className }: StatDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay
          className='fixed inset-0 bg-black/50 backdrop-blur-sm'
          style={{ zIndex: Z_INDEX.NESTED_DIALOG_OVERLAY }}
        />
        <DialogContent
          className={cn('bg-background max-h-[85vh] overflow-y-auto rounded-md border-none p-6 shadow-lg', className)}
          style={{ zIndex: Z_INDEX.NESTED_DIALOG_CONTENT }}
          closeButton={false}
        >
          <div className='flex flex-col items-start justify-start gap-6'>
            {/* Header: title + close button */}
            <div className='flex w-full flex-col items-start justify-start gap-4'>
              <div className='inline-flex items-center justify-start gap-4 self-stretch'>
                <div className='inline-flex flex-1 flex-col items-start justify-start'>
                  <DialogTitle className="text-foreground justify-start font-['Noto_Sans_KR'] text-lg font-semibold leading-7">
                    {config.title}
                  </DialogTitle>
                </div>
                <button
                  type='button'
                  onClick={() => onOpenChange(false)}
                  className='hover:bg-muted flex items-center justify-center gap-2 rounded-md p-3 transition-colors'
                >
                  <X className='text-foreground h-4 w-4' />
                </button>
              </div>
            </div>

            {/* Body */}
            {config.loading ? (
              <div className='flex items-center justify-center self-stretch py-10'>
                <div className='text-muted-foreground'>{config.loadingText || 'Loading...'}</div>
              </div>
            ) : config.hasError ? (
              <div className='flex items-center justify-center self-stretch py-10'>
                <div className='text-muted-foreground'>{config.errorText || 'Failed to load data.'}</div>
              </div>
            ) : (
              <div className='flex flex-col items-start justify-start gap-6 self-stretch'>
                {/* Center section: icon/avatar + name + subtitle + badges + description */}
                <div className='flex flex-col items-center justify-center gap-2 self-stretch'>
                  {/* Center content (icon, avatar, etc.) */}
                  {config.centerContent && (
                    <div className='inline-flex items-center justify-center gap-2.5 self-stretch'>
                      {config.centerContent}
                    </div>
                  )}

                  {/* Name */}
                  <div className="text-foreground justify-start font-['Noto_Sans_KR'] text-xl font-semibold leading-7">
                    {config.name}
                  </div>

                  {/* Subtitle */}
                  {config.subtitle && (
                    <div className="text-muted-foreground justify-start text-center font-['Noto_Sans_KR'] text-sm font-normal leading-6">
                      {config.subtitle}
                    </div>
                  )}

                  {/* Badges */}
                  {config.badges && config.badges.length > 0 && (
                    <div className='inline-flex flex-wrap items-start justify-center gap-2'>
                      {config.badges.map((badge, idx) => (
                        <div key={idx} className='bg-muted flex items-center justify-center gap-2.5 rounded px-2 py-1'>
                          <div className="text-foreground justify-start text-center font-['Noto_Sans_KR'] text-xs font-medium leading-5">
                            {badge.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Description */}
                  {config.description && (
                    <div className="text-muted-foreground justify-start self-stretch text-center font-['Noto_Sans_KR'] text-sm font-normal leading-6">
                      {config.description}
                    </div>
                  )}
                </div>

                {/* Tables */}
                {config.tables?.map((table, tableIdx) => (
                  <div key={tableIdx} className='flex flex-col items-start justify-start gap-2 self-stretch'>
                    <div className="text-foreground justify-start font-['Noto_Sans_KR'] text-sm font-medium leading-5">
                      {table.title}
                    </div>
                    <table className='bg-background outline-border w-full overflow-hidden rounded outline outline-1 outline-offset-[-1px]'>
                      <thead>
                        <tr className='bg-muted'>
                          {table.columns.map((col, colIdx) => (
                            <th key={colIdx} className={cn(HEADER_CELL_CLASS, col.minWidth)}>
                              {col.header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {table.rows.length > 0 ? (
                          table.rows.map((row) => (
                            <tr key={row.key} className='bg-background'>
                              {row.cells.map((cell, cellIdx) => (
                                <td key={cellIdx} className={CELL_CLASS}>
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))
                        ) : (
                          <tr className='bg-background'>
                            <td
                              colSpan={table.columns.length}
                              className="border-border text-muted-foreground border-l border-t p-4 text-center font-['Noto_Sans_KR'] text-xs font-normal leading-5"
                            >
                              {table.emptyText || '-'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
