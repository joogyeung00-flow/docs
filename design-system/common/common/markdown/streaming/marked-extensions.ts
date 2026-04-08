/**
 * @file marked-extensions.ts
 * @description Marked.js 커스텀 확장 (VR, WS, Citation-group)
 *
 * **역할:**
 * - 커스텀 태그를 Marked.js 토큰으로 인식
 * - HTML로 직접 렌더링 (React 컴포넌트 없음)
 * - 스트리밍 중 가벼운 렌더링
 *
 * **지원 태그:**
 * - <vr>: Vector Reference Chip (RAG 출처 표시)
 * - <ws>: Web Search Reference Chip (웹 검색 출처 표시)
 * - <citation-group>: 다중 출처 통합 표시
 *
 * **주의사항:**
 * - AQ 태그는 확장으로 처리하지 않음 (aq-processor.ts에서 HTML로 변환)
 */

import { AT_TAG_REGEX } from '@/types/chat';
import {
  renderAtTag,
  renderCitationGroup,
  renderFSGroup,
  renderVRGroup,
  renderWSGroup,
  renderReferenceChip,
  renderMaskingLabel,
} from '../components';
import { escapeHtml, parseAttributes, parseBalancedLink, MARKDOWN_STYLES } from '../utils';

/**
 * VR 태그 렌더링 카운터 (렌더링 순서 추적)
 * 각 렌더링마다 1, 2, 3... 순서로 인덱스 부여
 */
let renderCounter = 0;

/**
 * VR 카운터 리셋 (새로운 렌더링 시작 시 호출)
 */
export function resetCounter() {
  renderCounter = 0;
}

/**
 * 커스텀 확장 - <vr> 태그
 *
 * **렌더링 결과:**
 * ReferenceChip 스타일을 재현한 HTML (인터랙션 없음)
 *
 * @example
 * ```xml
 * <vr id="doc1" chunkindex="0" sentences="1,2" title="Example.pdf" />
 * ```
 * ↓
 * ```html
 * <span class="reference-chip-placeholder ...">
 *   <span>1</span>
 *   <span>Example.pdf</span>
 * </span>
 * ```
 */
export const vrExtension = {
  name: 'vr',
  level: 'inline' as const,
  // \uE000: 전처리에서 줄 선두 <vr> 앞에 삽입 (marked 블록 html 토큰으로 잡히지 않게 함)
  start(src: string) {
    return src.match(/\uE000?<vr\s/)?.index;
  },
  tokenizer(src: string) {
    const match = src.match(/^\uE000?<vr\s+([^>]+)\s*\/>/);
    if (match) {
      const attrs = parseAttributes(match[1]);
      return {
        type: 'vr',
        raw: match[0],
        attrs,
      };
    }
  },
  renderer(token: any) {
    // 렌더링 순서 카운터 증가
    renderCounter++;
    const index = renderCounter;

    return renderReferenceChip('vr', token.attrs, index);
  },
};

/**
 * 커스텀 확장 - <ws> 태그
 *
 * **렌더링 결과:**
 * Web Search Citation Chip 스타일을 재현한 HTML (인터랙션 없음)
 *
 * @example
 * ```xml
 * <ws title="연합뉴스 '24.11" url="https://example.com/article" />
 * ```
 * ↓
 * ```html
 * <a class="ws-chip ..." href="..." target="_blank">
 *   <span>1</span>
 *   <span>연합뉴스 '24.11</span>
 * </a>
 * ```
 */
export const wsExtension = {
  name: 'ws',
  level: 'inline' as const,
  // \uE000: 전처리에서 줄 선두 <ws> 앞에 삽입 (marked 블록 html 토큰으로 잡히지 않게 함)
  start(src: string) {
    return src.match(/\uE000?<ws\s/)?.index;
  },
  tokenizer(src: string) {
    const match = src.match(/^\uE000?<ws\s+([^>]+)\s*\/>/);
    if (match) {
      const attrs = parseAttributes(match[1]);
      return {
        type: 'ws',
        raw: match[0],
        attrs,
      };
    }
  },
  renderer(token: any) {
    // 렌더링 순서 카운터 증가 (renderCounter 재사용 - 통합 인덱스)
    renderCounter++;
    const index = renderCounter;

    return renderReferenceChip('ws', token.attrs, index);
  },
};

/** 커스텀 확장 - <fs> 태그 (Flow Search Citation) - 인라인 */
export const fsExtension = {
  name: 'fs',
  level: 'inline' as const,
  // \uE000: 전처리에서 줄 선두 <fs> 앞에 삽입 (marked 블록 html 토큰으로 잡히지 않게 함)
  start(src: string) {
    return src.match(/\uE000?<fs\s/)?.index;
  },
  tokenizer(src: string) {
    const match = src.match(/^\uE000?<fs\s+([^>]+)\s*\/>/);
    if (match) {
      const attrs = parseAttributes(match[1]);
      return {
        type: 'fs',
        raw: match[0],
        attrs,
      };
    }
  },
  renderer(token: any) {
    renderCounter++;
    return renderReferenceChip('fs', token.attrs, renderCounter);
  },
};

/**
 * 커스텀 확장 - <fs> 태그 (Flow Search Citation) - 블록 레벨
 *
 * marked.js에서 단독 줄에 있는 HTML 태그는 블록으로 인식되어
 * inline 확장이 적용되지 않음. 따라서 block 레벨 확장도 필요.
 */
export const fsBlockExtension = {
  name: 'fs-block',
  level: 'block' as const,
  start(src: string) {
    return src.match(/^<fs\s/)?.index ?? src.match(/\n<fs\s/)?.index;
  },
  tokenizer(src: string) {
    const match = src.match(/^<fs\s+([^>]+)\s*\/>\s*(?:\n|$)/);
    if (match) {
      const attrs = parseAttributes(match[1]);
      return {
        type: 'fs-block',
        raw: match[0],
        attrs,
      };
    }
  },
  renderer(token: any) {
    renderCounter++;
    return renderReferenceChip('fs', token.attrs, renderCounter);
  },
};

/** 커스텀 확장 - <ws-group> 태그 */
export const wsGroupExtension = {
  name: 'ws-group',
  level: 'inline' as const,
  start(src: string) {
    return src.match(/<ws-group/)?.index;
  },
  tokenizer(src: string) {
    const match = src.match(/^<ws-group>([\s\S]*?)<\/ws-group>/);
    if (match) {
      const innerContent = match[1];
      // 새 형식: <ws url="..." /> (title은 store에서 조회)
      const wsItems: Array<{ title?: string; url?: string }> = [];
      const wsTagRegex = /\uE000?<ws\s+([^>]+)\s*(?:\/>|><\/ws>)/g;
      let wsMatch: RegExpExecArray | null;

      while ((wsMatch = wsTagRegex.exec(innerContent)) !== null) {
        const attrs = parseAttributes(wsMatch[1]);
        wsItems.push({
          title: attrs.title, // optional (기존 형식 호환)
          url: attrs.url, // 필수
        });
      }

      return {
        type: 'ws-group',
        raw: match[0],
        items: wsItems,
      };
    }
  },
  renderer(token: any) {
    renderCounter++;
    return renderWSGroup(token.items, renderCounter);
  },
};

/** 커스텀 확장 - <fs-group> 태그 */
export const fsGroupExtension = {
  name: 'fs-group',
  level: 'inline' as const,
  start(src: string) {
    return src.match(/<fs-group/)?.index;
  },
  tokenizer(src: string) {
    const match = src.match(/^<fs-group>([\s\S]*?)<\/fs-group>/);
    if (match) {
      const innerContent = match[1];
      // 새 형식: <fs id="..." type="..." /> (title은 store에서 조회)
      const fsItems: Array<{ id?: string; type?: string; title?: string; url?: string; created?: string }> = [];
      const fsTagRegex = /\uE000?<fs\s+([^>]+)\s*(?:\/>|><\/fs>)/g;
      let fsMatch: RegExpExecArray | null;

      while ((fsMatch = fsTagRegex.exec(innerContent)) !== null) {
        const attrs = parseAttributes(fsMatch[1]);
        fsItems.push({
          id: attrs.id, // 필수 (새 형식)
          type: attrs.type, // 필수
          title: attrs.title, // optional (기존 형식 호환)
          url: attrs.url, // optional (기존 형식 호환)
          created: attrs.created, // optional
        });
      }

      return {
        type: 'fs-group',
        raw: match[0],
        items: fsItems,
      };
    }
  },
  renderer(token: any) {
    renderCounter++;
    return renderFSGroup(token.items, renderCounter);
  },
};

/** 커스텀 확장 - <vr-group> 태그 */
export const vrGroupExtension = {
  name: 'vr-group',
  level: 'inline' as const,
  start(src: string) {
    return src.match(/<vr-group/)?.index;
  },
  tokenizer(src: string) {
    const match = src.match(/^<vr-group>([\s\S]*?)<\/vr-group>/);
    if (match) {
      const innerContent = match[1];
      // 새 형식: <vr id="..." chunkindex="..." sentences="..." /> (title은 store에서 조회)
      const vrItems: Array<{ id?: string; chunkindex?: string; sentences?: string; title?: string }> = [];
      const vrTagRegex = /\uE000?<vr\s+([^>]+)\s*(?:\/>|><\/vr>)/g;
      let vrMatch: RegExpExecArray | null;

      while ((vrMatch = vrTagRegex.exec(innerContent)) !== null) {
        const attrs = parseAttributes(vrMatch[1]);
        vrItems.push({
          id: attrs.id, // 필수
          chunkindex: attrs.chunkindex, // 필수
          sentences: attrs.sentences, // optional
          title: attrs.title, // optional (기존 형식 호환)
        });
      }

      return {
        type: 'vr-group',
        raw: match[0],
        items: vrItems,
      };
    }
  },
  renderer(token: any) {
    renderCounter++;
    return renderVRGroup(token.items, renderCounter);
  },
};

/** 커스텀 확장 - <citation-group> 태그 */
export const citationGroupExtension = {
  name: 'citation-group',
  level: 'inline' as const,
  start(src: string) {
    return src.match(/<citation-group/)?.index;
  },
  tokenizer(src: string) {
    const match = src.match(/^<citation-group\s+([^>]+)><\/citation-group>/);
    if (match) {
      const attrs = parseAttributes(match[1]);
      return {
        type: 'citation-group',
        raw: match[0],
        attrs,
      };
    }
  },
  renderer(token: any) {
    return renderCitationGroup(token.attrs);
  },
};

/** URL 내 괄호를 올바르게 처리하는 링크 토크나이저 */
export const balancedLinkExtension = {
  name: 'balancedLink',
  level: 'inline' as const,
  start(src: string) {
    return src.indexOf('[');
  },
  tokenizer(this: any, src: string) {
    const parsed = parseBalancedLink(src, 0);
    if (!parsed) return undefined;

    return {
      type: 'link',
      raw: parsed.raw,
      href: parsed.href,
      title: parsed.title,
      text: parsed.text,
      tokens: this.lexer.inlineTokens(parsed.text),
    };
  },
};

/**
 * 틸드 코드 펜스에서 유효한 언어 목록
 */
const VALID_CODE_FENCE_LANGUAGES = new Set([
  'bash',
  'c',
  'cpp',
  'csharp',
  'css',
  'diff',
  'docker',
  'dockerfile',
  'go',
  'graphql',
  'java',
  'javascript',
  'json',
  'jsx',
  'kotlin',
  'markdown',
  'markup',
  'python',
  'ruby',
  'rust',
  'scala',
  'sql',
  'swift',
  'tsx',
  'typescript',
  'yaml',
  'html',
  'xml',
  'svg',
  'js',
  'ts',
  'py',
  'sh',
  'shell',
  'yml',
  'md',
  'cs',
  'plaintext',
  'text',
  'vue',
  'svelte',
  'php',
  'perl',
  'lua',
  'r',
  'matlab',
  'powershell',
  'objectivec',
  'objc',
]);

/**
 * 커스텀 확장 - 틸드 코드 펜스 (~~~)
 *
 * - 유효한 프로그래밍 언어가 지정된 경우에만 코드 블록으로 인식
 * - ~~~만 있거나 유효하지 않은 언어면 일반 텍스트로 처리
 */
export const tildeFenceExtension = {
  name: 'tilde-fence',
  level: 'block' as const,
  start(src: string) {
    return src.match(/^~{3,}/)?.index;
  },
  tokenizer(this: { lexer: { inlineTokens: (text: string) => any[] } }, src: string) {
    // ~~~로 시작하는 줄 매칭
    const tildeLineMatch = src.match(/^(~{3,})([^\n]*?)(\n|$)/);
    if (!tildeLineMatch) return;

    const fenceLength = tildeLineMatch[1].length;
    const langPart = tildeLineMatch[2].trim();
    const openFence = tildeLineMatch[0];

    // 언어 추출 (소문자 알파벳, 숫자, 하이픈만)
    const langMatch = langPart.match(/^([a-z0-9-]+)$/i);
    const lang = langMatch ? langMatch[1].toLowerCase() : '';

    // 유효한 언어가 아니면 paragraph로 처리 (코드 블록 방지)
    if (!VALID_CODE_FENCE_LANGUAGES.has(lang)) {
      return {
        type: 'paragraph',
        raw: openFence,
        text: openFence.trimEnd(),
        tokens: this.lexer.inlineTokens(openFence.trimEnd()),
      };
    }

    // 유효한 언어 - 닫는 펜스 찾기
    const closingPattern = new RegExp(`\n(~{${fenceLength},})(?:${lang})?\\s*(?:\n|$)`, '');
    const restContent = src.slice(openFence.length);
    const closeMatch = restContent.match(closingPattern);

    if (closeMatch && closeMatch.index !== undefined) {
      const codeContent = restContent.slice(0, closeMatch.index);
      const closeFence = closeMatch[0];
      const raw = openFence + codeContent + closeFence;

      return {
        type: 'code',
        raw,
        lang,
        text: codeContent,
      };
    }

    // 닫는 펜스 없으면 paragraph로 처리
    return {
      type: 'paragraph',
      raw: openFence,
      text: openFence.trimEnd(),
      tokens: this.lexer.inlineTokens(openFence.trimEnd()),
    };
  },
};

/**
 * 커스텀 확장 - <at> 태그 (Mention Tag)
 *
 * **렌더링 결과:**
 * 멘션 스타일을 재현한 HTML (굵은 파란색 텍스트)
 *
 * @example
 * ```xml
 * <at action="search" data='{"type":"news","title":"뉴스제목"}'>뉴스제목</at>
 * ```
 * ↓
 * ```html
 * <span class="text-primary font-semibold">뉴스제목</span>
 * ```
 */
export const atExtension = {
  name: 'at',
  level: 'inline' as const,
  start(src: string) {
    return src.match(/<at/)?.index;
  },
  tokenizer(src: string) {
    // 1. double quote 형식 (base64 인코딩 - 권장)
    // AT_TAG_REGEX를 ^로 시작하도록 래핑
    const doubleQuoteMatch = src.match(new RegExp('^' + AT_TAG_REGEX.source));
    if (doubleQuoteMatch) {
      return {
        type: 'at',
        raw: doubleQuoteMatch[0],
        action: doubleQuoteMatch[1],
        data: doubleQuoteMatch[2],
        displayText: doubleQuoteMatch[3],
      };
    }

    // 2. single quote 형식 (레거시 - JSON 안에 nested quotes가 있을 수 있음)
    // </at> 종료 태그를 찾아서 전체 태그 추출 후 파싱
    const endTagIndex = src.indexOf('</at>');
    if (endTagIndex === -1) return;

    const fullTag = src.slice(0, endTagIndex + 5); // '</at>' 포함
    if (!fullTag.startsWith('<at ')) return;

    // action='...' 추출
    const actionMatch = fullTag.match(/action='([^']+)'/);
    if (!actionMatch) return;

    // data='...'> 형식에서 data 추출 (마지막 '>displayText</at>' 전까지)
    // displayText 추출: >와 </at> 사이
    const displayTextMatch = fullTag.match(/>([^<]+)<\/at>$/);
    if (!displayTextMatch) return;
    const displayText = displayTextMatch[1];

    // data 추출: data=' 이후부터 '>displayText 전까지
    const dataStartMatch = fullTag.match(/data='/);
    if (!dataStartMatch || dataStartMatch.index === undefined) return;

    const dataStart = dataStartMatch.index + 6; // "data='" 길이
    const dataEnd = fullTag.lastIndexOf("'>" + displayText);
    if (dataEnd <= dataStart) return;

    const data = fullTag.slice(dataStart, dataEnd);

    return {
      type: 'at',
      raw: fullTag,
      action: actionMatch[1],
      data: data,
      displayText: displayText,
    };
  },
  renderer(token: any) {
    return renderAtTag({ action: token.action, data: token.data }, token.displayText);
  },
};

/**
 * 커스텀 확장 - <<라벨>> 태그 (Security Masking Label)
 *
 * **패턴:**
 * - <<이메일>> → 이메일
 * - <<이메일-1>> → 이메일
 * - <<관리자 설정 단어>> → 관리자 설정 단어
 *
 * **렌더링 결과:**
 * 보라색 별표 패턴 + 하단 보더 + 호버 툴팁
 */
export const maskingLabelExtension = {
  name: 'masking-label',
  level: 'inline' as const,
  start(src: string) {
    return src.match(/<</)?.index;
  },
  tokenizer(src: string) {
    // <<라벨-N>> 패턴만 매칭 (-숫자 필수, 사용자 입력 <<text>>는 제외)
    // 라벨: 한글, 영문, 숫자, 공백, 언더스코어 허용
    const match = src.match(/^<<([\w가-힣\s/]+-\d+)>>/);
    if (match) {
      return {
        type: 'masking-label',
        raw: match[0],
        label: match[1],
      };
    }
  },
  renderer(token: any) {
    return renderMaskingLabel(token.label);
  },
};

/**
 * 이미지 속성 확장 - ![alt](url){ width=300 height=200 }
 *
 * Typora / Obsidian 스타일의 이미지 크기 지정 문법 지원.
 * 이미지 뒤의 `{ key=value ... }` 블록에서 width, height를 추출하여
 * inline style로 적용합니다.
 *
 * **지원 문법:**
 * - `![alt](url){ width=300 }` → max-width: 300px
 * - `![alt](url){ width=300 height=200 }` → max-width: 300px; height: 200px
 * - `![alt](url){ width=50% }` → max-width: 50%
 * - `![alt](url "title"){ width=300 }` → title 속성 + max-width: 300px
 *
 * **보안:** 숫자 또는 %/px/em/rem 단위만 허용, 임의 CSS 주입 방지
 */

/** 이미지 alt 기본값 (setImageAttrsDefaultAlt로 설정) */
let _imageAttrsDefaultAlt = '이미지';

export function setImageAttrsDefaultAlt(alt: string) {
  _imageAttrsDefaultAlt = alt;
}

export function clearImageAttrsDefaultAlt() {
  _imageAttrsDefaultAlt = '이미지';
}

/** CSS 값 안전성 검증 (숫자, px, %, em, rem만 허용) */
function isSafeCssValue(value: string): boolean {
  return /^\d+(\.\d+)?(px|%|em|rem)?$/.test(value);
}

export const imageWithAttrsExtension = {
  name: 'image-with-attrs',
  level: 'inline' as const,
  start(src: string) {
    return src.match(/!\[/)?.index;
  },
  tokenizer(src: string) {
    // ![alt](url "title"){ key=value ... }
    // alt: [^[\]]* — 대괄호 외 모든 문자
    // url: [^\s)]+ — 공백/닫기괄호 외 모든 문자
    // title: optional, "..." 또는 '...'
    // attrs: { ... } — 중괄호 블록
    const match = src.match(/^!\[([^\[\]]*)\]\(\s*([^\s)]+)(?:\s+["']([^"']*)["'])?\s*\)\{\s*([^}]+)\s*\}/);
    if (!match) return;

    const [raw, alt, href, title, attrsStr] = match;

    // key=value 파싱 (공백 구분)
    const attrs: Record<string, string> = {};
    const attrRegex = /([\w-]+)\s*=\s*("[^"]*"|'[^']*'|[^\s}]+)/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
      const key = attrMatch[1].toLowerCase();
      // 따옴표 제거
      const val = attrMatch[2].replace(/^["']|["']$/g, '');
      attrs[key] = val;
    }

    // width 또는 height가 없으면 이 확장을 적용할 필요 없음
    if (!attrs.width && !attrs.height) return;

    return {
      type: 'image-with-attrs',
      raw,
      href,
      text: alt,
      title: title || '',
      attrs,
    };
  },
  renderer(token: any) {
    const href = token.href;
    const title = token.title;
    const text = token.text;
    const titleAttr = title ? `title="${escapeHtml(title)}"` : '';
    const altAttr = text ? `alt="${escapeHtml(text)}"` : `alt="${escapeHtml(_imageAttrsDefaultAlt)}"`;

    // width, height → inline style 빌드
    const styles: string[] = [];
    if (token.attrs.width && isSafeCssValue(token.attrs.width)) {
      const w = token.attrs.width;
      styles.push(`max-width: ${/^\d+(\.\d+)?$/.test(w) ? w + 'px' : w}`);
    }
    if (token.attrs.height && isSafeCssValue(token.attrs.height)) {
      const h = token.attrs.height;
      styles.push(`height: ${/^\d+(\.\d+)?$/.test(h) ? h + 'px' : h}`);
    }

    const styleAttr =
      styles.length > 0 ? `style="${styles.join('; ')};"` : 'style="max-width: 512px; max-height: 400px;"';

    return `<div class="${MARKDOWN_STYLES.image.wrapper}"><div class="${MARKDOWN_STYLES.image.container}"><img src="${escapeHtml(href || '')}" ${altAttr} ${titleAttr} class="${MARKDOWN_STYLES.image.img}" loading="lazy" ${styleAttr} /></div></div>`;
  },
};
