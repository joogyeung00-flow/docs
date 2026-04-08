/**
 * @file useBuiltinMarkdownEvents.ts
 * @description 마크다운 렌더러 내장 이벤트 핸들러
 *
 * **내장 이벤트 (외부 의존성 없음):**
 * - 코드 블록 더보기/접기 토글
 * - 코드 블록 복사
 * - 코드 블록 테마 토글
 *
 * **특징:**
 * - 마크다운 렌더러 단독 사용 시에도 기본 인터랙션 동작
 * - store나 외부 로직 의존성 없음
 * - useMarkdownEvents와 중복 방지를 위해 이벤트 처리 시 stopImmediatePropagation 호출
 */

import { useAppTranslation } from '@/hooks/useAppTranslation';
import { i18n } from '@flowai/i18n';
import { copyToClipboard, resolveMaskingLabels } from '@/lib/utils/clipboard';
import { decryptMapCache } from '@/hooks/useDecryptMap';
import { editorChannel } from '@/lib/flow-bridge-sdk/EditorChannel';
import { useChatStore } from '@/stores/chat.store';
import type { RefObject } from 'react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { isWebView } from '@/lib/utils/device-utils';
import { MobileBridge, SEND_EVENTS } from '@/lib/bridge';

export interface UseBuiltinMarkdownEventsOptions {
  containerRef?: RefObject<HTMLElement | null>;
}

const SUN_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
const MOON_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;

export function useBuiltinMarkdownEvents(_options?: UseBuiltinMarkdownEventsOptions) {
  const { t } = useAppTranslation('common');
  const md = i18n.common.markdown;

  useEffect(() => {
    const handleClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // ============================================
      // 📝 에디터에 전송 버튼 (flow-canvas → Flow 에디터)
      // ============================================
      if (target.classList.contains('streaming-paste-to-editor-btn')) {
        const codeBlock = target.closest('.streaming-code-block');
        if (!codeBlock) return;

        const encodedCode = codeBlock.getAttribute('data-code');
        if (!encodedCode) return;

        e.stopImmediatePropagation();

        try {
          const html = decodeURIComponent(atob(encodedCode));

          // Bridge SDK를 통해 Host(Flow)에 paste 요청
          const result = await editorChannel.pasteToEditor(html);
          if (result.success) {
            toast.success('에디터에 전송되었습니다.');
          } else if (result.reason === 'EDITOR_NOT_OPEN') {
            toast.error('게시물 에디터를 먼저 열어주세요.');
          } else if (result.reason === 'NOT_TEXT_EDITOR') {
            toast.error('글 작성 모드에서만 가능합니다.');
          } else {
            toast.error('전송에 실패했습니다.');
          }
        } catch {
          toast.error('전송에 실패했습니다.');
        }
        return;
      }

      // ============================================
      // 📋 코드 블록 복사 버튼
      // ============================================
      if (target.classList.contains('streaming-copy-btn')) {
        const codeBlock = target.closest('.streaming-code-block');
        if (!codeBlock) return;

        const encodedCode = codeBlock.getAttribute('data-code');
        if (!encodedCode) return;

        e.stopImmediatePropagation();

        try {
          const code = decodeURIComponent(atob(encodedCode));
          const conversationId = useChatStore.getState().conversationId;
          const decryptMap = conversationId ? decryptMapCache.get(conversationId) : undefined;
          const resolvedCode = resolveMaskingLabels(code, decryptMap);
          const { success } = await copyToClipboard(resolvedCode);
          if (success) {
            toast.success(t(md.copy_success));
          } else {
            toast.error(t(md.copy_failed));
          }
        } catch {
          toast.error(t(md.copy_failed));
        }
        return;
      }

      // ============================================
      // 🎨 코드 블록 테마 토글
      // ============================================
      const themeBtn = target.closest('.streaming-theme-btn');
      if (themeBtn) {
        const codeBlock = themeBtn.closest('.streaming-code-block') as HTMLElement;
        if (!codeBlock) return;

        e.stopImmediatePropagation();

        const currentTheme = codeBlock.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        codeBlock.setAttribute('data-theme', newTheme);

        themeBtn.innerHTML = newTheme === 'dark' ? SUN_ICON : MOON_ICON;
        themeBtn.setAttribute('title', newTheme === 'dark' ? t(md.theme_light) : t(md.theme_dark));
        return;
      }

      // ============================================
      // 📐 코드 블록 더 보기 / 접기 토글
      // ============================================
      const expandBtn = target.closest('.code-expand-btn') as HTMLElement;
      if (expandBtn) {
        const codeBlock = expandBtn.closest('.streaming-code-block');
        if (!codeBlock) return;

        const codeContent = codeBlock.querySelector('.code-content');
        if (!codeContent) return;

        e.stopImmediatePropagation();

        const isExpanded = expandBtn.classList.toggle('expanded');
        if (isExpanded) {
          codeContent.classList.remove('code-content-collapsed');
          const spanEl = expandBtn.querySelector('span');
          if (spanEl) spanEl.textContent = t(md.collapse);
        } else {
          codeContent.classList.add('code-content-collapsed');
          const spanEl = expandBtn.querySelector('span');
          const lineCount = codeBlock.getAttribute('data-code')
            ? decodeURIComponent(atob(codeBlock.getAttribute('data-code')!)).split('\n').length
            : 0;
          if (spanEl) spanEl.textContent = t(md.expand_lines, { n: lineCount });
        }

        // 펼치기
        expandBtn.classList.add('expanded');
        codeContent.classList.remove('code-content-collapsed');
        const spanEl = expandBtn.querySelector('span');
        if (spanEl) spanEl.textContent = '접기';

        // 버튼 숨기기 (완전히 펼쳐진 상태로 유지)
        expandBtn.style.display = 'none';
        return;
      }

      // ============================================
      // 🔗 외부 링크 클릭 (웹뷰 분기)
      // ============================================
      const link = target.closest('a[href]') as HTMLAnchorElement;
      if (link && link.href) {
        // 내부 링크는 기본 동작 유지 (같은 도메인)
        try {
          const linkUrl = new URL(link.href);
          const currentUrl = new URL(window.location.href);
          const isExternalLink = linkUrl.origin !== currentUrl.origin;

          // 외부 링크이고 웹뷰 환경인 경우
          if (isExternalLink && isWebView()) {
            e.preventDefault();
            e.stopImmediatePropagation();

            try {
              MobileBridge.send({
                EVENT: SEND_EVENTS.OPEN_EXTERNAL_WEB_LINK,
                DATA: { url: link.href },
              });
            } catch {
              toast.error(t(md.external_link_blocked));
            }
            return;
          }
        } catch {
          // URL 파싱 실패 시 기본 동작 유지
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [t]);
}
