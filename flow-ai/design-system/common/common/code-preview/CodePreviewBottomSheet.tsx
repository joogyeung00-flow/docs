'use client';

import { FlowBottomSheet, FlowBottomSheetHeader } from '@/components/common/ui/FlowBottomSheet';
import ShareDialog from '@/components/share/dialog/ShareDialog';
import { Button } from '@/components/ui/button';
import { useCodePreviewPanel } from '@/hooks/code-preview';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useCodePreviewStore } from '@/stores/code-preview-store';
import { i18n } from '@flowai/i18n';
import { ResourceType } from '@flowai/shared';
import { AppWindow, Camera, RotateCcw, Share, X } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';
import { IframePreview } from './IframePreview';
import { parseTitleFromCode } from './parse-title';

/**
 * 모바일용 코드 미리보기 바텀시트
 *
 * - 프리뷰 전용 (Code/Preview 탭 없음, 코드는 본문에서 확인)
 * - HTML → iframe srcdoc (모바일에서도 동작)
 * - JSX/TSX/Vue 등은 모바일 미지원 → useMarkdownEvents에서 토스트로 차단되므로 여기까지 오지 않음
 * - 헤더: 코드에서 파싱한 제목 + 액션 버튼 (새로고침, 캡쳐, 공유) + X 닫기
 */
export const CodePreviewBottomSheet = memo(function CodePreviewBottomSheet() {
  const { t } = useAppTranslation('common');
  const cp = i18n.common.code_preview;
  const previewData = useCodePreviewStore((state) => state.previewData);
  const isOpen = useCodePreviewStore((state) => state.isOpen);
  const closePreview = useCodePreviewStore((state) => state.closePreview);

  const code = previewData?.code ?? '';
  const language = previewData?.language ?? '';
  const messageId = previewData?.messageId;
  const codeBlockIndex = previewData?.codeBlockIndex;

  const { previewKey, handleRefresh, handleDownloadPng } = useCodePreviewPanel({ code, language, variant: 'mobile' });

  const parsedTitle = useMemo(() => parseTitleFromCode(code), [code]);
  const title = parsedTitle || t(cp.default_title);

  // 공유 다이얼로그 상태
  const [isShareOpen, setIsShareOpen] = useState(false);
  const handleShare = useCallback(() => setIsShareOpen(true), []);
  const handleShareClose = useCallback(() => setIsShareOpen(false), []);

  const canShare = messageId !== undefined;

  if (!previewData) return null;

  // 헤더 좌측: 앱 아이콘
  const headerLeftContent = <AppWindow className='mr-2 h-4 w-4' />;

  // 헤더 우측: 액션 버튼들 (새로고침, 캡쳐, 공유, 닫기)
  // FlowBottomSheetHeader는 rightAction이 있으면 기본 X 버튼을 대체하므로 직접 포함
  const headerRightContent = (
    <div className='flex items-center'>
      <Button variant='ghost' size='icon' className='h-8 w-8' onClick={handleRefresh} title={t(cp.refresh)}>
        <RotateCcw className='h-4 w-4' />
      </Button>
      <Button variant='ghost' size='icon' className='h-8 w-8' onClick={handleDownloadPng} title={t(cp.download_image)}>
        <Camera className='h-4 w-4' />
      </Button>
      {canShare && (
        <Button variant='ghost' size='icon' className='h-8 w-8' onClick={handleShare} title={t(cp.share)}>
          <Share className='h-4 w-4' />
        </Button>
      )}
      <button
        onClick={closePreview}
        className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200'
        aria-label={t(i18n.common.alert_dialog.close)}
      >
        <X className='h-4 w-4 text-gray-600' />
      </button>
    </div>
  );

  return (
    <>
      <FlowBottomSheet open={isOpen} onOpenChange={(open) => !open && closePreview()} height={95}>
        <FlowBottomSheetHeader
          title={title}
          leftAction={headerLeftContent}
          rightAction={headerRightContent}
          showCloseButton={false}
        />

        {/* 프리뷰 콘텐츠 (iframe 전용) */}
        <div className='min-h-0 flex-1 overflow-hidden'>
          <div key={previewKey} className='h-full w-full'>
            <IframePreview code={code} language={language} />
          </div>
        </div>
      </FlowBottomSheet>

      {/* 공유 다이얼로그 */}
      {canShare && isShareOpen && (
        <ShareDialog
          isOpen={isShareOpen}
          onClose={handleShareClose}
          resourceType={ResourceType.CODE_BLOCK}
          resourceId={String(messageId)}
          resourceMeta={{
            messageId: messageId!,
            codeBlockIndex: codeBlockIndex ?? 0,
            language,
            content: code,
          }}
          title={`${language} ${t(i18n.common.code_preview.share)}`}
        />
      )}
    </>
  );
});
