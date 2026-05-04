import type { DecryptMapEntry } from '@/lib/api/security-masking';
import { MASKING_LABEL_PATTERN } from '@flowai/shared';
import type { ReactNode } from 'react';

function extractLabel(rawLabel: string): string {
  return rawLabel.replace(/-\d+$/, '');
}

function AsteriskIcon() {
  return (
    <span className='relative inline-block h-2.5 w-2.5'>
      <svg viewBox='0 0 10 10' fill='none' className='text-primary h-full w-full'>
        <line x1='5' y1='2.5' x2='5' y2='7.5' stroke='currentColor' strokeWidth='0.8' />
        <line x1='2.83' y1='3.75' x2='7.17' y2='6.25' stroke='currentColor' strokeWidth='0.8' />
        <line x1='2.83' y1='6.25' x2='7.17' y2='3.75' stroke='currentColor' strokeWidth='0.8' />
      </svg>
    </span>
  );
}

function MaskingLabelInline({
  maskKey,
  decryptMap,
}: {
  maskKey: string;
  decryptMap?: Map<string, DecryptMapEntry> | null;
}) {
  const rawLabel = maskKey.slice(2, -2);
  const displayName = extractLabel(rawLabel);

  if (decryptMap?.has(maskKey)) {
    const entry = decryptMap.get(maskKey)!;
    return (
      <span className='decrypted-text--static' title={displayName}>
        {entry.originalWord}
      </span>
    );
  }

  return (
    <span
      className='masking-label border-primary inline-flex cursor-help items-center border-b py-[3px]'
      data-tooltip={displayName}
      data-mask-key={maskKey}
    >
      {Array.from({ length: 10 }, (_, i) => (
        <AsteriskIcon key={i} />
      ))}
    </span>
  );
}

/**
 * 텍스트 내 마스킹 라벨(<<타입-N>>)을 React 노드로 변환
 * - decryptMap이 null → 보라색 밑줄 SVG 별표
 * - decryptMap이 있고 키 존재 → decrypted-text--static 스타일로 원본값 표시
 * - 마스킹 라벨이 없으면 원본 텍스트 그대로 반환
 */
export function resolveWithMaskingLabels(text: string, decryptMap?: Map<string, DecryptMapEntry> | null): ReactNode {
  if (!text) return text;

  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(MASKING_LABEL_PATTERN.source, 'g');

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(<MaskingLabelInline key={`mask-${match.index}`} maskKey={match[0]} decryptMap={decryptMap} />);
    lastIndex = regex.lastIndex;
  }

  if (lastIndex === 0) return text;
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}
