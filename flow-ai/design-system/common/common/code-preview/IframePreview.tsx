'use client';

import { memo, useMemo } from 'react';
import { wrapHtmlCode } from './sandpack-utils';

interface IframePreviewProps {
  code: string;
  language: string;
}

/**
 * HTML 코드를 iframe srcdoc으로 직접 렌더링하는 프리뷰 컴포넌트
 *
 * Sandpack과 달리 iframe만 사용하므로 모바일 WebView에서도 동작합니다.
 * HTML 코드 블록 전용이며, JSX/TSX/Vue 등은 Sandpack을 사용해야 합니다.
 */
export const IframePreview = memo(function IframePreview({ code, language }: IframePreviewProps) {
  const srcdoc = useMemo(() => {
    const lang = language.toLowerCase();
    if (lang === 'html') {
      return wrapHtmlCode(code);
    }
    // HTML이 아닌 경우에도 fallback으로 코드를 pre 태그로 렌더링
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>body { font-family: system-ui, -apple-system, sans-serif; padding: 1rem; margin: 0; }</style>
</head>
<body><pre>${code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></body>
</html>`;
  }, [code, language]);

  return (
    <iframe
      srcDoc={srcdoc}
      className='h-full w-full border-none'
      sandbox='allow-scripts allow-same-origin'
      title='Code Preview'
    />
  );
});
