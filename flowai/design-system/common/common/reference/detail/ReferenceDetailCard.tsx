'use client';

import { getFileIcon, getReferenceDetailCardTitle } from '@/components/agent/assistant/util/assistant-util';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { i18n } from '@flowai/i18n';
import { highlightTextInHTMLUsingDOM } from '@/components/agent/assistant/util/html-highlight';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getRadixViewport, scrollToElementInViewport } from '@/lib/utils/canvas-scroll.util';
import { VectorReference, isVectorReferenceFileMetadata } from '@flowai/shared';
import { ArrowLeft, Download } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef } from 'react';
import ReferenceDetailCardDescription from './ReferenceDetailCardDescription';
import { MobileBridge, SEND_EVENTS } from '@/lib/bridge';
import { useDeviceContext } from '@/hooks/useDeviceContext';

interface ReferenceDetailCardProps {
  mode: 'chat' | 'connected-reference';
  selectedVectorReferenceCard: VectorReference;
  setSelectedVectorReferenceCard: (reference: VectorReference | null) => void;
}

export default function ReferenceDetailCard({
  mode,
  selectedVectorReferenceCard,
  setSelectedVectorReferenceCard,
}: ReferenceDetailCardProps) {
  const { t } = useAppTranslation('assistant');
  const { isWebView } = useDeviceContext();
  if (!selectedVectorReferenceCard || !selectedVectorReferenceCard.sentences) {
    return null;
  }

  // mode 가 chat 인 경우 하이라이팅 처리
  let html = selectedVectorReferenceCard.html || '';
  if (mode === 'chat') {
    html = highlightTextInHTMLUsingDOM(
      selectedVectorReferenceCard.html || '',
      selectedVectorReferenceCard.sentences.map((sentence) => sentence.sentence),
    );
  }

  const contentRef = useRef<HTMLDivElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  const handleDownloadClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isVectorReferenceFileMetadata(selectedVectorReferenceCard.metadata)) {
      if (isWebView) {
        MobileBridge.send({
          EVENT: SEND_EVENTS.OPEN_EXTERNAL_WEB_LINK,
          DATA: { url: selectedVectorReferenceCard.metadata.s3Url },
        });
      } else {
        window.open(selectedVectorReferenceCard.metadata.s3Url, '_blank');
      }
    }
  };

  useEffect(() => {
    return () => {
      setSelectedVectorReferenceCard(null);
    };
  }, [selectedVectorReferenceCard]);

  // 마크된 텍스트로 스크롤 (Canvas 내부 스크롤만, 본문 스크롤에 영향 없음)
  useEffect(() => {
    const firstMark = contentRef.current?.querySelector('mark');
    const viewport = getRadixViewport(scrollAreaRef);

    if (firstMark instanceof HTMLElement && viewport) {
      scrollToElementInViewport(firstMark, viewport, 'center');
    }
  }, [selectedVectorReferenceCard.id, html]);

  // 삽입된 HTML 내부 요소들의 드래그 방지 (데스크톱 + 모바일)
  useEffect(() => {
    if (!contentRef.current) return;

    const preventDrag = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const preventSelect = (e: Event) => {
      e.preventDefault();
    };

    const content = contentRef.current;

    // 모든 이미지와 요소에 draggable="false" 설정
    const images = content.querySelectorAll('img');
    images.forEach((img) => {
      img.setAttribute('draggable', 'false');
    });

    // 드래그 이벤트 방지
    content.addEventListener('dragstart', preventDrag);
    content.addEventListener('selectstart', preventSelect);

    return () => {
      content.removeEventListener('dragstart', preventDrag);
      content.removeEventListener('selectstart', preventSelect);
    };
  }, [html]);

  return (
    <div className='flex h-full w-full flex-col gap-3 p-3'>
      {/* 액션 칩 영역 */}
      <div className='flex w-full flex-shrink-0 gap-3'>
        <Button
          variant='outline'
          size='sm'
          className='w-full text-xs'
          onClick={() => setSelectedVectorReferenceCard(null)}
        >
          <ArrowLeft className='mr-1 h-3 w-3' />
          {t(i18n.assistant.agent.reference_back_to_list)}
        </Button>
        <Button variant='outline' size='sm' className='w-full text-xs' onClick={handleDownloadClick}>
          <Download className='mr-1 h-3 w-3' />
          {t(i18n.assistant.agent.file_download)}
        </Button>
      </div>

      {/* 카드 영역 */}
      <Card className='border-border bg-card relative flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-lg border shadow'>
        {/* 헤더 영역 */}
        <CardHeader className='flex flex-shrink-0 justify-start space-y-0 border-b border-gray-200 p-3 pb-2'>
          <div className='flex min-w-0 flex-1 items-center gap-2'>
            <Image
              src={getFileIcon(selectedVectorReferenceCard)}
              alt='Reference Icon'
              width={16}
              height={16}
              className='min-h-4 min-w-4'
            />
            <CardTitle className='text-foreground line-clamp-2 text-sm font-medium'>
              {getReferenceDetailCardTitle(selectedVectorReferenceCard)}
            </CardTitle>
          </div>
          <ReferenceDetailCardDescription reference={selectedVectorReferenceCard} type='detail' />
        </CardHeader>

        {/* 안내 메시지 영역 */}
        <div className='flex-shrink-0 border-b border-gray-200 bg-gray-50 px-3 py-2'>
          <p className='text-2xs text-gray-600'>{t(i18n.assistant.agent.doc_excerpt_note)}</p>
        </div>

        {/* 본문 영역 */}
        <CardContent
          ref={scrollAreaRef}
          className='w-full flex-1 origin-top-left overflow-x-auto overflow-y-auto p-3'
          style={{ transformOrigin: 'top left', zoom: 0.8 }}
        >
          <div
            className='prose prose-sm overflow-wrap-anywhere w-full max-w-none select-none break-words text-sm leading-5'
            ref={contentRef}
            onDragStart={(e) => e.preventDefault()}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
