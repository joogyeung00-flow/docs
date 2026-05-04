/**
 * @file index.ts
 * @description 블록 하이라이팅 시스템 모듈 진입점
 *
 * 하이라이팅 시스템:
 * - 칩 클릭 시 부모 블록 요소(p/li/td/blockquote) 내 칩 이전 콘텐츠를 <mark>로 감싸 하이라이팅
 * - marked.js 렌더링 결과에 대해 Range API로 DOM 직접 조작
 * - 인덱스 추적 불필요
 */

// Constants
export {
  BLOCK_SELECTORS,
  HIGHLIGHT_BLOCK_ATTR,
  HIGHLIGHT_MARK_ATTR,
  HIGHLIGHT_MARK_STYLE,
  CHIP_SELECTORS,
} from './constants';

// Utilities (스트리밍용)
export {
  clearAllChipHighlights,
  clearStreamingBlockHighlights,
  highlightStreamingChipBlock,
} from './streaming-highlight.util';
