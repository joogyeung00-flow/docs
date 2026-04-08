'use client';

import { useAppTranslation } from '@/hooks/useAppTranslation';
import { i18n } from '@flowai/i18n';
import { Download, Loader2 } from 'lucide-react';
import { memo } from 'react';

export interface ExcelTemplateDownloadButtonProps {
  onClick: () => void;
  /** 버튼 라벨 (기본값: '엑셀 템플릿 다운로드') */
  label?: string;
  /** 다운로드 진행 중 여부 */
  isDownloading?: boolean;
}

/**
 * ExcelTemplateDownloadButton - 엑셀 다운로드 버튼
 *
 * @description
 * 프로젝트 컬럼/상태 기반 엑셀 다운로드를 위한 순수 UI 버튼 컴포넌트.
 * 클릭 이벤트만 props로 받으며, 실제 다운로드 로직은 useExcelTemplateDownload 훅에서 처리합니다.
 *
 * @example
 * ```tsx
 * <ExcelTemplateDownloadButton onClick={downloadTemplate} />
 * <ExcelTemplateDownloadButton onClick={downloadTemplate} label="엑셀 다운로드" isDownloading={isDownloading} />
 * ```
 */
export const ExcelTemplateDownloadButton = memo(function ExcelTemplateDownloadButton({
  onClick,
  label,
  isDownloading = false,
}: ExcelTemplateDownloadButtonProps) {
  const { t } = useAppTranslation('common');
  const resolvedLabel = label ?? t(i18n.common.ui.excel_template_download);

  return (
    <button
      type='button'
      onClick={onClick}
      disabled={isDownloading}
      className='text-muted-foreground hover:text-foreground hover:bg-muted/50 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors disabled:opacity-50'
    >
      {isDownloading ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <Download className='h-3.5 w-3.5' />}
      <span>{resolvedLabel}</span>
    </button>
  );
});
