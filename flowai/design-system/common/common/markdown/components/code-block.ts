/**
 * @file code-block.ts
 * @description 코드 블록 렌더링 헬퍼 함수
 *
 * **책임:**
 * - 코드 블록 및 인라인 코드 HTML 생성
 * - Prism.js 기반 syntax highlighting
 * - Sandpack 실행 지원
 */

import i18next from '@/lib/i18n';
import { i18n } from '@flowai/i18n';
import Prism from 'prismjs';
// 의존성 순서가 중요함! 기본 언어들만 로드 (PHP는 markup-templating 의존성 문제로 제외)
// markup (HTML/XML/SVG)은 prismjs core에 포함되어 있음
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-diff';
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-graphql';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-scala';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-yaml';

import { escapeHtml, safeBase64Encode } from '../utils/common';
import { CODE_BLOCK_STYLES_LIGHT, INLINE_CODE_STYLES, XML_TAG_STYLES } from '../utils/markdown-styles';
import { XML_TAG_BLOCK_LANG_PREFIX } from '../utils/unified-preprocessor';
import { renderMaskingLabel } from './masking-label';

/**
 * Sandpack으로 실행 가능한 언어 목록
 */
const SANDPACK_PREVIEWABLE_LANGUAGES = new Set([
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
 * Markdown 실행 가능 언어 (Dialog에서 렌더링)
 */
const MARKDOWN_PREVIEWABLE_LANGUAGES = new Set(['markdown', 'md']);

/**
 * React 코드 감지용 정규식 패턴
 */
const REACT_CODE_PATTERNS = [
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
 */
function isReactCode(code: string): boolean {
  return REACT_CODE_PATTERNS.some((p) => p.test(code));
}

/**
 * 실행 가능 여부 판단
 */
function isPreviewable(language: string, code: string): { sandpack: boolean; markdown: boolean } {
  const lang = language.toLowerCase();

  const sandpack = SANDPACK_PREVIEWABLE_LANGUAGES.has(lang) || isReactCode(code);
  const markdown = MARKDOWN_PREVIEWABLE_LANGUAGES.has(lang);

  return { sandpack, markdown };
}

/**
 * 언어 별칭 매핑
 * - 키: 사용자가 입력한 언어명
 * - 값: Prism.js에서 사용하는 언어명
 */
const LANGUAGE_ALIAS: Record<string, string> = {
  js: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  tsx: 'tsx',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  yml: 'yaml',
  html: 'markup',
  xml: 'markup',
  md: 'markdown',
  cs: 'csharp',
  plaintext: 'text',
  text: 'text',
};

/**
 * HTML 기반 언어 (하이라이팅은 markup으로, 라벨은 원본 유지)
 * script/style 블록 내부는 JS/CSS로 자동 하이라이팅
 */
const HTML_BASED_LANGUAGES = new Set(['vue', 'svelte']);

// 코드 블록 내 HTML-escape된 마스킹 라벨 패턴 (escapeHtml 이후 매칭용)
const ESCAPED_MASKING_LABEL_PATTERN = /&lt;&lt;([\w가-힣\s/]+-\d+)&gt;&gt;/g;

/**
 * 언어 정규화 (하이라이팅용)
 * - LANGUAGE_ALIAS에 있으면 해당 언어로 변환
 * - HTML_BASED_LANGUAGES에 있으면 markup으로 변환 (Vue, Svelte 등)
 */
function normalizeLanguage(lang: string): string {
  const normalized = lang.toLowerCase();
  if (LANGUAGE_ALIAS[normalized]) {
    return LANGUAGE_ALIAS[normalized];
  }
  if (HTML_BASED_LANGUAGES.has(normalized)) {
    return 'markup';
  }
  return normalized;
}

const getTokenClass = (token: Prism.Token) => {
  const aliases = token.alias ? (Array.isArray(token.alias) ? token.alias : [token.alias]) : [];
  return ['token', token.type, ...aliases].join(' ');
};

// 토큰 콘텐츠를 줄 단위로 분리 & 태그로 감싼다
const renderTokenContentToLines = (content: any): string[] => {
  if (typeof content === 'string') {
    return escapeHtml(content)
      .replace(ESCAPED_MASKING_LABEL_PATTERN, (_, label) => renderMaskingLabel(label))
      .split('\n');
  }

  if (Array.isArray(content)) {
    const lines: string[] = ['']; // 결과 줄 배열 (첫 줄은 빈 문자열로 시작)
    for (const part of content) {
      const partLines = renderTokenContentToLines(part); // 각 조각을 재귀적 변환
      // 1. 현재 줄에 첫 조각 이어붙이기
      if (partLines.length === 0) continue;
      // 2. 나머지 줄을 새로운 줄로 추가
      lines[lines.length - 1] += partLines[0];
      for (let i = 1; i < partLines.length; i += 1) {
        lines.push(partLines[i]);
      }
    }
    return lines;
  }

  const token = content as Prism.Token;
  const innerLines = renderTokenContentToLines(token.content);
  const className = getTokenClass(token);
  return innerLines.map((line) => `<span class="${className}">${line || ' '}</span>`);
};

/**
 * 라인 번호가 있는 코드 HTML 생성 (프리즘 토큰 기반 줄 분리)
 *
 * **개선 사항:**
 * - Prism 토큰 스트림을 줄 단위로 분해하여 라인 래핑 안정성 확보
 * - 멀티라인 토큰도 동일한 스타일로 줄별 래핑
 */
function generateCodeWithLineNumbers(code: string, language: string): string {
  const normalizedLang = normalizeLanguage(language);
  const grammar = Prism.languages[normalizedLang];

  let lines: string[];
  if (!grammar) {
    lines = escapeHtml(code)
      .replace(ESCAPED_MASKING_LABEL_PATTERN, (_, label) => renderMaskingLabel(label))
      .split('\n');
  } else {
    try {
      const prismTokens = Prism.tokenize(code, grammar);
      lines = renderTokenContentToLines(prismTokens);
    } catch {
      lines = escapeHtml(code)
        .replace(ESCAPED_MASKING_LABEL_PATTERN, (_, label) => renderMaskingLabel(label))
        .split('\n');
    }
  }

  // 앞뒤 빈 줄 제거 (코드 시작/끝의 개행)
  while (lines.length > 1 && lines[0] === '') {
    lines.shift();
  }
  while (lines.length > 1 && lines[lines.length - 1] === '') {
    lines.pop();
  }

  // 라인 번호 자릿수 계산 (예: 100줄이면 3자리)
  const lineNumberWidth = String(lines.length).length;

  return lines
    .map((line, index) => {
      const lineNumber = index + 1;
      const paddedLineNumber = String(lineNumber).padStart(lineNumberWidth, ' ');

      return `<span class="code-line"><span class="linenumber">${paddedLineNumber}</span><span class="line-content">${line || ' '}</span></span>`;
    })
    .join('');
}

/**
 * 코드 블록 HTML 생성 (react-syntax-highlighter와 동일한 스타일)
 *
 * @param language - 프로그래밍 언어
 * @param code - 코드 내용
 * @param messageId - 메시지 ID (공유 기능용, 선택사항)
 * @param codeBlockIndex - 코드블럭 인덱스 (메시지 내 순서, 선택사항)
 * @returns HTML 문자열
 */
/**
 * XML 태그 블록 콘텐츠를 마크다운으로 렌더링할 파서 (외부에서 주입)
 * marked-setup.ts에서 setupLightweightMarked 호출 시 marked.parse를 주입
 * 순환 참조 방지: code-block.ts → marked-setup.ts 직접 import 없음
 */
let _markdownParser: ((text: string) => string) | null = null;
const MAX_XML_BLOCK_DEPTH = 3;
let xmlBlockDepth = 0;

/** marked-setup.ts에서 호출하여 마크다운 파서 주입 */
export function setXmlBlockMarkdownParser(parser: (text: string) => string): void {
  _markdownParser = parser;
}

export function renderCodeBlock(language: string, code: string, messageId?: number, codeBlockIndex?: number): string {
  // 사용자 정의 XML 태그 블록: 태그 표시 + 내용을 마크다운으로 렌더링
  if (language.startsWith(XML_TAG_BLOCK_LANG_PREFIX)) {
    const langMeta = language.slice(XML_TAG_BLOCK_LANG_PREFIX.length);
    const gapMatch = langMeta.match(/:gap(\d+)$/);
    const gapCount = gapMatch ? parseInt(gapMatch[1], 10) : 0;
    const tagName = gapMatch ? langMeta.slice(0, -gapMatch[0].length) : langMeta;
    const openTag = `&lt;<span class="${XML_TAG_STYLES.tagName}">${escapeHtml(tagName)}</span>&gt;`;
    const closeTag = `&lt;/<span class="${XML_TAG_STYLES.tagName}">${escapeHtml(tagName)}</span>&gt;`;
    // content 앞뒤 빈 줄 제거 (태그 직후/직전 개행)
    const trimmed = code.replace(/^\n+/, '').replace(/\n+$/, '');
    // escape된 코드 펜스(\`\`\`) 복원 (styleUnknownXmlTags에서 충돌 방지를 위해 escape됨)
    const restored = trimmed.replace(/\\`\\`\\`/g, '```');

    // 콘텐츠를 마크다운으로 렌더링 (depth 제한, 파서 미주입 시 plain text fallback)
    let renderedContent: string;
    if (_markdownParser && xmlBlockDepth < MAX_XML_BLOCK_DEPTH) {
      xmlBlockDepth++;
      try {
        renderedContent = _markdownParser(restored);
      } finally {
        xmlBlockDepth--;
      }
    } else {
      renderedContent = `<pre class="${XML_TAG_STYLES.pre}">${escapeHtml(restored)}</pre>`;
    }

    // 원본 닫는 태그 뒤 빈 줄 수만큼 <br> 추가
    const spacer = '<br>'.repeat(gapCount);
    return (
      `<div class="${XML_TAG_STYLES.block}">` +
      `${openTag}` +
      `<div class="${XML_TAG_STYLES.content}">${renderedContent}</div>` +
      `${closeTag}` +
      `</div>${spacer}`
    );
  }

  const md = i18n.common.markdown;
  const runLabel = i18next.t(`common:${md.run.k}`, md.run.v);
  const shareLabel = i18next.t(`common:${md.share.k}`, md.share.v);
  const copyLabel = i18next.t(`common:${md.copy.k}`, md.copy.v);

  const displayLang = language || 'text';
  const codeWithLineNumbers = generateCodeWithLineNumbers(code, displayLang);

  // data-code 속성에 원본 코드 저장 (복사 버튼용)
  const encodedCode = safeBase64Encode(code);

  // 실행 가능 여부 판단
  const { sandpack, markdown } = isPreviewable(displayLang, code);
  const hasPreview = sandpack || markdown;

  // 테마 토글 버튼 SVG 아이콘 (Moon - 다크모드로 전환)
  const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

  // 실행 버튼 (Sandpack 또는 Markdown)
  const previewButton = hasPreview
    ? `<button type="button" class="streaming-preview-btn ${CODE_BLOCK_STYLES_LIGHT.copyButton}" data-preview-type="${sandpack ? 'sandpack' : 'markdown'}">${escapeHtml(runLabel)}</button>`
    : '';

  // 공유 버튼 (messageId가 있을 때만 표시)
  const shareButton =
    messageId !== undefined
      ? `<button type="button" class="streaming-share-btn ${CODE_BLOCK_STYLES_LIGHT.copyButton}" data-message-id="${messageId}" data-code-block-index="${codeBlockIndex ?? 0}" data-share-language="${escapeHtml(displayLang)}" title="${escapeHtml(shareLabel)}">${escapeHtml(shareLabel)}</button>`
      : '';

  // 에디터에 전송 버튼 (flow-canvas 블록 + embed 모드일 때만)
  const isCanvas = displayLang === 'flow-canvas';
  const isEmbed = typeof window !== 'undefined' && window.parent !== window;
  const pasteToEditorButton = isCanvas && isEmbed
    ? `<button type="button" class="streaming-paste-to-editor-btn ${CODE_BLOCK_STYLES_LIGHT.copyButton}">에디터에 전송</button>`
    : '';

  // 줄 수 기반 접기 여부 결정
  // - 15줄 초과 시 접기 대상
  // - 단, 추가로 보여줄 줄이 5줄 이하면 그냥 펼쳐둠 (16~20줄)
  const lineCount = code.split('\n').length;
  const expandLinesLabel = i18next.t(`common:${md.expand_lines.k}`, md.expand_lines.v, { n: lineCount });
  const COLLAPSE_THRESHOLD = 15;
  const EXPAND_MARGIN = 5;
  const hiddenLines = lineCount - COLLAPSE_THRESHOLD;
  const isCollapsible = hiddenLines > EXPAND_MARGIN;
  const collapsedClass = isCollapsible ? 'code-content-collapsed' : '';
  const toggleButton = isCollapsible
    ? `<button type="button" class="code-expand-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        <span>${escapeHtml(expandLinesLabel)}</span>
      </button>`
    : '';

  return `<div class="${CODE_BLOCK_STYLES_LIGHT.wrapper} streaming-code-block" data-code="${encodedCode}" data-language="${escapeHtml(displayLang)}" data-theme="light">
  <div class="${CODE_BLOCK_STYLES_LIGHT.header}">
    <span class="${CODE_BLOCK_STYLES_LIGHT.languageLabel}">${escapeHtml(displayLang.toUpperCase())}</span>
    <div class="flex items-center gap-0.5">
      <button type="button" class="streaming-theme-btn ${CODE_BLOCK_STYLES_LIGHT.copyButton}" title="${i18next.t('common:markdown.theme_dark')}">${moonIcon}</button>
      ${previewButton}
      ${shareButton}
      ${pasteToEditorButton}
      <button type="button" class="streaming-copy-btn ${CODE_BLOCK_STYLES_LIGHT.copyButton}">${escapeHtml(copyLabel)}</button>
    </div>
  </div>
  <div class="code-content ${collapsedClass}"><pre class="${CODE_BLOCK_STYLES_LIGHT.pre} prism-code language-${normalizeLanguage(displayLang)}" style="${CODE_BLOCK_STYLES_LIGHT.preInlineStyle}"><code>${codeWithLineNumbers}</code></pre></div>
  ${toggleButton}
</div>`;
}

/**
 * 인라인 코드 HTML 생성
 *
 * @param text - 코드 텍스트
 * @returns HTML 문자열
 */
const MASKING_LABEL_PATTERN = /<<([\w가-힣\s/]+-\d+)>>/g;

export function renderInlineCode(text: string): string {
  // 백틱 두 개로 감싸진 경우 백틱 제거 (예: ``code`` → code)
  const cleanedText = text.replace(/^`+|`+$/g, '');

  if (MASKING_LABEL_PATTERN.test(cleanedText)) {
    MASKING_LABEL_PATTERN.lastIndex = 0;
    return cleanedText.replace(MASKING_LABEL_PATTERN, (_, label) => renderMaskingLabel(label));
  }

  return `<code class="${INLINE_CODE_STYLES.wrapper}">${escapeHtml(cleanedText)}</code>`;
}
