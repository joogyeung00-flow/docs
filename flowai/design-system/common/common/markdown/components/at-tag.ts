/**
 * @file at-tag.ts
 * @description AT 멘션 태그 렌더링 헬퍼 함수
 *
 * **책임:**
 * - AT 멘션 태그 HTML 생성
 * - Base64 디코딩 및 데이터 파싱
 */

import { escapeHtml } from '../utils/common';

/**
 * AT Tag 스타일
 */
const AT_TAG_STYLES = {
  wrapper: 'text-primary font-semibold',
};

/**
 * AT (Mention Tag) 속성 인터페이스
 */
export interface AtTagAttrs {
  action?: string;
  data?: string;
}

/**
 * AT Tag data 속성 디코딩
 * base64 인코딩된 데이터 또는 직접 JSON 문자열 모두 지원
 */
function decodeAtTagData(data: string): { type?: string; title?: string; url?: string } | null {
  if (!data) return null;

  // 1. base64 디코딩 시도
  try {
    const decoded = decodeURIComponent(atob(data));
    return JSON.parse(decoded);
  } catch {
    // base64 디코딩 실패
  }

  // 2. 직접 JSON 파싱 시도 (fallback - 레거시 형식 지원)
  try {
    return JSON.parse(data);
  } catch {
    // JSON 파싱도 실패
  }

  return null;
}

/**
 * AT Tag HTML 생성 (멘션 태그 렌더링)
 *
 * @param attrs - AT 태그 속성 (action, data)
 * @param displayText - 표시 텍스트
 * @returns HTML 문자열
 *
 * @example
 * // base64 인코딩 형식 (권장)
 * <at action="link" data="base64EncodedJSON">뉴스제목</at>
 *
 * // 레거시 형식 (하위 호환)
 * <at action="search" data='{"type":"news","title":"뉴스제목"}'>뉴스제목</at>
 *
 * → <span class="text-primary font-semibold">뉴스제목</span>
 */
export function renderAtTag(attrs: AtTagAttrs, displayText: string): string {
  // data 속성에서 정보 추출 시도
  let title = displayText;
  let dataType = '';
  let dataUrl = '';

  const parsed = decodeAtTagData(attrs.data || '');
  if (parsed) {
    title = displayText || parsed.title || '';
    dataType = parsed.type || '';
    dataUrl = parsed.url || '';
  }

  const tooltip = dataUrl || title;

  return `<span class="${AT_TAG_STYLES.wrapper}" data-at-action="${escapeHtml(attrs.action || '')}" data-at-type="${escapeHtml(dataType)}" title="${escapeHtml(tooltip)}">${escapeHtml(title)}</span>`;
}
