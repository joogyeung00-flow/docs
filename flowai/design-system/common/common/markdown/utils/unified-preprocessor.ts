/**
 * @file unified-preprocessor.ts
 * @description 단일 패스 Markdown 전처리 (성능 최적화)
 *
 * **최적화 포인트:**
 * 1. 56개 replace → 단일 정규식 매핑 (Map 기반)
 * 2. 다중 패스 → 단일 패스 통합 처리
 * 3. 스트리밍/완료 분기 처리
 * 4. 문자열 끝 부분만 검사 (스트리밍 최적화)
 * 5. 불완전한 코드블록 처리 (스트리밍 중 임시 닫기)
 *
 * **성능 개선:**
 * - 텍스트 순회: 64회 → 10회 (84% 감소)
 * - 시간 복잡도: O(64n + n²) → O(10n)
 * - Citation 파싱: O(n²) → O(n)
 */

import { escapeHtml, isInsideCodeBlock, parseBalancedLink, safeBase64Encode } from './common';
import { AQ_STYLES, XML_TAG_STYLES } from './markdown-styles';

// ============================================================================
// 1. Unicode 정규화
// ============================================================================

/**
 * Unicode 정규화 매핑 테이블 (56개 replace → Map lookup)
 */
const UNICODE_NORMALIZATION_MAP = new Map<string, string>([
  // 제어/제로위드 문자
  ['\u200B', ''],
  ['\u200C', ''],
  ['\u200D', ''],
  ['\uFEFF', ''],
  ['\u2060', ''],
  ['\u00AD', ''],
  ['\u202A', ''],
  ['\u202B', ''],
  ['\u202C', ''],
  ['\u202D', ''],
  ['\u202E', ''],
  ['\u2066', ''],
  ['\u2067', ''],
  ['\u2068', ''],
  ['\u2069', ''],

  // 비표준 공백
  ['\u00A0', ' '],
  ['\u202F', ' '],
  ['\u2007', ' '],
  ['\u2028', '\n'],
  ['\u2029', '\n'],

  // 전각 기호
  ['\uFF0A', '*'],
  ['\u2217', '*'],
  ['\u204E', '*'],
  ['\u2731', '*'],
  ['\u066D', '*'],
  ['\u00B7', '·'],
  ['\u2027', '·'],
  ['\u2219', '·'],
  ['\u2022', '·'],
  ['\u30FB', '·'],
  ['\u0387', '·'],
  ['\uFF08', '('],
  ['\uFF09', ')'],
  ['\uFF3B', '['],
  ['\uFF3D', ']'],
  ['\uFF0F', '/'],
  ['\uFF1A', ':'],
  ['\uFF0C', ','],
  ['\uFF01', '!'],
  ['\uFF1F', '?'],
  ['\uFF05', '%'],
  ['\uFF1D', '='],
  ['\u2013', '-'],
  ['\u2014', '-'],
  ['\u2212', '-'],
  ['\u2018', "'"],
  ['\u2019', "'"],
  ['\u201C', '"'],
  ['\u201D', '"'],
]);

const UNICODE_PATTERN = new RegExp(
  Array.from(UNICODE_NORMALIZATION_MAP.keys())
    .map((char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`)
    .join('|'),
  'g',
);

function normalizeUnicodeFast(text: string): string {
  return text.replace(UNICODE_PATTERN, (matched) => UNICODE_NORMALIZATION_MAP.get(matched) || matched);
}

// ============================================================================
// 2. LaTeX 수식 구분자 정규화
// ============================================================================

/**
 * LaTeX 수식 구분자를 KaTeX가 인식하는 형태로 변환
 *
 * AI가 출력하는 다양한 수식 구분자를 $ 기반으로 통일:
 * - \[...\] → $$...$$ (블록 수식)
 * - \(...\) → $...$ (인라인 수식, \left( 등 제외)
 * - `\cmd` → $\cmd$ (인라인 코드 안의 LaTeX)
 *
 * 주의:
 * - \left(...\right), \big(...\big) 등은 변환하지 않음
 */
function normalizeLatexDelimiters(text: string): string {
  // 1. \[...\] → $$...$$ (블록 수식)
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, content) => {
    return `$$${content}$$`;
  });

  // 2. \(...\) → $...$ (인라인 수식)
  // 단, \left(, \right), \big(, \Big( 등은 제외
  text = text.replace(
    /(?<!\\(?:left|right|big|Big|bigg|Bigg))\\\(([\s\S]*?)(?<!\\(?:left|right|big|Big|bigg|Bigg))\\\)/g,
    (_, content) => {
      return `$${content}$`;
    },
  );

  // 3. $$ 블록 앞뒤 빈 줄 보장 (마크다운 블록 분리)
  text = text.replace(/([^\n])\n(\$\$)/g, '$1\n\n$2');
  text = text.replace(/(\$\$)\n([^\n$])/g, '$1\n\n$2');

  // 4. 인라인 코드 안의 LaTeX를 인라인 수식으로 변환
  // 예: `\log_{10} x` → $\log_{10} x$
  text = text.replace(/`([^`\n]*\\[a-zA-Z]+[^`\n]*)`/g, (_, content) => {
    return `$${content}$`;
  });

  return text;
}

// ============================================================================
// 3. Bold/따옴표 정규화
// ============================================================================

/**
 * GFM 강조/따옴표 파싱 버그 수정
 */
function normalizeBoldAndQuotes(text: string): string {
  // 코드 펜스 내부의 **를 플레이스홀더로 보호 (bold 변환 방지)
  text = text.replace(/(```[^\n]*\n[\s\S]*?```|~~~[^\n]*\n[\s\S]*?~~~)/g, (match) => match.replace(/\*\*/g, '\uE010'));
  // 인라인 코드 안의 **도 보호
  text = text.replace(/`([^`\n]+)`/g, (match) => match.replace(/\*\*/g, '\uE010'));

  const result = text
    // 이스케이프된 별표 처리 (\\* 또는 \* → *)
    // - 테이블 바로 다음 줄에 \*가 오면 marked.js가 h2(Setext 헤더)로 잘못 파싱함
    // - 줄 시작의 \*는 리스트로도 해석될 수 있음
    // - 따라서 모든 \*를 일반 별표(*)로 치환하여 이스케이프 시퀀스 제거
    .replace(/\\+\*/g, '*')
    // Bold 내부 앞뒤 공백 정리 (줄바꿈 넘어서 매칭 방지)
    .replace(/\*\*\s*([^\*\n]+?)\s*\*\*/g, (_, content) => `**${content.trim()}**`)
    // Bold 닫힘 후 조사/단어가 붙는 경우 공백 추가
    .replace(/([\)\]\}]\*\*)([^\s\*\n])/g, '$1 $2')
    // 따옴표+** 뒤에 텍스트가 붙는 경우: 닫는 bold만 처리
    // - 닫는 bold: 비공백+따옴표+** (예: 텍스트"**에서) → 공백 추가
    // - 여는 bold: 공백/줄시작 뒤 따옴표+** (예: "**어제) → 건드리지 않음
    .replace(/([^\s\n]["'`]\*\*)([^\s\*\n])/g, '$1 $2')
    .replace(/([\)\]\}](?:'|"|"|"|'|'))([^\s\n])/g, '$1 $2')
    // 따옴표 내부 앞뒤 공백 제거 (백틱 제외 — 인라인 코드 깨짐 방지)
    .replace(/(["''""])\s+([^\s'"]{1,30}?)\s+(["''""])/g, '$1$2$3')
    // **(어쩌구)** → strong 태그 처리
    .replace(/\*\*\(([^)]+)\)\*\*/g, '<strong>($1)</strong>')
    // 단일 글자 bold
    .replace(/\*\*([^*])\*\*/g, '<strong>$1</strong>')
    // 여러 글자 bold (줄바꿈 넘어서 매칭 방지)
    .replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');

  // 인라인 코드 안의 ** 플레이스홀더 복원
  return result.replace(/\uE010/g, '**');
}

// ============================================================================
// 3. 코드블록 처리 (스트리밍)
// ============================================================================

/**
 * 코드블록(``` 또는 ~~~) 상태 분석
 * @returns 코드블록 열림 여부와 마지막 열림 위치
 */
function analyzeCodeBlockState(text: string): { isOpen: boolean; lastOpenIndex: number } {
  const lines = text.split('\n');
  let isOpen = false;
  let lastOpenIndex = -1;
  let currentFence: 'backtick' | 'tilde' | null = null;
  let currentCount = 0;
  let currentPos = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const backtickMatch = line.match(/^(`{3,})/);
    const tildeMatch = line.match(/^(~{3,})/);

    if (backtickMatch) {
      const count = backtickMatch[1].length;
      if (isOpen && currentFence === 'backtick' && count >= currentCount) {
        // 닫는 펜스
        isOpen = false;
        currentFence = null;
        currentCount = 0;
      } else if (!isOpen) {
        // 여는 펜스
        isOpen = true;
        currentFence = 'backtick';
        currentCount = count;
        lastOpenIndex = currentPos;
      }
    } else if (tildeMatch) {
      const count = tildeMatch[1].length;
      if (isOpen && currentFence === 'tilde' && count >= currentCount) {
        // 닫는 펜스
        isOpen = false;
        currentFence = null;
        currentCount = 0;
      } else if (!isOpen) {
        // 여는 펜스
        isOpen = true;
        currentFence = 'tilde';
        currentCount = count;
        lastOpenIndex = currentPos;
      }
    }

    currentPos += line.length + 1; // +1 for newline
  }

  return { isOpen, lastOpenIndex };
}

/**
 * 코드블록 닫힘 형식 정규화
 * }``` → }\n``` (marked.js가 제대로 인식하도록)
 *
 * 주의:
 * - 줄 시작의 ```는 여는 펜스이므로 건드리지 않음
 * - ~~~ 틸드 펜스는 처리하지 않음 (~~~~가 분리되는 문제 방지)
 */
function normalizeCodeBlockClosing(text: string): string {
  return text.replace(/([^\n`])```/g, '$1\n```');
}

/**
 * 코드블록 닫힘 후 연속 백틱 또는 텍스트 분리
 *
 * 문제 케이스 1: ```jsx\ncode\n````setCount`로
 * - 3백틱 닫힘(```) 뒤에 바로 인라인 코드(`setCount`)가 붙어서 4백틱(````)이 됨
 * - marked.js가 이를 잘못 파싱하여 코드블록이 닫히지 않는 문제 발생
 *
 * 문제 케이스 2: ```jsx\ncode\n```여기서는
 * - 3백틱 닫힘(```) 뒤에 바로 일반 텍스트가 붙음
 * - 코드블록이 닫히지 않는 문제 발생
 *
 * 해결:
 * - ````setCount` → ```\n`setCount` (3백틱 닫힘 + 인라인 코드)
 * - ```여기서는 → ```\n여기서는 (3백틱 닫힘 + 텍스트)
 * - ````md (4백틱 코드블록 열림) → 건드리지 않음
 *
 * 성능 최적화:
 * - 사전 검사로 ```가 없는 텍스트/줄은 빠르게 스킵
 * - 정규식 사전 컴파일로 루프 내 객체 생성 방지
 */

// 정규식 사전 컴파일 (모듈 로드 시 한 번만)
const RE_CODE_BLOCK_OPEN = /^```[a-zA-Z]/;
const RE_FOUR_PLUS_BACKTICKS = /^`{4,}/;
const RE_FOUR_BACKTICK_CODEBLOCK = /^`{4,}($|[a-zA-Z][a-zA-Z0-9_-]*$)/;
const RE_BACKTICK_SPLIT = /^(```)(`+)(.*)$/;
const RE_TRAILING_TEXT = /^(.*?```)([^`].+)$/;

function splitBackticksAfterCodeBlockClose(text: string): string {
  // 빠른 사전 검사: ```가 없으면 바로 반환
  if (!text.includes('```')) {
    return text;
  }

  const lines = text.split('\n');
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 빠른 사전 검사: ```가 없으면 정규식 검사 스킵
    if (!line.includes('```')) {
      result.push(line);
      continue;
    }

    // 줄 시작이 ```언어명 → 코드블록 열림, 그대로 유지
    if (RE_CODE_BLOCK_OPEN.test(line)) {
      result.push(line);
      continue;
    }

    // 4개 이상 백틱으로 시작하는 경우
    if (RE_FOUR_PLUS_BACKTICKS.test(line)) {
      // 4백틱 코드블록인지 확인:
      // 1) 줄 전체가 4+백틱만 (````)
      // 2) 4+백틱 + 언어명 (````md)
      if (RE_FOUR_BACKTICK_CODEBLOCK.test(line)) {
        // 4백틱 코드블록 → 건드리지 않음
        result.push(line);
        continue;
      }

      // 그 외: 3백틱 닫힘 + 인라인 코드
      // 예: ````setCount` → ``` + `setCount`
      const match = line.match(RE_BACKTICK_SPLIT);
      if (match) {
        result.push(match[1]); // 3백틱 (닫힘)
        result.push(match[2] + match[3]); // 나머지 (인라인 코드 포함)
        continue;
      }
    }

    // ``` 뒤에 백틱이 아닌 텍스트가 있는 경우
    // 예: ```여기서는 → ```\n여기서는
    // 예: }```여기서는 → }\n```\n여기서는
    const trailingTextMatch = line.match(RE_TRAILING_TEXT);
    if (trailingTextMatch) {
      const beforeAndBackticks = trailingTextMatch[1];
      const afterText = trailingTextMatch[2];

      if (beforeAndBackticks === '```') {
        // ```여기서는 → ```\n여기서는
        result.push('```');
        result.push(afterText);
      } else {
        // }```여기서는 → }\n```\n여기서는
        result.push(beforeAndBackticks.slice(0, -3));
        result.push('```');
        result.push(afterText);
      }
      continue;
    }

    result.push(line);
  }

  return result.join('\n');
}

/**
 * 스트리밍 중 불완전한 코드블록 처리
 *
 * - 케이스 1: ```python\ncode... 또는 ~~~xml\ncode... → 임시 닫기 추가
 * - 케이스 2: ```pyt 또는 ~~~x → 제거 (언어 지정자 불완전)
 * - 케이스 3: `` 또는 ` 또는 ~~ 또는 ~ → 제거 (펜스 불완전)
 * - 케이스 4: 코드블록 내 <aq> 등 커스텀 태그 → 태그 앞에서 닫기
 *
 * 주의: 줄바꿈 없는 닫힘 정규화(}``` → }\n```)는 Phase 5.4에서 스트리밍/완료 공통으로 처리됨
 */
function handleIncompleteCodeBlock(text: string): string {
  // 참고: 코드블록 닫힘 정규화와 연속 백틱 분리는 Phase 5.4, 5.5에서 공통 처리됨
  // - Phase 5.4: normalizeCodeBlockClosing (줄바꿈 없는 닫힘)
  // - Phase 5.5: splitBackticksAfterCodeBlockClose (연속 백틱 분리)

  // 케이스 3: 끝에 불완전한 펜스 제거 (백틱 또는 틸드)
  const trailingBackticks = text.match(/`{1,2}$/);
  const trailingTildes = text.match(/~{1,2}$/);

  if (trailingBackticks && !text.match(/```[^\n]*$/)) {
    text = text.slice(0, -trailingBackticks[0].length);
  }
  if (trailingTildes && !text.match(/~~~[^\n]*$/)) {
    text = text.slice(0, -trailingTildes[0].length);
  }

  const { isOpen, lastOpenIndex } = analyzeCodeBlockState(text);

  if (!isOpen) {
    return text;
  }

  // 케이스 2: 언어 지정자 불완전 (줄바꿈 없음)
  const afterOpening = text.slice(lastOpenIndex);
  if (!afterOpening.includes('\n')) {
    return text.slice(0, lastOpenIndex);
  }

  // 케이스 4: 코드블록 내 커스텀 태그(<aq>, <vr>, <fs>) → 태그 앞에서 닫기
  // 주의: 여는 태그만 감지 (닫는 태그는 제외)
  // 단, XML/HTML 예제 코드 블록은 예외 처리 (태그가 정상 콘텐츠)
  const openingLine = text.slice(lastOpenIndex).split('\n')[0];
  const languageMatch = openingLine.match(/^(?:```|~~~)(\w+)/);
  const language = languageMatch ? languageMatch[1].toLowerCase() : '';
  const isMarkupLanguage = ['xml', 'html', 'svg', 'xhtml'].includes(language);

  if (!isMarkupLanguage) {
    const codeBlockContent = text.slice(lastOpenIndex);
    const customTagMatch = codeBlockContent.match(/\n(<(?:aq|vr|fs|ws|at|citation-group)[\s>])/);
    if (customTagMatch && customTagMatch.index !== undefined) {
      const absoluteTagStart = lastOpenIndex + customTagMatch.index;
      const beforeTag = text.slice(0, absoluteTagStart);
      const afterTag = text.slice(absoluteTagStart + 1);
      const needsNewline = !beforeTag.endsWith('\n');

      // 여는 펜스 타입 확인 (백틱 또는 틸드)
      const closingFence = openingLine.startsWith('~~~') ? '~~~' : '```';

      return beforeTag + (needsNewline ? '\n' : '') + closingFence + '\n' + afterTag;
    }
  }

  // 케이스 1: 정상적인 열림 → 그대로 두기 (임시 닫기 제거)
  // Marked.js가 열린 코드블록을 자동으로 처리함
  // 스트리밍 중에도 코드블록 스타일이 유지되어 깜빡임 없음
  return text;
}

/** 사전 컴파일된 연속 레퍼런스 태그 패턴 (태그별 2개씩, 매 호출마다 new RegExp 방지) */
const CONSECUTIVE_TAG_PATTERNS = {
  ws: {
    consecutive: new RegExp(`(<ws\\s+[^>]*(?:\\/>|><\\/ws>))([ \\t\\n]*<ws\\s+[^>]*(?:\\/>|><\\/ws>))+`, 'g'),
    individual: new RegExp(`<ws\\s+[^>]*(?:\\/>|><\\/ws>)`, 'g'),
  },
  fs: {
    consecutive: new RegExp(`(<fs\\s+[^>]*(?:\\/>|><\\/fs>))([ \\t\\n]*<fs\\s+[^>]*(?:\\/>|><\\/fs>))+`, 'g'),
    individual: new RegExp(`<fs\\s+[^>]*(?:\\/>|><\\/fs>)`, 'g'),
  },
  vr: {
    consecutive: new RegExp(`(<vr\\s+[^>]*(?:\\/>|><\\/vr>))([ \\t\\n]*<vr\\s+[^>]*(?:\\/>|><\\/vr>))+`, 'g'),
    individual: new RegExp(`<vr\\s+[^>]*(?:\\/>|><\\/vr>)`, 'g'),
  },
} as const;

/** 연속된 레퍼런스 태그(ws, fs, vr)를 그룹으로 묶기 */
function groupConsecutiveReferenceTags(text: string, tagName: 'ws' | 'fs' | 'vr'): string {
  const patterns = CONSECUTIVE_TAG_PATTERNS[tagName];

  // g 플래그 regex는 lastIndex를 유지하므로 재사용 전 리셋 필수
  patterns.consecutive.lastIndex = 0;

  return text.replace(patterns.consecutive, (match) => {
    const tags: string[] = [];
    let tagMatch: RegExpExecArray | null;
    patterns.individual.lastIndex = 0;

    while ((tagMatch = patterns.individual.exec(match)) !== null) {
      tags.push(tagMatch[0]);
    }

    if (tags.length >= 2) {
      return `<${tagName}-group>${tags.join('')}</${tagName}-group>`;
    }

    return match;
  });
}

/** 모든 레퍼런스 태그 그룹화 (ws, fs, vr) */
function groupAllConsecutiveReferenceTags(text: string): string {
  let result = text;
  result = groupConsecutiveReferenceTags(result, 'ws');
  result = groupConsecutiveReferenceTags(result, 'fs');
  result = groupConsecutiveReferenceTags(result, 'vr');
  return result;
}

/** 레퍼런스 태그 뒤 개행 정규화 */
function ensureNewlineAfterReferenceTags(text: string): string {
  // 그룹 내부의 태그는 건드리지 않음 (그룹화 이후 실행되므로 주의)
  // 그룹 닫는 태그 뒤에만 개행 추가
  return text
    .replace(
      /(<(?:ws|fs|vr)(?:\s[^>]*)?\/>|<(?:ws|fs|vr)(?:\s[^>]*)?>(?:<\/(?:ws|fs|vr)>)?)[ \t]*\n+(?=[^\s\n])/g,
      '$1\n',
    )
    .replace(/(<\/(?:ws|fs|vr)-group>)[ \t]*\n(?!\n)(?=[^\s\n])/g, '$1\n');
}

/**
 * 불완전한 커스텀 태그 제거 (fs, ws, vr)
 * 문자열 전체에서 불완전한 태그를 찾아 제거
 *
 * 완전한 태그 형식:
 * - <fs ... /> (self-closing)
 * - <fs ...></fs> (paired)
 * - <fs-group>...</fs-group> (group)
 *
 * 불완전한 태그:
 * - <fs title="... (닫히지 않음)
 * - <fs (속성 없이 불완전)
 */
function removeAllIncompleteCustomTags(text: string): string {
  // fs, ws, vr 태그 순서대로 처리
  const tagNames = ['fs', 'ws', 'vr'];

  for (const tagName of tagNames) {
    // 그룹 태그는 건드리지 않음 (fs-group, ws-group, vr-group)
    const tagPattern = new RegExp(`<${tagName}(?!-group)\\s`, 'g');
    let match;
    const indicesToRemove: Array<{ start: number; end: number }> = [];

    while ((match = tagPattern.exec(text)) !== null) {
      const tagStart = match.index;

      // 태그가 완전한지 확인
      let isComplete = false;
      let inQuote = false;
      let quoteChar = '';

      for (let i = tagStart + tagName.length + 1; i < text.length; i++) {
        const char = text[i];
        const prevChar = i > 0 ? text[i - 1] : '';

        // 따옴표 상태 추적 (큰따옴표 + 작은따옴표, 이스케이프 제외)
        if ((char === '"' || char === "'") && prevChar !== '\\') {
          if (!inQuote) {
            inQuote = true;
            quoteChar = char;
          } else if (char === quoteChar) {
            inQuote = false;
            quoteChar = '';
          }
          continue;
        }

        // 따옴표 밖에서만 태그 끝 검사
        if (!inQuote) {
          // self-closing: />
          if (char === '>' && prevChar === '/') {
            isComplete = true;
            break;
          }
          // paired: ></fs> 또는 ></ws> 또는 ></vr>
          if (char === '>') {
            // >< 다음에 /tagName>이 오는지 확인
            const remaining = text.slice(i);
            const closingPattern = new RegExp(`^><\\/${tagName}>`);
            if (closingPattern.test(remaining)) {
              isComplete = true;
              break;
            }
            // 그냥 >로 끝나는 경우 (</tagName> 없이) - 불완전
            break;
          }
          // 새로운 < 발견 - 현재 태그는 불완전
          if (char === '<') {
            break;
          }
        }
      }

      if (!isComplete) {
        // 태그 끝을 찾음 (다음 < 또는 문자열 끝)
        let removeEnd = text.length;
        inQuote = false; // 중요: 새 루프 시작 전 초기화
        quoteChar = '';
        for (let i = tagStart + 1; i < text.length; i++) {
          const char = text[i];
          const prevChar = i > 0 ? text[i - 1] : '';

          // 따옴표 상태 추적 (큰따옴표 + 작은따옴표)
          if ((char === '"' || char === "'") && prevChar !== '\\') {
            if (!inQuote) {
              inQuote = true;
              quoteChar = char;
            } else if (char === quoteChar) {
              inQuote = false;
              quoteChar = '';
            }
            continue;
          }

          if (!inQuote && char === '<') {
            removeEnd = i;
            break;
          }
        }
        indicesToRemove.push({ start: tagStart, end: removeEnd });
      }
    }

    // 뒤에서부터 제거 (인덱스 변경 방지)
    for (let i = indicesToRemove.length - 1; i >= 0; i--) {
      const { start, end } = indicesToRemove[i];
      text = text.slice(0, start) + text.slice(end);
    }
  }

  return text;
}

/**
 * 불완전한 마크다운 링크 제거 (괄호 균형 고려)
 *
 * 주의: 마크다운 링크 형식 [text](url)만 대상으로 함
 * 일반 대괄호 텍스트 [QA], [2025] 등은 제거하지 않음
 *
 * 마크다운 링크의 조건:
 * 1. [text] 형태가 있고
 * 2. 바로 뒤에 (가 와야 함
 *
 * 불완전한 마크다운 링크 예시:
 * - [링크텍스트](https://... ← URL이 완성되지 않음
 * - [링크텍스트]( ← ( 뒤가 비어있음
 * - [링크텍스트 ← ] 없음
 */
function removeIncompleteLink(text: string): string {
  // 끝에서부터 마크다운 링크 패턴 찾기
  // 마크다운 링크: [text](url) 형식
  // 불완전한 링크: [text]( 또는 [text](url 형태로 끝나는 경우

  // 1. 마지막 [ 위치 찾기
  let searchStart = text.length - 1;

  while (searchStart >= 0) {
    const openBracket = text.lastIndexOf('[', searchStart);
    if (openBracket === -1) return text;

    // 2. 이 [가 마크다운 링크의 시작인지 확인
    //    마크다운 링크 = [text](url) 형태
    //    즉, [이후에 ]가 있고, 그 바로 뒤에 (가 있어야 함

    // [ 이후의 ] 찾기
    let closeBracket = openBracket + 1;
    while (closeBracket < text.length && text[closeBracket] !== ']') {
      closeBracket++;
    }

    // ] 찾았고, 그 다음이 ( 인지 확인
    if (closeBracket < text.length && closeBracket + 1 < text.length && text[closeBracket + 1] === '(') {
      // 마크다운 링크 패턴임! [text]( 형태 확인됨
      // 이제 parseBalancedLink로 완전성 검사
      const parsed = parseBalancedLink(text, openBracket);
      if (!parsed) {
        // 불완전한 마크다운 링크 → 제거
        return text.slice(0, openBracket);
      }
      // 완전한 링크면 그대로 반환
      return text;
    }

    // 이 [는 마크다운 링크가 아님 (예: [QA], [2025])
    // 이전 [를 찾아봄
    searchStart = openBracket - 1;
  }

  return text;
}

/**
 * Citation 그룹 처리 (괄호 균형 고려)
 * 연속된 링크들 (쉼표로 구분)을 citation-group 태그로 변환
 */
function processCitationGroups(text: string): string {
  const segments: string[] = [];
  let i = 0;
  let lastEnd = 0;

  while (i < text.length) {
    if (text[i] === '[') {
      const link = parseBalancedLink(text, i);
      if (link) {
        const citations: string[] = [link.raw];
        let groupEnd = link.end;

        // 연속된 링크들 찾기 (쉼표로 구분)
        while (groupEnd < text.length) {
          let j = groupEnd;
          while (j < text.length && (text[j] === ' ' || text[j] === '\t')) j++;
          if (text[j] !== ',') break;
          j++;
          while (j < text.length && (text[j] === ' ' || text[j] === '\t')) j++;

          if (text[j] === '[') {
            const nextLink = parseBalancedLink(text, j);
            if (nextLink) {
              citations.push(nextLink.raw);
              groupEnd = nextLink.end;
            } else {
              break;
            }
          } else {
            break;
          }
        }

        // 2개 이상인 경우에만 citation-group으로 변환
        if (citations.length > 1) {
          segments.push(text.slice(lastEnd, i));

          const firstCitation = citations[0];
          const remainingCount = citations.length - 1;
          const content = citations.join(', ');

          const encodedContent = safeBase64Encode(content);
          const encodedFirst = safeBase64Encode(firstCitation);
          segments.push(
            `<citation-group data-citations='${encodedContent}' data-first='${encodedFirst}' data-count='${remainingCount}' data-encoding='base64'></citation-group>`,
          );

          lastEnd = groupEnd;
          i = groupEnd;
          continue;
        }

        i = link.end;
        continue;
      }
    }
    i++;
  }

  segments.push(text.slice(lastEnd));
  return segments.join('');
}

// ============================================================================
// 4.5. 사용자 정의 XML 태그 → 태그명 하이라이트
// ============================================================================

/**
 * 시스템/HTML 태그가 아닌 사용자 정의 XML 태그의 태그명을 빨간색으로 하이라이트
 *
 * marked.js는 알 수 없는 HTML 태그를 HTML 블록으로 인식하여
 * 내부 마크다운(**볼드** 등)이 파싱되지 않음.
 * 태그를 escape하여 HTML 블록 인식을 방지하고, 태그명만 빨간색으로 표시.
 *
 * 예: <role_and_mission> → &lt;<span style="color:#e53e3e">role_and_mission</span>&gt;
 */
const KNOWN_HTML_TAGS =
  /^(?:a|abbr|address|area|article|aside|audio|b|base|bdi|bdo|blockquote|body|br|button|canvas|caption|cite|code|col|colgroup|data|datalist|dd|del|details|dfn|dialog|div|dl|dt|em|embed|fieldset|figcaption|figure|footer|form|h[1-6]|head|header|hgroup|hr|html|i|iframe|img|input|ins|kbd|label|legend|li|link|main|map|mark|math|menu|meta|meter|nav|noscript|object|ol|optgroup|option|output|p|param|picture|pre|progress|q|rp|rt|ruby|s|samp|script|section|select|slot|small|source|span|strong|style|sub|summary|sup|svg|table|tbody|td|template|textarea|tfoot|th|thead|time|title|tr|track|u|ul|var|video|wbr|path|g|rect|circle|line|polyline|polygon|ellipse|text|defs|use|symbol|clippath|mask|pattern|image|foreignobject|animate|animatetransform)$/i;

const SYSTEM_CUSTOM_TAGS = /^(?:aq|aq-ul|aq-h2|aq-li|vr|vr-group|ws|ws-group|fs|fs-group|citation-group|at)$/i;

function renderStyledTag(tagName: string, isClosing: boolean): string {
  const prefix = isClosing ? '&lt;/' : '&lt;';
  return `${prefix}<span data-from="aq" class="${XML_TAG_STYLES.tagName}">${escapeHtml(tagName)}</span>&gt;`;
}

/** 사용자 정의 XML 태그 블록용 코드 펜스 언어 접두사 */
export const XML_TAG_BLOCK_LANG_PREFIX = 'xml-tag-block:';

/**
 * 코드 펜스(``` 또는 ~~~) 보호 범위 수집
 * 닫힌 코드 펜스뿐 아니라 스트리밍 중 열린(닫히지 않은) 코드 펜스도 포함하여
 * 내부 XML 태그가 변환되지 않도록 보호합니다.
 */
function collectCodeFenceRanges(text: string): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];

  // 1. 닫힌 코드 펜스 수집 (기존 로직)
  const fenceRe = /^(`{3,})[^\n]*\n[\s\S]*?^\1\s*$/gm;
  let fm;
  while ((fm = fenceRe.exec(text)) !== null) {
    ranges.push({ start: fm.index, end: fm.index + fm[0].length });
  }

  // 2. 열린(닫히지 않은) 코드 펜스 수집 (스트리밍 중 보호)
  const { isOpen, lastOpenIndex } = analyzeCodeBlockState(text);
  if (isOpen && lastOpenIndex >= 0) {
    ranges.push({ start: lastOpenIndex, end: text.length });
  }

  return ranges;
}

function styleUnknownXmlTags(text: string): string {
  // 1단계: 쌍으로 된 태그 처리 (<tag>내용</tag>)
  // 코드 펜스로 감싸서 marked.js 파싱 완전 차단 + 특별 언어명으로 심플 렌더링
  // 먼저 코드 펜스 영역을 수집하여 보호 (코드 블록 안의 XML 태그는 변환하지 않음)
  {
    const protectedRanges = collectCodeFenceRanges(text);

    text = text.replace(
      /<([a-zA-Z][a-zA-Z0-9_-]*)(?:\s[^>]*)?>([\s\S]*?)<\/\1>(\n*)/g,
      (_match: string, tagName: string, content: string, trailingNewlines: string, offset: number) => {
        if (KNOWN_HTML_TAGS.test(tagName) || SYSTEM_CUSTOM_TAGS.test(tagName)) {
          return _match;
        }
        // 코드 펜스 안이면 변환하지 않음
        if (protectedRanges.some((r) => offset >= r.start && offset < r.end)) {
          return _match;
        }
        // content 안의 ``` 를 escape하여 코드 펜스 충돌 방지
        const safeContent = content.replace(/```/g, '\\`\\`\\`');
        // 닫는 태그 뒤 빈 줄 수를 언어명에 인코딩 (renderCodeBlock에서 spacer 추가용)
        const blankLines = Math.max(0, trailingNewlines.length - 1);
        const gapSuffix = blankLines > 0 ? `:gap${blankLines}` : '';
        // 코드 펜스 뒤에 빈 줄 보장 (다음 코드 펜스와 합쳐지는 것 방지)
        return `\n\`\`\`${XML_TAG_BLOCK_LANG_PREFIX}${tagName}${gapSuffix}\n${safeContent}\n\`\`\`\n\n`;
      },
    );
  }

  // 2단계: 짝 없는 단독 태그 처리 (<tag> 또는 </tag>)
  // 태그만 인라인으로 치환, 개행 구조는 원본 그대로 유지
  // 주의: 인라인 코드(`...`) 및 코드 펜스(```) 안의 태그는 변환하지 않음
  {
    // 코드 펜스 영역 위치 수집 (열린 코드 펜스 포함)
    const protectedPositions = collectCodeFenceRanges(text);

    // 인라인 코드 영역 위치 수집
    const icRe = /`[^`\n]+`/g;
    let icMatch;
    while ((icMatch = icRe.exec(text)) !== null) {
      protectedPositions.push({ start: icMatch.index, end: icMatch.index + icMatch[0].length });
    }

    text = text.replace(
      /<(\/?([a-zA-Z][a-zA-Z0-9_-]*))[^>]*>/g,
      (match, inner: string, tagName: string, offset: number) => {
        if (KNOWN_HTML_TAGS.test(tagName) || SYSTEM_CUSTOM_TAGS.test(tagName)) {
          return match;
        }
        // 코드 펜스 또는 인라인 코드 안이면 변환하지 않음
        if (protectedPositions.some((pos) => offset >= pos.start && offset < pos.end)) {
          return match;
        }
        return renderStyledTag(tagName, inner.startsWith('/'));
      },
    );
  }

  return text;
}

// ============================================================================
// 5. 메인 전처리 함수
// ============================================================================

/**
 * 통합 전처리 함수 (단일 패스)
 *
 * **처리 순서:**
 * 1. Unicode 정규화 (Map 기반)
 * 2. Bold/따옴표 정규화
 * 3. 커스텀 태그 보정 (완료 시에만)
 * 4. AQ 태그 → HTML 변환 (스트리밍 중에만)
 * 5. Citation 그룹 처리
 * 6. 불완전한 요소 제거 (스트리밍 중에만)
 *
 * @param text - 전처리할 Markdown 텍스트
 * @param isStreaming - 스트리밍 중인지 여부
 * @returns 전처리된 텍스트
 */
export function unifiedPreprocess(text: string, isStreaming = true): string {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return '';
  }

  // Phase 0: 사용자 정의 XML 태그를 인라인 코드 스타일로 변환
  // <role_and_mission> 같은 알 수 없는 태그는 marked.js가 HTML 블록으로 인식하여
  // 내부 마크다운이 파싱되지 않음. 태그 자체만 코드 스타일로 표시하고 내부 내용은 일반 텍스트로 유지
  let result = styleUnknownXmlTags(text);

  // Phase 1: Unicode 정규화
  result = normalizeUnicodeFast(result);

  // Phase 1.5: LaTeX 수식 구분자 정규화
  // \[...\], \(...\) 및 백슬래시 누락된 [...], (...) → $, $$ 형식으로 변환
  result = normalizeLatexDelimiters(result);

  // Phase 2: Bold/따옴표 정규화
  result = normalizeBoldAndQuotes(result);

  // ===== Phase 2.3: 인라인 코드 안의 연속 물결 보호 =====
  // 문제: `그룹~~~~`에서 ~~~~가 GFM 취소선(~~)으로 잘못 파싱됨
  // 해결: 인라인 코드 안의 ~~를 임시 플레이스홀더로 변환 후 나중에 복원
  // 패턴: `...~~...` 형태에서 ~~를 \uE000\uE000로 임시 변환
  result = result.replace(/`([^`\n]+)`/g, (match, content) => {
    // 인라인 코드 내용 안의 ~~를 플레이스홀더로 변환
    const protected_content = content.replace(/~~/g, '\uE000\uE000');
    return '`' + protected_content + '`';
  });

  // ===== Phase 2.4: 이스케이프된 커스텀 태그 정규화 =====
  // \<vr>, \<ws>, \<fs>, \<at> → <vr>, <ws>, <fs>, <at>
  // 마크다운 이스케이프를 제거하여 커스텀 태그가 정상적으로 파싱되도록 함
  result = result.replace(/\\<(vr|ws|fs|at|citation-group)\b/gi, '<$1');

  // ===== Phase 2.42: 별도 줄 레퍼런스 태그를 이전 줄 끝으로 합침 =====
  // LLM이 <fs>, <ws>, <vr> 태그를 줄바꿈 후 별도 줄에 배치하면
  // marked.js가 블록으로 인식하여 리스트 구조가 깨짐.
  // 이전 줄에 텍스트가 있으면 태그를 이전 줄 끝으로 올려붙임.
  // 예: "...공유하셨어요.\n     <fs id="123" type="chat" />" → "...공유하셨어요. <fs id="123" type="chat" />"
  result = result.replace(/([^\n])\n[ \t]+(<(?:vr|ws|fs)\s+[^>]*\/>)/g, '$1 $2');

  // ===== Phase 2.44: 줄 선두 레퍼런스 태그(<vr>, <ws>, <fs>) 블록 HTML 방지 =====
  // marked 블록 파서가 줄 시작의 "<vr|ws|fs ... />"를 html 블록으로 먹어서 인라인으로 안 넘어감
  // 줄 시작(개행 직후)의 <vr|ws|fs 앞에 보호 문자(\uE000) 삽입 → 인라인 확장에서만 토큰화되도록 함
  result = result.replace(/\n(\s*)<(vr|ws|fs)\s/g, '\n$1\uE000<$2 ');

  // ===== Phase 2.5: 연속된 레퍼런스 태그 그룹화 =====
  // 공백/개행으로 구분된 연속 ws, fs, vr 태그를 각각 *-group으로 래핑
  // 중요: Phase 3 (self-closing → 닫는 태그 변환) 이전에 실행해야 함
  result = groupAllConsecutiveReferenceTags(result);

  // ===== Phase 2.6: 레퍼런스 태그 뒤 개행 보장 =====
  // 레퍼런스 태그 뒤에 바로 텍스트가 붙어있으면 개행 추가
  // 중요: Phase 3 이전에 실행 (self-closing 형태 기준으로 패턴 매칭)
  // TODO : blockquote 깨짐 이슈로 임시로 주석 처리 (연관 업무: https://flow.team/l/1KQfg)
  result = ensureNewlineAfterReferenceTags(result);

  // ===== Phase 2.7: blockquote 앞 빈 줄 보장 =====
  // 문제1: blockquote가 li 안으로 들어가는 문제 방지
  // ㄴ "- 항목\n> quote" → "- 항목\n\n> quote"
  // 문제2: 연속 blockquote 개행 생기는 문제 방지
  // ㄴ "> 첫번째줄\n> 두번째줄" → (개행 예외 조건)
  result = result.replace(/(?<!>.*)\n(>[^\n])/g, '\n\n$1');

  // ===== Phase 2.71: 리스트 아이템 앞 줄바꿈 보장 =====
  // 문제: LLM이 리스트 아이템을 줄바꿈 없이 이어붙이는 경우
  // ㄴ 정상: "- "첫번째"\n- "두번째""
  // ㄴ 비정상: "- "첫번째"-"두번째"" (닫는 따옴표 뒤에 바로 -" 가 옴)
  // 해결: 닫는 따옴표 뒤에 "-"가 오면 줄바꿈 + 공백 추가 (리스트 문법)
  // 패턴: 닫는 따옴표(", ", ') 뒤에 "-"가 오면 "\n- "로 변환
  // 예: "첫번째"-"두번째" → "첫번째"\n- "두번째"
  // 주의: 코드 블록 내부에서는 적용하지 않음 (case "-": 같은 코드가 깨짐)
  // 개선: 코드 블록을 완전히 제외하고 정규식 적용
  const codeBlockPattern = /(```[^\n]*\n[\s\S]*?```|~~~[^\n]*\n[\s\S]*?~~~)/g;
  const codeBlockRanges: Array<{ start: number; end: number }> = [];
  let match;

  // 코드 블록 위치 저장 (start 기준 오름차순 — regex 매칭 순서로 보장)
  while ((match = codeBlockPattern.exec(result)) !== null) {
    codeBlockRanges.push({
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  // 코드 블록 + 인라인 코드 외부에서만 정규식 적용
  const excludedRegions: Array<{ start: number; end: number }> = [];

  // 1. 코드 블록 추가
  for (const cb of codeBlockRanges) {
    excludedRegions.push(cb);
  }

  // 2. 인라인 코드 찾기 (코드 블록 외부에서만)
  // 패턴: `code` 또는 ``code`` (백틱으로 감싼 부분)
  const inlineCodeRegex = /`+[^`\n]+`+/g;
  let inlineMatch;
  while ((inlineMatch = inlineCodeRegex.exec(result)) !== null) {
    const start = inlineMatch.index;
    const end = start + inlineMatch[0].length;

    // 이 인라인 코드가 코드 블록 내부에 있는지 확인 — O(log k) 이진 탐색
    if (!isInsideCodeBlock(codeBlockRanges, start)) {
      excludedRegions.push({ start, end });
    }
  }

  // 3. start 순으로 정렬
  excludedRegions.sort((a, b) => a.start - b.start);

  // 4. 제외된 영역(코드 블록 + 인라인 코드) 외부에서만 정규식 적용
  if (excludedRegions.length === 0) {
    // 제외할 영역이 없으면 전체에 적용
    result = result.replace(/([""'])(-)([""])/g, '$1\n- $3');
  } else {
    let processed = '';
    let lastIndex = 0;

    for (const region of excludedRegions) {
      // 제외된 영역 이전 부분 처리
      const before = result.slice(lastIndex, region.start);
      processed += before.replace(/([""'])(-)([""])/g, '$1\n- $3');
      // 제외된 영역은 그대로 유지
      processed += result.slice(region.start, region.end);
      lastIndex = region.end;
    }

    // 마지막 제외된 영역 이후 부분 처리
    const after = result.slice(lastIndex);
    processed += after.replace(/([""'])(-)([""])/g, '$1\n- $3');
    result = processed;
  }

  // ===== Phase 2.75: 헤딩 뒤 틸드 펜스 앞 빈 줄 보장 =====
  // 문제: "## 제목\n~~~xml" → Marked.js가 틸드 펜스를 인식하지 못함
  // 해결: "## 제목\n\n~~~xml" → 빈 줄 추가
  result = result.replace(/(^#{1,6}\s+.+)\n(~~~)/gm, '$1\n\n$2');

  // ===== Phase 2.8: 커스텀 태그 뒤 --- (Setext 헤더 방지) =====
  // 문제1: 커스텀 태그 뒤 --- 가 Setext h2로 잘못 파싱되는 문제 방지
  // ㄴ "문장1 <ws title=\"링크1\"/>\n---\n문장2" → "문장1 <ws title=\"링크1\"/>\n\n---\n문장2"
  // 문제2: 닫는 태그 뒤 --- 도 동일
  // ㄴ "</vr></vr>\n---" → "</vr></vr>\n\n---"
  result = result.replace(/(<\/?(?:ws|fs|vr)[^>]*>)\n(---+)/gi, '$1\n\n$2');

  // Phase 3: 커스텀 태그 보정 (완료 시에만)
  if (!isStreaming) {
    // fs, ws는 ReactMarkdown/rehypeRaw 호환을 위해 self-closing → paired 변환.
    // vr은 marked 확장이 self-closing( \s*\/> )만 토큰화하므로 변환하지 않음. 변환 시 14개 → 4개로 누락됨.
    result = result.replace(/<fs\b([^>]*)\/>/gi, '<fs$1></fs>');
    result = result.replace(/<ws\b([^>]*)\/>/gi, '<ws$1></ws>');

    // LLM이 self-closing 없이 <fs ...>, <vr ...>, <ws ...>로 출력하는 경우 처리
    // <fs title="..." ...> → <fs title="..." ...></fs>
    // 이미 </fs>가 있는 경우는 제외 (negative lookahead)
    result = result.replace(/<fs\b([^>]*[^/])>(?![\s\S]*<\/fs>)/gi, '<fs$1></fs>');
    result = result.replace(/<vr\b([^>]*[^/])>(?![\s\S]*<\/vr>)/gi, '<vr$1></vr>');
    result = result.replace(/<ws\b([^>]*[^/])>(?![\s\S]*<\/ws>)/gi, '<ws$1></ws>');
  }

  // Phase 4: AQ 태그 → HTML 변환 (스트리밍 중에만)
  // data-from="aq" 속성을 추가하여 html 렌더러에서 허용된 변환임을 표시
  if (isStreaming) {
    result = result
      .replace(/<aq>/g, `<div data-from="aq" class="${AQ_STYLES.container}">`)
      .replace(/<\/aq>/g, '</div>')
      .replace(
        /<aq-h2>([^<]*)<\/aq-h2>/g,
        (_, content) =>
          `<h2 data-from="aq" class="${AQ_STYLES.header}">` +
          '<svg data-from="aq" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list-plus h-4 w-4" aria-hidden="true">' +
          '<path d="M11 12H3"/><path d="M16 6H3"/><path d="M16 18H3"/><path d="M18 9v6"/><path d="M21 12h-6"/>' +
          '</svg>' +
          ` ${content.trim()}` +
          '</h2>',
      )
      .replace(/<aq-ul>/g, `<ul data-from="aq" class="${AQ_STYLES.list}">`)
      .replace(/<\/aq-ul>/g, '</ul>')
      .replace(/<aq-li>(.*?)<\/aq-li>/g, (_, content) => {
        const questionText = content.trim();
        return (
          `<li data-from="aq" class="${AQ_STYLES.listItem}" data-question="${escapeHtml(questionText)}">` +
          `<span data-from="aq" class="${AQ_STYLES.listItemText}">` +
          escapeHtml(questionText) +
          '</span>' +
          `<svg data-from="aq" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right ${AQ_STYLES.listItemIcon}" aria-hidden="true">` +
          '<path d="m9 18 6-6-6-6"/>' +
          '</svg>' +
          '</li>'
        );
      });
  }

  // Phase 5: Citation 그룹 처리
  result = processCitationGroups(result);

  // ===== Phase 5.4: 코드블록 닫힘 정규화 (스트리밍/완료 공통) =====
  // )``` → )\n``` (줄바꿈 없이 백틱 앞에 문자가 붙은 경우)
  // marked.js와 ReactMarkdown 모두에서 필요
  result = normalizeCodeBlockClosing(result);

  // ===== Phase 5.5: 코드블록 닫힘 후 연속 백틱 분리 (스트리밍/완료 공통) =====
  // ````setCount` → ```\n`setCount` (3백틱 닫힘 + 인라인 코드)
  // marked.js와 ReactMarkdown 모두에서 필요
  result = splitBackticksAfterCodeBlockClose(result);

  // Phase 6: 불완전한 요소 제거 (스트리밍 중에만)
  if (isStreaming) {
    // VR/FS/WS 태그 불완전 제거 (문자열 전체에서 검사)
    result = removeAllIncompleteCustomTags(result);

    // 마크다운 링크 불완전 제거 (괄호 균형 고려)
    result = removeIncompleteLink(result);
    // 코드블록 처리 (임시 닫기 또는 제거)
    result = handleIncompleteCodeBlock(result);
  }

  // ===== 최종: 인라인 코드 안의 물결 플레이스홀더 복원 =====
  // Phase 2.3에서 보호한 ~~를 원래대로 복원
  result = result.replace(/\uE000\uE000/g, '~~');

  return result;
}
