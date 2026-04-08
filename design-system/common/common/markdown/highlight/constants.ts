/**
 * @file constants.ts
 * @description 블록 하이라이팅 시스템 상수 정의
 *
 * 하이라이팅 시스템:
 * - 칩 클릭 시 부모 블록 요소(p/li/td/blockquote) 내 칩 이전 콘텐츠를 <mark>로 감싸 하이라이팅
 * - 인덱스 추적 없음
 * - Range API를 통한 DOM 직접 조작
 */

/**
 * 하이라이트된 블록을 식별하는 data 속성명
 */
export const HIGHLIGHT_BLOCK_ATTR = 'data-highlight-block';

/**
 * 칩 이전 콘텐츠 하이라이팅 <mark> 요소의 data 속성명
 */
export const HIGHLIGHT_MARK_ATTR = 'data-highlight-mark';

/**
 * 칩 이전 콘텐츠 하이라이팅 <mark> 요소 인라인 스타일
 */
export const HIGHLIGHT_MARK_STYLE = 'background-color: rgba(91, 64, 248, 0.15); border-radius: 2px; color: inherit;';

/**
 * 블록 요소 셀렉터 (하이라이팅 대상)
 */
export const BLOCK_SELECTORS = 'p, li, td, blockquote, h1, h2, h3, h4, h5, h6';

/**
 * 출처 칩 요소 셀렉터 (VR / WS / FS 모두 포함)
 */
export const CHIP_SELECTORS = '.streaming-vr-group, .streaming-ws-group, .streaming-fs-group';
