/**
 * @file markdown-renderer.tsx
 * @description 순수 Marked.js 기반 Markdown 렌더러
 *
 * **변경 사항:**
 * - React-Markdown 완전 제거
 * - 모든 렌더링을 marked.js로 통일
 * - 이벤트 위임 패턴으로 인터랙션 처리
 *
 * **역할:**
 * - 스트리밍 중: placeholder div (useChatMessageHandling이 업데이트)
 * - 완료 후: marked.js로 HTML 생성 + 이벤트 위임
 *
 * **내장 이벤트 (useBuiltinMarkdownEvents):**
 * - 코드 블록 더보기/접기
 * - 코드 블록 복사
 * - 코드 블록 테마 토글
 *
 * **장점:**
 * - 번들 크기 ~90KB 감소
 * - 성능 10-30% 향상
 * - 스트리밍/완료 후 일관된 렌더링
 * - 단독 사용 시에도 기본 인터랙션 동작
 */

// 'use client';

import { useUIStore } from '@/stores/ui-store';
import { memo, useEffect, useRef, useState } from 'react';
import { useBuiltinMarkdownEvents } from './hooks/useBuiltinMarkdownEvents';
import { expandedCodeBlocksMap, restoreExpandedCodeBlocks } from './utils/code-block-expand';

// Streaming renderer (marked.js)
import { renderMarkdown } from './streaming';

// Hooks
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useReferenceRegistration } from '@/hooks/useReferenceRegistration';
import { useReferenceContextOptional } from './context/ReferenceContext';
import { i18n } from '@flowai/i18n';
import {
  setReferenceLookups,
  clearReferenceLookups,
  setReferenceChipLabels,
  clearReferenceChipLabels,
  setDecryptMapForRender,
  clearDecryptMapForRender,
} from './components';
import {
  setMarkdownImageDefaultAlt,
  clearMarkdownImageDefaultAlt,
  setImageAttrsDefaultAlt,
  clearImageAttrsDefaultAlt,
} from './streaming';

interface MarkdownRendererProps {
  markdownText: string;
  messageId?: number;
  isStreaming?: boolean;
  mode?: 'default' | 'simple';
  className?: string;
  decryptMap?: Map<string, { originalWord: string; detectionType: string }> | null;
}

function MarkdownRenderer({
  markdownText,
  messageId,
  isStreaming = false,
  className,
  decryptMap,
}: MarkdownRendererProps) {
  const { t } = useAppTranslation('common');
  const isDebug = useUIStore((state) => state.isDebug);
  const refContext = useReferenceContextOptional();

  const [showRaw, setShowRaw] = useState(false);
  const containerKey = `${messageId ?? 'unknown'}-${isStreaming ? 'streaming' : 'final'}`;
  const containerRef = useRef<HTMLDivElement>(null);

  // Reference 칩 자동 등록 (스트리밍 완료 후에만)
  useReferenceRegistration({
    containerRef,
    messageId,
    enabled: !isStreaming,
  });

  // 내장 이벤트 (더보기/복사/테마 토글) - document 레벨 이벤트 위임
  useBuiltinMarkdownEvents();

  // 📐 스트리밍→final 전환 시 펼쳐진 코드블록 복원
  useEffect(() => {
    if (isStreaming || !messageId || !containerRef.current) return;
    const expanded = expandedCodeBlocksMap.get(messageId);
    if (!expanded) return;
    expandedCodeBlocksMap.delete(messageId);
    restoreExpandedCodeBlocks(containerRef.current, expanded);
  }, [isStreaming, messageId]);

  // [스트리밍 중] placeholder div (useStreamingDOM이 DOM 직접 조작)
  // markdownText가 없을 때만 placeholder 반환 (SSE CONTENT 스트리밍 대상)
  // markdownText가 이미 있으면 (업무매니저 tool answer 등) React 렌더링으로 진행
  if (isStreaming && !markdownText) {
    return (
      <div
        ref={containerRef}
        data-streaming-message={messageId}
        data-message-id={messageId}
        className='prose prose-base relative min-w-full overflow-hidden break-words [&>:first-child]:!mt-0 [&_p+p]:mt-4'
        key={containerKey}
      />
    );
  }

  // 빈 문자열 처리
  try {
    if (!markdownText || markdownText.trim().length === 0) {
      return null;
    }
  } catch (e) {
    console.error('markdownText', markdownText);
    return null;
  }

  // 다국어 라벨 주입 (reference 칩·이미지 alt - marked 동기 렌더링에서 사용)
  setReferenceChipLabels({
    fsType: {
      project: t(i18n.common.reference.project),
      post: t(i18n.common.reference.fs_type_post),
      comment: t(i18n.common.reference.fs_type_comment),
      chat: t(i18n.common.reference.fs_type_chat),
    },
    fileLabel: t(i18n.common.reference.file_label),
    chipTitleRemaining: t(i18n.common.reference.chip_title_remaining),
  });
  setMarkdownImageDefaultAlt(t(i18n.common.markdown_image.alt_default));
  setImageAttrsDefaultAlt(t(i18n.common.markdown_image.alt_default));

  // ReferenceContext의 lookup maps 주입 (DB + SSE merge 데이터)
  if (refContext) {
    setReferenceLookups({
      vectorReferenceLookup: refContext.vectorReferenceLookup,
      flowSearchReferenceLookup: refContext.flowSearchReferenceLookup,
      webSearchReferenceLookup: refContext.webSearchReferenceLookup,
    });
  }

  // 복호화 맵 주입 (히스토리 메시지용 - 렌더링 시 직접 복호화)
  if (decryptMap && decryptMap.size > 0) {
    setDecryptMapForRender(decryptMap);
  }

  const html = renderMarkdown(markdownText, messageId);

  // 렌더링 완료 후 정리
  clearDecryptMapForRender();
  clearReferenceLookups();
  clearReferenceChipLabels();
  clearMarkdownImageDefaultAlt();
  clearImageAttrsDefaultAlt();

  return (
    <div
      ref={containerRef}
      data-message-id={messageId}
      className={`prose prose-base relative min-w-full overflow-hidden break-words text-base [&>div>:first-child]:!mt-0 [&_p+p]:mt-4 ${className || ''}`}
      key={containerKey}
    >
      {isDebug && showRaw ? (
        <pre className='my-3 whitespace-pre-wrap rounded border bg-transparent p-0 text-sm text-gray-800'>
          {markdownText}
        </pre>
      ) : (
        <div dangerouslySetInnerHTML={{ __html: html }} />
      )}
      {isDebug && (
        <div className='absolute bottom-[-1px] right-0 opacity-70'>
          <button
            onClick={() => setShowRaw(false)}
            className={`rounded-l border border-gray-200 px-1 py-0.5 text-xs font-medium transition-colors ${
              !showRaw ? 'text-foreground bg-gray-200' : 'bg-white text-gray-400 hover:bg-gray-100'
            }`}
            style={{ minWidth: 18, borderRightWidth: 0 }}
          >
            v
          </button>
          <button
            onClick={() => setShowRaw(true)}
            className={`rounded-r border border-gray-200 px-1 py-0.5 text-xs font-medium transition-colors ${
              showRaw ? 'text-foreground bg-gray-200' : 'bg-white text-gray-400 hover:bg-gray-100'
            }`}
            style={{ minWidth: 18, borderLeftWidth: 0 }}
          >
            m
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(MarkdownRenderer);
