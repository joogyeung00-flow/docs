'use client';

import { memo, useMemo, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { X, RotateCcw, Camera, Share, AppWindow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useCodePreviewPanel } from '@/hooks/code-preview';
import { useCodePreviewStore } from '@/stores/code-preview-store';
import { i18n } from '@flowai/i18n';
import { SandpackPreview } from './SandpackPreview';
import { IframePreview } from './IframePreview';
import { isIframePreviewable } from './utils';
import { parseTitleFromCode } from './parse-title';
import { useChatStore } from '@/stores/chat.store';
import { CHAT_TYPES, ResourceType } from '@flowai/shared';
import ShareDialog from '@/components/share/dialog/ShareDialog';

/**
 * 코드 미리보기 캔버스 패널 (우측 패널)
 *
 * - 프리뷰 전용 (코드 탭 없음)
 * - 상단 헤더: 코드에서 파싱한 제목 + 액션 버튼 (새로고침, 캡쳐, 공유, 닫기)
 */
export const CodePreviewCanvasPanel = memo(function CodePreviewCanvasPanel() {
  const { t } = useAppTranslation('common');
  const pathname = usePathname();
  const isSharePage = pathname?.startsWith('/share/') ?? false;
  const chatType = useChatStore((state) => state.type);
  const isConverterChat = chatType === CHAT_TYPES.converter;

  const previewData = useCodePreviewStore((state) => state.previewData);
  const isOpen = useCodePreviewStore((state) => state.isOpen);
  const closePreview = useCodePreviewStore((state) => state.closePreview);

  const code = previewData?.code ?? '';
  const language = previewData?.language ?? '';
  const messageId = previewData?.messageId;
  const codeBlockIndex = previewData?.codeBlockIndex;

  const { previewKey, handleRefresh, handleDownloadPng } = useCodePreviewPanel({ code, language });

  const parsedTitle = useMemo(() => parseTitleFromCode(code), [code]);
  const title = parsedTitle || t(i18n.common.code_preview.default_title);

  // 공유 다이얼로그 상태
  const [isShareOpen, setIsShareOpen] = useState(false);
  const handleShare = useCallback(() => setIsShareOpen(true), []);
  const handleShareClose = useCallback(() => setIsShareOpen(false), []);

  const canShare = !isSharePage && !isConverterChat && messageId !== undefined;

  if (!isOpen || !previewData) return null;

  return (
    <div className='bg-background flex h-full flex-col'>
      {/* 상단 헤더 */}
      <div className='flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3'>
        <div className='flex min-w-0 flex-1 items-center gap-2'>
          <AppWindow className='text-muted-foreground h-5 w-5 shrink-0' />
          <span className='truncate text-sm font-medium'>{title}</span>
        </div>

        <div className='flex shrink-0 items-center gap-1'>
          <Button variant='ghost' size='icon' onClick={handleRefresh} title={t(i18n.common.code_preview.refresh)}>
            <RotateCcw className='h-4 w-4' />
          </Button>

          <Button
            variant='ghost'
            size='icon'
            onClick={handleDownloadPng}
            title={t(i18n.common.code_preview.download_image)}
          >
            <Camera className='h-4 w-4' />
          </Button>

          {canShare && (
            <Button variant='ghost' size='icon' onClick={handleShare} title={t(i18n.common.code_preview.share)}>
              <Share className='h-4 w-4' />
            </Button>
          )}

          <Button variant='ghost' size='icon' onClick={closePreview} title={t(i18n.common.alert_dialog.close)}>
            <X className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* 프리뷰 콘텐츠 */}
      <div key={previewKey} className='min-h-0 flex-1'>
        {isIframePreviewable(language) ? (
          <IframePreview code={code} language={language} />
        ) : (
          <SandpackPreview code={code} language={language} isDark={false} />
        )}
      </div>

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
    </div>
  );
});
