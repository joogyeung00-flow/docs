/**
 * @file code-block-expand.ts
 * @description 코드블록 펼침/접힘 상태 캡처 및 복원 유틸
 *
 * 스트리밍 중 innerHTML 교체, 스트리밍→final 전환 시
 * 사용자가 펼쳐놓은 코드블록 상태를 유지하기 위해 사용
 */

/** 스트리밍→final 전환 시 펼쳐진 코드블록 인덱스 전달용 맵 */
export const expandedCodeBlocksMap = new Map<number, Set<number>>();

/** 컨테이너 내 펼쳐진 코드블록 인덱스 캡처 */
export function captureExpandedCodeBlocks(container: Element): Set<number> {
  const expanded = new Set<number>();
  container.querySelectorAll('.streaming-code-block').forEach((block, i) => {
    const btn = block.querySelector('.code-expand-btn') as HTMLElement | null;
    if (btn && (btn.classList.contains('expanded') || btn.style.display === 'none')) expanded.add(i);
  });
  return expanded;
}

/** 컨테이너 내 코드블록에 펼침 상태 적용 */
export function restoreExpandedCodeBlocks(container: Element, expanded: Set<number>) {
  if (expanded.size === 0) return;
  container.querySelectorAll('.streaming-code-block').forEach((block, i) => {
    if (!expanded.has(i)) return;
    block.querySelector('.code-content')?.classList.remove('code-content-collapsed');
    const btn = block.querySelector('.code-expand-btn') as HTMLElement | null;
    if (btn) {
      btn.classList.add('expanded');
      btn.style.display = 'none';
    }
  });
}
