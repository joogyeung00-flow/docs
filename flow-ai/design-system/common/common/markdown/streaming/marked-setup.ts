/**
 * @file marked-setup.ts
 * @description Marked.js 커스텀 렌더러 설정
 *
 * **역할:**
 * - Marked.js에 커스텀 렌더러 적용
 * - 일관된 스타일로 HTML 생성
 * - 스트리밍 및 완료 후 렌더링 모두 처리
 *
 * **커스텀 렌더러:**
 * - heading: h1, h2, h3 (slugify ID 포함)
 * - table: shadcn/ui 스타일
 * - list: ul, ol
 * - link: 외부 링크 스타일
 * - image: 이미지 카드
 * - code: 코드 블록
 * - 기타: blockquote, strong, em, del 등
 */

import { marked, Tokens } from 'marked';
import markedKatex from 'marked-katex-extension';
import { renderCodeBlock, renderInlineCode, setXmlBlockMarkdownParser } from '../components';
import { escapeHtml, MARKDOWN_STYLES, slugify } from '../utils';
import {
  atExtension,
  balancedLinkExtension,
  citationGroupExtension,
  fsBlockExtension,
  fsExtension,
  fsGroupExtension,
  imageWithAttrsExtension,
  maskingLabelExtension,
  tildeFenceExtension,
  vrExtension,
  vrGroupExtension,
  wsExtension,
  wsGroupExtension,
} from './marked-extensions';

/** 이미지 alt 기본값 (MarkdownRenderer에서 setMarkdownImageDefaultAlt로 설정) */
let _defaultImageAlt = '이미지';

export function setMarkdownImageDefaultAlt(alt: string) {
  _defaultImageAlt = alt;
}

export function clearMarkdownImageDefaultAlt() {
  _defaultImageAlt = '이미지';
}

/**
 * 커스텀 렌더러 생성
 *
 * **코드블럭 인덱스 관리:**
 * - 각 렌더러 인스턴스는 독립적인 `codeBlockIndex` 카운터를 가집니다.
 * - 렌더러가 생성될 때마다 카운터는 0으로 초기화됩니다.
 * - 같은 메시지 내에서 여러 코드블럭이 렌더링될 때 순차적으로 증가합니다 (0, 1, 2, ...).
 * - 각 메시지는 독립적으로 렌더링되므로, 각 메시지의 코드블럭 인덱스는 항상 0부터 시작합니다.
 *
 * @param messageId - 메시지 ID (공유 기능용, 선택사항)
 * @returns Marked.js 렌더러 객체
 */
export function createLightweightRenderer(messageId?: number) {
  // 코드블럭 인덱스 카운터 (이 렌더러 인스턴스 내에서만 유효)
  // 각 메시지 렌더링마다 0부터 시작하여 순차적으로 증가
  let codeBlockIndex = 0;

  return {
    // ===== 헤딩 =====
    heading(this: any, token: Tokens.Heading): string {
      const text = this.parser.parseInline(token.tokens);
      const plainText = token.text; // slugify를 위한 평문
      const id = slugify(plainText);
      const depth = token.depth;

      if (depth === 1) {
        return `<h1 id="${id}" class="${MARKDOWN_STYLES.heading.h1}">${text}</h1>`;
      }
      if (depth === 2) {
        return `<h2 id="${id}" class="${MARKDOWN_STYLES.heading.h2}">${text}</h2>`;
      }
      if (depth === 3) {
        return `<h3 id="${id}" class="${MARKDOWN_STYLES.heading.h3}">${text}</h3>`;
      }
      return `<h${depth} id="${id}">${text}</h${depth}>`;
    },

    // ===== 테이블 =====
    table(this: any, token: Tokens.Table): string {
      // header와 rows를 직접 렌더링
      let header = `<thead class="${MARKDOWN_STYLES.table.thead}"><tr>`;
      for (const cell of token.header) {
        const cellText = this.parser.parseInline(cell.tokens);
        header += `<th class="${MARKDOWN_STYLES.table.th}">${cellText}</th>`;
      }
      header += '</tr></thead>';

      let rows = '';
      if (token.rows && token.rows.length > 0) {
        rows = `<tbody class="${MARKDOWN_STYLES.table.tbody}">`;
        for (const row of token.rows) {
          rows += `<tr class="${MARKDOWN_STYLES.table.tr}">`;
          for (const cell of row) {
            const cellText = this.parser.parseInline(cell.tokens);
            rows += `<td class="${MARKDOWN_STYLES.table.td}">${cellText}</td>`;
          }
          rows += '</tr>';
        }
        rows += '</tbody>';
      }

      return `<div class="${MARKDOWN_STYLES.table.wrapper}"><table class="${MARKDOWN_STYLES.table.table}">${header}${rows}</table></div>`;
    },

    // ===== 리스트 =====
    list(this: any, token: Tokens.List): string {
      const tag = token.ordered ? 'ol' : 'ul';
      // task list인 경우 list-none 스타일 적용
      const isTaskList = token.items.some((item: any) => item.task);
      const baseClasses = token.ordered ? MARKDOWN_STYLES.list.ol : MARKDOWN_STYLES.list.ul;
      const classes = isTaskList
        ? baseClasses.replace('list-disc', 'list-none').replace(/!pl-\d+/g, '!pl-0')
        : baseClasses;
      const startAttr =
        token.ordered && typeof token.start === 'number' && token.start > 1 ? ` start="${token.start}"` : '';

      let items = '';
      for (const item of token.items) {
        // <p> 없이 직접 렌더링
        let itemText: string;
        const firstToken = item.tokens[0];

        if (item.tokens.length === 1 && 'tokens' in firstToken) {
          // 단일 토큰 (text 또는 paragraph) → inline으로 파싱 (p 태그 없이)
          itemText = this.parser.parseInline(firstToken.tokens);
        } else {
          // 복잡한 구조 (중첩 리스트 등) → 기존 방식
          itemText = this.parser.parse(item.tokens);
          // li 내부의 <p>를 제거하여 불필요한 간격 방지
          // 뒤에 블록 요소가 따라오면 <br>로 개행 유지
          itemText = itemText.replace(/<p[^>]*>([\s\S]*?)<\/p>\s*(?=<)/g, '$1<br>');
          itemText = itemText.replace(/<p[^>]*>([\s\S]*?)<\/p>/g, '$1');
          // 텍스트 직후 중첩 리스트가 바로 오는 경우 (<p> 없이) 개행 삽입
          itemText = itemText.replace(/([^>])<(ul|ol)[\s>]/g, '$1<br><$2 ');
        }

        // task list 아이템 처리 (체크박스)
        const isTask = item.task;
        const isChecked = isTask && item.checked;
        if (isTask) {
          const checkboxClass = 'mr-2 shrink-0';
          const checkbox = `<input type="checkbox" ${isChecked ? 'checked' : ''} disabled class="${checkboxClass}" />`;
          if (isChecked) {
            itemText =
              checkbox +
              `<span class="text-gray-500" style="text-decoration: line-through; text-decoration-thickness: 0.5px;">${itemText}</span>`;
          } else {
            itemText = checkbox + itemText;
          }
        }

        const itemStart =
          token.ordered && typeof (item as any).start === 'number' ? ` value="${(item as any).start}"` : '';
        const taskClass = isTask ? 'flex items-center' : '';
        items += `<li class="${MARKDOWN_STYLES.list.li}${taskClass}"${itemStart}>${itemText}</li>`;
      }

      return `<${tag} class="${classes}"${startAttr}>${items}</${tag}>`;
    },

    // ===== 인라인 요소 =====
    strong(this: any, token: Tokens.Strong): string {
      const text = this.parser.parseInline(token.tokens);
      return `<strong class="${MARKDOWN_STYLES.strong}">${text}</strong>`;
    },

    blockquote(this: any, token: Tokens.Blockquote): string {
      const text = this.parser.parse(token.tokens);
      return `<blockquote class="${MARKDOWN_STYLES.blockquote}">${text}</blockquote>`;
    },

    paragraph(this: any, token: Tokens.Paragraph): string {
      const text = this.parser.parseInline(token.tokens);
      // 블록 요소가 포함된 경우 감지
      const blockPattern =
        /<(div|ul|ol|table|pre|blockquote|h[1-6]|section|article|hr|aq|aq-ul|aq-h2|citation-group|vr)[>\s]/i;

      if (blockPattern.test(text)) {
        return text;
      }

      return `<p class="${MARKDOWN_STYLES.paragraph}">${text}</p>`;
    },

    // ===== 링크 =====
    link(this: any, token: Tokens.Link): string {
      const href = token.href;
      const title = token.title;
      const text = this.parser.parseInline(token.tokens);
      const isWwwPrefix = href && href.startsWith('www.');
      // www. 로 시작하는 URL에 https:// 추가
      const normalizedHref = isWwwPrefix ? `https://${href}` : href;

      const titleAttr = title ? `title="${escapeHtml(title)}"` : '';
      return `<a href="${escapeHtml(normalizedHref || href || '')}" ${titleAttr} target="_blank" rel="noopener noreferrer" class="${MARKDOWN_STYLES.link}">${text}</a>`;
    },

    // ===== 이미지 =====
    image(token: Tokens.Image): string {
      const href = token.href;
      const title = token.title;
      const text = token.text;
      const titleAttr = title ? `title="${escapeHtml(title)}"` : '';
      const altAttr = text ? `alt="${escapeHtml(text)}"` : `alt="${escapeHtml(_defaultImageAlt)}"`;
      return `<div class="${MARKDOWN_STYLES.image.wrapper}"><div class="${MARKDOWN_STYLES.image.container}"><img src="${escapeHtml(href || '')}" ${altAttr} ${titleAttr} class="${MARKDOWN_STYLES.image.img}" loading="lazy" style="max-width: 512px; max-height: 400px;" /></div></div>`;
    },

    // ===== 코드 블록 =====
    code(token: Tokens.Code): string {
      const text = token.text;
      const language = token.lang || 'text';
      // html-helpers의 renderCodeBlock 사용 (스타일 일관성 보장)
      // 현재 코드블럭의 인덱스를 할당하고 카운터 증가 (후위 증가)
      const currentIndex = codeBlockIndex++;
      return renderCodeBlock(language, text, messageId, currentIndex);
    },

    // ===== 인라인 코드 =====
    codespan(token: Tokens.Codespan): string {
      // html-helpers의 renderInlineCode 사용 (스타일 일관성 보장)
      return renderInlineCode(token.text);
    },

    // ===== em (이탤릭) =====
    em(this: any, token: Tokens.Em): string {
      const text = this.parser.parseInline(token.tokens);
      return `<em>${text}</em>`;
    },

    // ===== del 태그 =====
    del(this: any, token: Tokens.Del): string {
      const text = this.parser.parseInline(token.tokens);
      return `~${text}~`; // markdown-renderer.tsx와 동일하게 틸드로 표시 (del 태그 무시)
    },

    // ===== HTML 태그 필터링 (보안) =====
    // 허용된 태그만 통과, 나머지는 escape 처리
    html(token: Tokens.HTML | Tokens.Tag): string {
      const html = token.raw;
      // 공백/개행 제거한 버전 (매칭용)
      const htmlNormalized = html.replace(/\s+/g, ' ');

      // 1. 기본 포맷팅 태그 허용 (strong, em, b, i, u, s, p, br, span 등)
      const basicTagPattern = /^<\s*\/?\s*(strong|em|b|i|u|s|p|br|span|sub|sup|mark)[\s>\/]/i;
      if (basicTagPattern.test(htmlNormalized.trim())) {
        return html;
      }

      // 2. 커스텀 태그 (aq, vr, ws, fs 등) - 원본 태그는 항상 허용
      const customTagPattern =
        /^<\s*\/?\s*(aq|aq-ul|aq-h2|aq-li|vr|vr-group|ws|ws-group|fs|fs-group|citation-group|at)[\s>\/]/i;
      if (customTagPattern.test(htmlNormalized.trim())) {
        return html;
      }

      // 2. data-from 속성이 있는 태그 - unifiedPreprocess에서 변환된 안전한 태그
      // 공백/개행이 있어도 매칭되도록 정규화된 문자열에서 검사
      // 예: <div data-from="aq" ...>, <svg\n  data-from="aq" ...>
      if (/data-from\s*=\s*["'](?:aq|vr|ws|fs)["']/i.test(htmlNormalized)) {
        return html;
      }

      // 3. 닫는 태그는 허용 (열린 태그가 이미 통과했으므로)
      if (/^<\s*\/\s*[a-z][a-z0-9-]*\s*>/i.test(htmlNormalized.trim())) {
        return html;
      }

      // 허용되지 않은 HTML 태그는 escape 처리 (script, iframe, style, form, input 등)
      // 공백/탭/개행 보존: 개행→<br>, 탭→4칸 공백, 연속 공백→&nbsp;
      return escapeHtml(html)
        .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
        .replace(/  /g, '&nbsp;&nbsp;')
        .replace(/\n/g, '<br>');
    },
  };
}

/**
 * Marked.js 설정 및 초기화
 *
 * - 커스텀 렌더러 적용
 * - 커스텀 확장 추가 (vr, citation-group)
 * - GFM + breaks 활성화
 *
 * @param messageId - 메시지 ID (공유 기능용, 선택사항)
 * @returns 설정된 marked 인스턴스
 */
export function setupLightweightMarked(messageId?: number) {
  const renderer = createLightweightRenderer(messageId);

  marked.use({
    renderer,
    gfm: true,
    breaks: true,
  });

  // KaTeX 수식 렌더링 확장
  marked.use(
    markedKatex({
      throwOnError: false, // 에러 시 렌더링 중단 방지
      nonStandard: true, // $x$ 형태 허용 (공백 없이)
    }),
  );

  marked.use({
    extensions: [
      tildeFenceExtension, // 먼저 처리 (기본 code 토크나이저보다 우선)
      imageWithAttrsExtension, // ![alt](url){ width=300 } 문법 (기본 image보다 우선)
      balancedLinkExtension,
      vrExtension,
      wsExtension,
      fsExtension,
      fsBlockExtension,
      wsGroupExtension,
      fsGroupExtension,
      vrGroupExtension,
      citationGroupExtension,
      atExtension,
      maskingLabelExtension,
    ],
  });

  // XML 태그 블록 내부 콘텐츠 렌더링용 마크다운 파서 주입
  // 순환 참조 방지: code-block.ts → marked-setup.ts 직접 import 없이 콜백으로 전달
  // 기존 marked 렌더러를 그대로 사용 (코드 블록도 동일한 스타일)
  setXmlBlockMarkdownParser((text: string) => marked.parse(text) as string);

  return marked;
}
