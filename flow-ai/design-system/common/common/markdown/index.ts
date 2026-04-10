/**
 * @file markdown/index.ts
 * @description Markdown 렌더링 모듈 메인 export
 *
 * **모듈 구조:**
 * ```
 * markdown/
 * ├── markdown-renderer.tsx     (통합 렌더러: 스트리밍/완료)
 * ├── streaming/                (스트리밍 렌더링)
 * │   └── renderMarkdown()
 * ├── utils/                    (공통 유틸리티)
 * ├── components/               (커스텀 엘리먼트)
 * └── renderers/                (렌더러 컴포넌트)
 * ```
 *
 * **주요 export:**
 * - MarkdownRenderer: 통합 렌더러 컴포넌트 (isStreaming props)
 * - renderMarkdown: 스트리밍용 렌더러 (marked.js)
 * - 유틸리티, 컴포넌트, 렌더러
 *
 * **다시 그리기:**
 * - 서버 restream API 사용 (기존 스트리밍 로직 재사용)
 */

// 통합 렌더러 (스트리밍 + 완료 후 렌더링)
export { default as MarkdownRenderer } from './markdown-renderer';

// 스트리밍 렌더링
export { renderMarkdown, resetCounter } from './streaming';

// 유틸리티
export * from './utils';

// 렌더러
export * from './renderers';
