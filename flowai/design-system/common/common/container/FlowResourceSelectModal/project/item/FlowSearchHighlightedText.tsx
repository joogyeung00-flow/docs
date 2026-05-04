'use client';

import { memo, useMemo } from 'react';

export interface FlowSearchHighlightedTextProps {
  text: string;
  className?: string;
}

/**
 * 검색어 하이라이팅 컴포넌트
 * - API 응답의 `!#!keyword!#!` 패턴을 파싱해서 하이라이트 처리
 * - flow-main-d01 색상으로 강조
 */
export const FlowSearchHighlightedText = memo(function FlowSearchHighlightedText({
  text,
  className,
}: FlowSearchHighlightedTextProps) {
  const parts = useMemo(() => {
    if (!text) return [];

    // !#!...!#! 패턴 매칭
    const regex = /!#!(.+?)!#!/g;
    const result: { text: string; highlighted: boolean }[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      // 하이라이트 전 텍스트
      if (match.index > lastIndex) {
        result.push({
          text: text.slice(lastIndex, match.index),
          highlighted: false,
        });
      }

      // 하이라이트 텍스트
      result.push({
        text: match[1],
        highlighted: true,
      });

      lastIndex = regex.lastIndex;
    }

    // 남은 텍스트
    if (lastIndex < text.length) {
      result.push({
        text: text.slice(lastIndex),
        highlighted: false,
      });
    }

    return result;
  }, [text]);

  // 하이라이트 패턴이 없으면 그대로 반환
  if (parts.length === 0) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.highlighted ? (
          <span key={index} className='text-flow-main-d01 font-semibold'>
            {part.text}
          </span>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </span>
  );
});
