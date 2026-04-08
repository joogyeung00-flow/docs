/**
 * 코드 미리보기 공통 유틸리티
 *
 * 중복 코드 제거를 위해 CodePreviewCanvasPanel, CodePreviewBottomSheet,
 * CodeBlockShareRenderer, code-renderer에서 공통으로 사용하는 함수들을 통합합니다.
 */

import type React from 'react';
import { darcula, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { CSSProperties } from 'react';

/**
 * SyntaxHighlighter 테마 스타일 (type assertion 중앙화)
 *
 * react-syntax-highlighter의 타입 정의가 불완전하여 타입 단언 필요.
 * 여기서 한 번만 처리하여 컴포넌트에서 반복 사용 방지.
 */
type SyntaxHighlighterStyle = { [key: string]: CSSProperties };

export const SYNTAX_THEMES: { dark: SyntaxHighlighterStyle; light: SyntaxHighlighterStyle } = {
  dark: darcula as SyntaxHighlighterStyle,
  light: oneLight as SyntaxHighlighterStyle,
};

/**
 * Code/Preview 탭 타입
 */
export type ViewTab = 'code' | 'preview';

/**
 * 코드 미리보기 패널 헤더 높이 (Tailwind 클래스)
 */
export const CODE_PREVIEW_HEADER_HEIGHT = 'h-[60px]';

/**
 * Sandpack으로 미리보기 가능한 언어 목록
 */
export const SANDPACK_PREVIEWABLE_LANGUAGES = new Set([
  'jsx',
  'tsx',
  'html',
  'javascript',
  'js',
  'typescript',
  'ts',
  'vue',
  'svelte',
]);

/**
 * Markdown 미리보기 가능 언어 (Dialog에서 렌더링)
 */
export const MARKDOWN_PREVIEWABLE_LANGUAGES = new Set(['markdown', 'md']);

/**
 * React 코드 감지용 정규식 패턴 (컴파일 비용 절감을 위해 상수화)
 */
export const REACT_CODE_PATTERNS = [
  /from\s+['"]react['"]/, // import from 'react'
  /<[A-Z][a-zA-Z]*[\s/>]/, // JSX PascalCase 태그
  /useState\s*\(/, // useState hook
  /useEffect\s*\(/, // useEffect hook
  /useRef\s*\(/, // useRef hook
  /useCallback\s*\(/, // useCallback hook
  /useMemo\s*\(/, // useMemo hook
] as const;

/**
 * React 코드 패턴 감지
 *
 * 언어 명시가 없어도 React 코드인지 판단합니다.
 * - import from 'react'
 * - JSX PascalCase 태그
 * - React hooks (useState, useEffect, useRef, useCallback, useMemo)
 *
 * 정규식은 REACT_CODE_PATTERNS 상수를 사용하여 매번 컴파일하지 않습니다.
 */
export function isReactCode(code: string): boolean {
  return REACT_CODE_PATTERNS.some((p) => p.test(code));
}

/**
 * iframe srcdoc으로 직접 프리뷰 가능한 언어 여부
 * HTML은 Sandpack 없이 iframe만으로 렌더링 가능
 */
export function isIframePreviewable(language: string): boolean {
  return language.toLowerCase() === 'html';
}

/**
 * Sandpack이 필요한 프리뷰인지 (iframe만으로는 불가)
 */
export function isSandpackOnly(language: string, code: string): boolean {
  const lang = language.toLowerCase();
  if (lang === 'html') return false;
  return SANDPACK_PREVIEWABLE_LANGUAGES.has(lang) || isReactCode(code);
}

/**
 * 미리보기 가능 여부 판단
 *
 * Sandpack 지원 언어이거나 React 코드 패턴이 감지되면 true
 */
export function isPreviewable(language: string, code: string): boolean {
  const lang = language.toLowerCase();

  if (SANDPACK_PREVIEWABLE_LANGUAGES.has(lang)) {
    return true;
  }

  // 언어 명시가 없어도 React 코드 패턴 감지
  return isReactCode(code);
}

/**
 * 언어 표시 이름 매핑
 *
 * UI에 표시할 언어 이름을 반환합니다.
 */
const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  // JavaScript/TypeScript
  jsx: 'React JSX',
  tsx: 'React TSX',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  javascript: 'JavaScript',
  js: 'JavaScript',

  // Web
  html: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  sass: 'SASS',
  less: 'LESS',

  // Frameworks
  vue: 'Vue',
  svelte: 'Svelte',
  angular: 'Angular',

  // Data formats
  json: 'JSON',
  yaml: 'YAML',
  yml: 'YAML',
  xml: 'XML',
  toml: 'TOML',

  // Scripting
  python: 'Python',
  py: 'Python',
  ruby: 'Ruby',
  rb: 'Ruby',
  php: 'PHP',
  perl: 'Perl',
  lua: 'Lua',

  // Systems
  go: 'Go',
  rust: 'Rust',
  c: 'C',
  cpp: 'C++',
  csharp: 'C#',
  cs: 'C#',

  // JVM
  java: 'Java',
  kotlin: 'Kotlin',
  scala: 'Scala',
  groovy: 'Groovy',

  // Mobile
  swift: 'Swift',
  objectivec: 'Objective-C',
  dart: 'Dart',

  // Shell
  shell: 'Shell',
  bash: 'Bash',
  sh: 'Shell',
  zsh: 'Zsh',
  powershell: 'PowerShell',
  ps1: 'PowerShell',

  // Database
  sql: 'SQL',
  mysql: 'MySQL',
  postgresql: 'PostgreSQL',
  graphql: 'GraphQL',

  // Markup/Documentation
  markdown: 'Markdown',
  md: 'Markdown',
  latex: 'LaTeX',
  tex: 'LaTeX',

  // Config
  dockerfile: 'Dockerfile',
  docker: 'Docker',
  nginx: 'Nginx',
  makefile: 'Makefile',

  // Other
  text: 'Text',
  plaintext: 'Text',
  diff: 'Diff',
  csv: 'CSV',
};

export function getLanguageDisplayName(lang: string): string {
  return LANGUAGE_DISPLAY_NAMES[lang.toLowerCase()] || lang.toUpperCase();
}

/**
 * HTML 기반 언어 (하이라이팅은 html로, 라벨은 원본 유지)
 */
export const HTML_BASED_LANGUAGES = new Set(['vue', 'svelte', 'angular']);

/**
 * SyntaxHighlighter용 언어 정규화
 *
 * react-syntax-highlighter에서 인식하는 언어명으로 변환합니다.
 * Vue, Svelte, Angular는 HTML로 하이라이팅합니다.
 */
const LANGUAGE_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  rb: 'ruby',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  md: 'markdown',
  cs: 'csharp',
  objectivec: 'objc',
  ps1: 'powershell',
};

export function normalizeLanguageForHighlighter(lang: string): string {
  const normalized = lang.toLowerCase();

  // HTML 기반 언어는 html로 하이라이팅
  if (HTML_BASED_LANGUAGES.has(normalized)) {
    return 'html';
  }

  return LANGUAGE_ALIASES[normalized] || normalized;
}

/**
 * SyntaxHighlighter 스타일 variant
 */
export type SyntaxHighlighterVariant = 'default' | 'compact' | 'mobile';

/**
 * SyntaxHighlighter customStyle 생성
 *
 * @param isDark 다크 테마 여부
 * @param variant 스타일 변형 (default: 캔버스/공유, compact: 코드블럭, mobile: 모바일)
 */
export function getSyntaxHighlighterStyle(
  isDark: boolean,
  variant: SyntaxHighlighterVariant = 'default',
): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    margin: 0,
    background: isDark ? '#2b2b2b' : '#fafafa',
  };

  switch (variant) {
    case 'compact':
      return {
        ...baseStyle,
        padding: '5px',
        lineHeight: '18px',
        overflowX: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgb(203 213 225) transparent',
      };
    case 'mobile':
      return {
        ...baseStyle,
        padding: '1rem',
        fontSize: '12px',
        lineHeight: '1.4',
      };
    default:
      return {
        ...baseStyle,
        padding: '1rem',
        fontSize: '14px',
        lineHeight: '1.5',
      };
  }
}
