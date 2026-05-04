/**
 * @file citation.ts
 * @description Citation 그룹 렌더링 헬퍼 함수
 *
 * **책임:**
 * - Citation 그룹 HTML 생성
 * - Base64 디코딩 및 텍스트 추출
 */

import { escapeHtml } from '../utils/common';
import { CITATION_STYLES } from '../utils/markdown-styles';

/**
 * Citation Group HTML 생성
 *
 * @param attrs - Citation 속성 (data-citations, data-first, data-count, data-encoding)
 * @returns HTML 문자열
 */
export function renderCitationGroup(attrs: {
  'data-citations'?: string;
  'data-count'?: string;
  'data-first'?: string;
  'data-encoding'?: string;
}): string {
  const count = attrs['data-count'] || '0';
  const firstData = attrs['data-first'] || '';
  const citationsData = attrs['data-citations'] || '';
  const encoding = attrs['data-encoding'] || '';

  // Base64 디코딩
  let firstText = '';
  try {
    const decoded = decodeURIComponent(atob(firstData));
    const match = decoded.match(/\[([^\]]+)\]/);
    firstText = match ? match[1] : '';
    // URL 인코딩 디코딩 시도
    try {
      firstText = decodeURIComponent(firstText);
    } catch {}
  } catch {}

  // 스트리밍 중에도 클릭 가능하도록 data 속성 포함
  return `<span class="${CITATION_STYLES.badgeHtml} streaming-citation-group" data-citations="${escapeHtml(citationsData)}" data-first="${escapeHtml(firstData)}" data-count="${count}" data-encoding="${encoding}">${escapeHtml(firstText)} +${Number(count)}</span>`;
}
