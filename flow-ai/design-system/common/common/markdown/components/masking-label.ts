/**
 * 보안 마스킹 라벨 렌더링
 *
 * <<이메일-0>> → 보라색 별표 패턴 + 툴팁 (라벨: "이메일")
 * <<이메일-1>> → 보라색 별표 패턴 + 툴팁 (라벨: "이메일")
 *
 * 백엔드에서 이미 한글 라벨로 변환되어 출력되므로 별도 매핑 불필요
 */

interface DecryptEntry {
  originalWord: string;
  detectionType: string;
}

// 렌더링 시점 글로벌 decrypt map (MarkdownRenderer에서 set/clear)
let _decryptMap: Map<string, DecryptEntry> | null = null;

export function setDecryptMapForRender(map: Map<string, DecryptEntry> | null) {
  _decryptMap = map;
}

export function clearDecryptMapForRender() {
  _decryptMap = null;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * <<라벨-N>> 에서 라벨 추출 (인덱스 제거)
 * @example "이메일-0" → "이메일"
 * @example "이메일-1" → "이메일"
 */
function extractLabel(rawLabel: string): string {
  return rawLabel.replace(/-\d+$/, '');
}

/**
 * 마스킹 라벨 HTML 렌더링
 *
 * @param rawLabel - <<>> 안의 원본 텍스트 (예: "이메일", "이메일-1")
 * @returns HTML 문자열
 */
export function renderMaskingLabel(rawLabel: string): string {
  const maskKey = `<<${rawLabel}>>`;
  const displayName = extractLabel(rawLabel);

  // decrypt map이 설정되어 있으면 복호화된 텍스트를 직접 렌더링
  if (_decryptMap && _decryptMap.has(maskKey)) {
    const entry = _decryptMap.get(maskKey)!;
    return `<span class="decrypted-text--static" title="${escapeHtml(displayName)}">${escapeHtml(entry.originalWord)}</span>`;
  }

  // 별표 아이콘 (SVG) - 10px × 10px
  const asteriskIcon = `<span class="inline-block w-2.5 h-2.5 relative"><svg viewBox="0 0 10 10" fill="none" class="w-full h-full text-primary"><line x1="5" y1="2.5" x2="5" y2="7.5" stroke="currentColor" stroke-width="0.8"/><line x1="2.83" y1="3.75" x2="7.17" y2="6.25" stroke="currentColor" stroke-width="0.8"/><line x1="2.83" y1="6.25" x2="7.17" y2="3.75" stroke="currentColor" stroke-width="0.8"/></svg></span>`;

  // 10개 별표 반복
  const asterisks = Array(10).fill(asteriskIcon).join('');

  return `<span class="masking-label inline-flex items-center py-[3px] border-b border-primary cursor-help" data-tooltip="${displayName}" data-mask-key="${maskKey}">${asterisks}</span>`;
}
