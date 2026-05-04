/**
 * @file streaming-highlight.util.ts
 * @description 스트리밍 중 칩 클릭 시 부모 블록 하이라이팅 유틸리티
 *
 * 스트리밍 시에는 React 컴포넌트가 아닌 marked.js가 생성한 HTML이므로
 * 직접 DOM을 조작하여 하이라이팅을 적용합니다.
 */

import {
  BLOCK_SELECTORS,
  CHIP_SELECTORS,
  HIGHLIGHT_BLOCK_ATTR,
  HIGHLIGHT_MARK_ATTR,
  HIGHLIGHT_MARK_STYLE,
} from './constants';

/**
 * 스트리밍 중 칩 클릭 시 부모 블록 내 칩 이전 콘텐츠만 하이라이팅
 *
 * @param chipElement 클릭된 칩 요소
 */
export function highlightStreamingChipBlock(chipElement: HTMLElement): void {
  // 기존 하이라이트 제거
  clearStreamingBlockHighlights();

  // 부모 블록 찾아서 칩 이전 콘텐츠만 하이라이팅
  const blockParent = chipElement.closest(BLOCK_SELECTORS);
  if (!(blockParent instanceof HTMLElement)) return;

  const range = document.createRange();

  // 블록 내 현재 칩 이전에 위치한 칩들 중 가장 마지막 것을 찾아 시작점으로 사용
  const allChipsInBlock = Array.from(blockParent.querySelectorAll<HTMLElement>(CHIP_SELECTORS));
  const chipsBeforeCurrent = allChipsInBlock.filter(
    (chip) => chip !== chipElement && chipElement.compareDocumentPosition(chip) & Node.DOCUMENT_POSITION_PRECEDING,
  );
  const prevChip = chipsBeforeCurrent.at(-1);

  if (prevChip) {
    range.setStartAfter(prevChip);
  } else {
    range.setStart(blockParent, 0);
  }
  range.setEndBefore(chipElement);

  if (range.collapsed) return;

  const mark = document.createElement('mark');
  mark.setAttribute('style', HIGHLIGHT_MARK_STYLE);
  mark.setAttribute(HIGHLIGHT_MARK_ATTR, 'streaming');

  try {
    range.surroundContents(mark);
    blockParent.setAttribute(HIGHLIGHT_BLOCK_ATTR, 'streaming');
  } catch {
    const contents = range.extractContents();
    mark.appendChild(contents);
    range.insertNode(mark);
    blockParent.setAttribute(HIGHLIGHT_BLOCK_ATTR, 'streaming');
  }
}

/**
 * 모든 스트리밍 블록 하이라이트 제거
 */
export function clearStreamingBlockHighlights(): void {
  document.querySelectorAll(`[${HIGHLIGHT_MARK_ATTR}]`).forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    while (mark.firstChild) {
      parent.insertBefore(mark.firstChild, mark);
    }
    parent.removeChild(mark);
    parent.normalize();
  });

  document.querySelectorAll(`[${HIGHLIGHT_BLOCK_ATTR}]`).forEach((el) => {
    el.removeAttribute(HIGHLIGHT_BLOCK_ATTR);
  });
}

/**
 * 모든 칩의 하이라이팅을 제거 (VR/WS/FS 칩의 시각적 하이라이트)
 * Reference 패널을 닫을 때 호출하여 모든 칩 선택 상태를 초기화합니다.
 */
export function clearAllChipHighlights(): void {
  const selectors = [
    '.streaming-vr-group.streaming-vr-highlighted',
    '.streaming-ws-group.streaming-ws-highlighted',
    '.streaming-fs-group.streaming-fs-highlighted',
  ];

  document.querySelectorAll(selectors.join(',')).forEach((el) => {
    el.classList.remove(
      'streaming-vr-highlighted',
      'streaming-ws-highlighted',
      'streaming-fs-highlighted',
      'border-2',
      'border-purple-500',
      '!bg-purple-100',
    );
    el.querySelector('span')?.classList.remove('text-purple-700', '!text-purple-700');
  });

  // 블록 하이라이트도 함께 제거
  clearStreamingBlockHighlights();
}
