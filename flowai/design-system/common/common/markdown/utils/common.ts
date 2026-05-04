/**
 * @file common.ts
 * @description 공통 유틸리티 함수
 *
 * **역할:**
 * - HTML 이스케이프
 * - Slugify (헤딩 ID 생성)
 * - URL/링크 검증
 * - Base64 인코딩/디코딩
 *
 * **사용처:**
 * - marked.js 커스텀 렌더러
 * - react-markdown 커스텀 컴포넌트
 * - AQ 프로세서
 */

/**
 * 안전한 Base64 인코딩 (UTF-8 지원)
 *
 * encodeURIComponent가 malformed URI 에러를 방지하고
 * btoa로 base64 인코딩합니다. 실패 시 폴백을 제공합니다.
 *
 * @param str - 인코딩할 문자열
 * @param fallbackToOriginal - 실패 시 원본 문자열 반환 여부 (기본: false, 빈 문자열 반환)
 * @returns base64로 인코딩된 문자열 (실패 시 빈 문자열 또는 원본 문자열)
 *
 * @example
 * ```ts
 * safeBase64Encode('Hello World') // 'SGVsbG8lMjBXb3JsZA=='
 * safeBase64Encode('안녕하세요') // 'JUVDJTk1JTg4JUVCJTg1JTg1...'
 * safeBase64Encode('test', true) // 실패 시 'test' 반환
 * ```
 */
export function safeBase64Encode(str: string, fallbackToOriginal = false): string {
  // 서버 환경 (btoa가 없는 경우)
  if (typeof btoa === 'undefined') {
    return fallbackToOriginal ? str : '';
  }

  try {
    return btoa(encodeURIComponent(str));
  } catch (error) {
    // encodeURIComponent 실패 (주로 unpaired surrogate 때문)
    // 폴백 1: unpaired surrogate 제거 후 재시도
    try {
      // U+D800 ~ U+DFFF (surrogate pair 범위) 제거
      const cleaned = str.replace(/[\uD800-\uDFFF]/g, '');
      return btoa(encodeURIComponent(cleaned));
    } catch {
      // 폴백 2: 원본 문자열을 직접 btoa (ASCII만 가능)
      try {
        return btoa(str);
      } catch {
        // 모든 인코딩 실패 시 경고 (개발 환경에서만, 문자열 샘플 출력)
        if (process.env.NODE_ENV === 'development') {
          const sample = str.length > 100 ? str.slice(0, 100) + '...' : str;
          console.warn('Base64 encoding failed. Length:', str.length, 'Sample:', sample);
        }
        return fallbackToOriginal ? str : '';
      }
    }
  }
}

/**
 * HTML 특수문자를 이스케이프
 *
 * @param text - 이스케이프할 텍스트
 * @returns 이스케이프된 HTML
 *
 * @example
 * ```ts
 * escapeHtml('<script>alert("xss")</script>')
 * // '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 * ```
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * 텍스트를 URL-safe slug로 변환 (헤딩 ID 생성용)
 *
 * @param text - 변환할 텍스트
 * @returns slug 문자열
 *
 * @example
 * ```ts
 * slugify('Hello World!') // 'hello-world'
 * slugify('안녕하세요') // '안녕하세요'
 * ```
 */
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\s]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '');
}

/**
 * URL이 완전한지 확인 (프로토콜 + 도메인 검증)
 *
 * @param url - 검증할 URL
 * @returns 완전한 URL 여부
 *
 * @example
 * ```ts
 * isCompleteUrl('https://example.com') // true
 * isCompleteUrl('https://') // false
 * isCompleteUrl('example.com') // false
 * ```
 */
export function isCompleteUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  // 최소한의 URL 패턴 확인 (프로토콜 + 도메인)
  const urlPattern = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
  return urlPattern.test(url.trim());
}

/**
 * 링크 텍스트가 완성된 상태인지 확인 (스트리밍 중 미완성 링크 감지)
 *
 * @param children - React children (텍스트 노드)
 * @returns 완성된 링크 텍스트 여부
 *
 * @example
 * ```ts
 * isCompleteLinkText('Example Site') // true
 * isCompleteLinkText('https://') // false (스트리밍 중)
 * isCompleteLinkText('') // false
 * ```
 */
export function isCompleteLinkText(children: any): boolean {
  if (!children) return false;

  // extractTextFromChildren을 사용한 안전한 텍스트 추출
  const text = extractTextFromChildren(children);
  const trimmedText = text.trim();

  // 빈 텍스트이거나 URL 패턴으로만 이루어진 경우는 미완성으로 간주
  if (!trimmedText) return false;

  // URL 패턴으로만 이루어진 텍스트는 미완성으로 간주 (스트리밍 중)
  const urlPattern = /^https?:\/\//i;
  if (urlPattern.test(trimmedText) && trimmedText.length < 20) return false;

  return true;
}

/**
 * Marked.js 토큰에서 속성 파싱
 *
 * @param attrString - 속성 문자열 (예: 'id="123" title="test"')
 * @returns 속성 객체
 *
 * @example
 * ```ts
 * parseAttributes('id="123" title="Example"')
 * // { id: '123', title: 'Example' }
 *
 * // 값 안에 다른 종류의 따옴표가 포함된 경우도 처리
 * parseAttributes('title="연합뉴스 \'24.11"')
 * // { title: "연합뉴스 '24.11" }
 * ```
 */
export function parseAttributes(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  // 쌍따옴표로 감싼 값: name="value" (value 안에 작은따옴표 허용)
  // 작은따옴표로 감싼 값: name='value' (value 안에 쌍따옴표 허용)
  const doubleQuoteRegex = /([\w-]+)="([^"]*)"/g;
  const singleQuoteRegex = /([\w-]+)='([^']*)'/g;

  let match;
  while ((match = doubleQuoteRegex.exec(attrString)) !== null) {
    attrs[match[1]] = match[2];
  }
  while ((match = singleQuoteRegex.exec(attrString)) !== null) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

/**
 * 괄호 균형 파싱 결과
 */
export interface BalancedLinkResult {
  raw: string;
  text: string;
  href: string;
  title: string;
  end: number;
}

/**
 * 출처 제목 truncate (날짜 패턴 보존)
 *
 * 날짜 패턴(`'XX.XX` 또는 `XX.XX`)이 있으면 날짜는 보존하고 앞부분을 truncate
 *
 * @param title - 원본 제목
 * @param maxLength - 최대 길이 (기본값: 20)
 * @returns truncate된 제목
 *
 * @example
 * ```ts
 * truncateTitle("연합뉴스 '24.11") // "연합뉴스 '24.11" (20자 이하이므로 그대로)
 * truncateTitle("아주 긴 뉴스 사이트 이름입니다 '24.11") // "아주 긴 뉴스... '24.11"
 * truncateTitle("아주 긴 제목입니다 테스트") // "아주 긴 제목입니다 테..."
 * ```
 */
export function truncateTitle(title: string, maxLength = 24): string {
  if (!title) return '';
  if (title.length <= maxLength) return title;

  // 날짜 패턴 감지: 'XX.XX 또는 XX.XX (끝에 위치)
  const datePattern = /\s*['']?\d{2}\.\d{1,2}$/;
  const dateMatch = title.match(datePattern);

  if (dateMatch) {
    // 날짜 부분 추출
    const datePart = dateMatch[0];
    const titlePart = title.slice(0, dateMatch.index);

    // 날짜를 제외한 부분에서 truncate할 길이 계산
    const availableLength = maxLength - datePart.length - 3; // 3은 '...' 길이

    if (availableLength > 0 && titlePart.length > availableLength) {
      return titlePart.slice(0, availableLength).trimEnd() + '...' + datePart;
    }
  }

  // 날짜 패턴이 없거나 공간이 부족한 경우 기본 truncate
  return title.slice(0, maxLength - 3) + '...';
}

/**
 * 괄호 균형을 고려하여 마크다운 링크 파싱
 *
 * URL 내 괄호 (예: `?q=(주)기업`) 를 올바르게 처리
 *
 * @param text - 파싱할 텍스트
 * @param startIndex - 시작 인덱스 ([의 위치)
 * @returns 파싱 결과 또는 null
 *
 * @example
 * ```ts
 * parseBalancedLink('[사람인](https://example.com?q=(주)기업)', 0)
 * // { raw: '[사람인](...)', text: '사람인', href: 'https://...', title: '', end: 42 }
 * ```
 */
export function parseBalancedLink(text: string, startIndex: number): BalancedLinkResult | null {
  if (text[startIndex] !== '[') return null;

  // [text] 부분 찾기
  let i = startIndex + 1;
  while (i < text.length && text[i] !== ']') {
    i++;
  }
  if (i >= text.length || text[i + 1] !== '(') return null;

  const linkText = text.slice(startIndex + 1, i);

  // (url) 부분 - 괄호 균형 추적
  const urlStart = i + 2;
  let depth = 1;
  i = urlStart;
  let inQuote = false;
  let quoteChar = '';

  while (i < text.length && depth > 0) {
    const char = text[i];

    // 따옴표 안에서는 괄호 무시 (title 속성 처리)
    if ((char === '"' || char === "'") && (i === 0 || text[i - 1] !== '\\')) {
      if (!inQuote) {
        inQuote = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuote = false;
      }
    } else if (!inQuote) {
      if (char === '(') depth++;
      else if (char === ')') depth--;
    }
    i++;
  }

  if (depth !== 0) return null;

  // URL과 title 분리
  const urlAndTitle = text.slice(urlStart, i - 1); // 마지막 ) 제외
  let href = urlAndTitle;
  let title = '';

  // title 추출: "title" 또는 'title' 형태
  const titleMatch = urlAndTitle.match(/\s+["'](.*)["']$/);
  if (titleMatch) {
    href = urlAndTitle.slice(0, titleMatch.index).trim();
    title = titleMatch[1];
  }

  return {
    raw: text.slice(startIndex, i),
    text: linkText,
    href: href.trim(),
    title,
    end: i,
  };
}

// ============================================================================
// 코드블록 이진 탐색 유틸리티
// ============================================================================

/**
 * 정렬된 코드블록 배열에서 offset이 코드블록 내부인지 이진 탐색으로 확인
 * O(log k) — codeBlocks는 start 기준 오름차순 정렬되어 있어야 함
 *
 * @param codeBlocks - start 기준 오름차순 정렬된 코드블록 배열 (regex 매칭 순서로 보장)
 * @param offset - 확인할 위치
 * @returns offset이 어떤 코드블록의 [start, end) 범위 안에 있으면 true
 */
export function isInsideCodeBlock(codeBlocks: ReadonlyArray<{ start: number; end: number }>, offset: number): boolean {
  let lo = 0;
  let hi = codeBlocks.length - 1;

  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    const cb = codeBlocks[mid];

    if (cb.start > offset) {
      hi = mid - 1;
    } else if (cb.end <= offset) {
      lo = mid + 1;
    } else {
      // cb.start <= offset && offset < cb.end
      return true;
    }
  }
  return false;
}

// ============================================================================
// React Children 안전 처리 유틸리티 (공통화)
// ============================================================================

/**
 * React children을 안전하게 평문 텍스트로 변환
 *
 * 문자열, 숫자, React 요소, 배열, HAST 노드 등 모든 타입을 지원합니다.
 * 객체는 [object Object]로 표시되지 않고 빈 문자열로 처리됩니다.
 *
 * **사용 사례:**
 * - 헤딩의 ID 생성 (slug 생성)
 * - 링크 텍스트 검증
 * - 코드 블록의 문자열 추출
 * - 마크다운 요소의 텍스트 처리
 *
 * @param children - React children (ReactNode)
 * @returns 평문 텍스트 문자열
 *
 * @example
 * ```ts
 * // 문자열
 * extractTextFromChildren('hello') // 'hello'
 *
 * // 숫자
 * extractTextFromChildren(42) // '42'
 *
 * // 배열 (마크다운에서 **bold**가 <strong> 요소로 변환되는 경우)
 * extractTextFromChildren(['Hello ', <strong>world</strong>]) // 'Hello world'
 *
 * // React 요소의 props.children 재귀 추출
 * extractTextFromChildren({ props: { children: 'nested' } }) // 'nested'
 *
 * // 객체 (String() 대신 빈 문자열 반환)
 * extractTextFromChildren({ temp: 20 }) // '' (not '[object Object]')
 *
 * // HAST 노드 (code-renderer에서 사용)
 * extractTextFromChildren({ type: 'text', value: 'code' }) // 'code'
 * ```
 */
export function extractTextFromChildren(children: any): string {
  // null/undefined
  if (children == null) return '';

  // 문자열
  if (typeof children === 'string') return children;

  // 숫자
  if (typeof children === 'number') return String(children);

  // 배열
  if (Array.isArray(children)) {
    return children.map((child) => extractTextFromChildren(child)).join('');
  }

  // HAST 노드 (code-renderer에서 사용)
  if (typeof children === 'object') {
    // HAST text 노드: { type: 'text', value: '...' }
    if ((children as any).type === 'text' && typeof (children as any).value === 'string') {
      return (children as any).value;
    }

    // React 요소: children 속성 재귀 추출
    if ((children as any).props?.children !== undefined) {
      return extractTextFromChildren((children as any).props.children);
    }

    // 중첩된 children 속성 (HAST 노드)
    if ((children as any).children) {
      return extractTextFromChildren((children as any).children);
    }

    // 기타 객체: [object Object] 대신 빈 문자열
    return '';
  }

  // 예상 불가능한 타입
  return '';
}

/**
 * React children을 문자열로 정규화 (공통 포매팅)
 *
 * `extractTextFromChildren`과 유사하지만 템플릿 리터럴에서 사용할 수 있도록
 * 더 엄격한 타입 검사를 수행합니다.
 *
 * @param children - React children
 * @param defaultValue - 추출 실패 시 기본값 (기본: '')
 * @returns 정규화된 문자열
 *
 * @example
 * ```ts
 * const text = normalizeChildrenToString(children, 'N/A');
 * console.log(`Title: ${text}`); // 객체가 오면 "Title: N/A"
 * ```
 */
export function normalizeChildrenToString(children: any, defaultValue = ''): string {
  const extracted = extractTextFromChildren(children);
  return extracted.trim().length > 0 ? extracted : defaultValue;
}
