'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export interface FlowDiagramConfig {
  /** 시작점/원본 (좌측) */
  from: string;
  /** 이전 상태 (우측 상단, 흐림 처리) */
  before: string;
  /** 이후 상태 (우측 하단, 강조) */
  after: string;
  /** 추가 안내 메시지 */
  note?: ReactNode;
}

interface FlowDiagramProps {
  config: FlowDiagramConfig;
  /** 박스 너비 (기본값: 100) */
  boxWidth?: number;
  /** 박스 높이 (기본값: 36) */
  boxHeight?: number;
  /** 박스 간격 (기본값: 12) */
  gap?: number;
  className?: string;
}

/**
 * FlowDiagram - 상태 변경 흐름을 시각화하는 분기 다이어그램 컴포넌트
 *
 * @description
 * 시작점에서 두 갈래로 분기되어 이전/이후 상태를 보여주는 다이어그램입니다.
 * SVG 곡선과 애니메이션을 사용하여 변경 흐름을 직관적으로 표현합니다.
 * 필드 매칭 변경, 상태 전환, 워크플로우 분기 등 다양한 곳에서 사용할 수 있습니다.
 *
 * @example
 * ```tsx
 * // 필드 매칭 변경
 * <FlowDiagram
 *   config={{
 *     from: '3 Depth',
 *     before: '업무명',
 *     after: '상태',
 *   }}
 * />
 *
 * // 상태 전환
 * <FlowDiagram
 *   config={{
 *     from: '주문',
 *     before: '대기',
 *     after: '처리중',
 *   }}
 * />
 *
 * // 노트 포함
 * <FlowDiagram
 *   config={{
 *     from: '원본',
 *     before: '현재',
 *     after: '변경',
 *     note: '다른 항목은 영향받지 않습니다.',
 *   }}
 * />
 *
 * // 커스텀 사이즈
 * <FlowDiagram
 *   config={{
 *     from: '시작',
 *     before: '이전',
 *     after: '이후',
 *   }}
 *   boxWidth={120}
 *   boxHeight={40}
 *   gap={16}
 * />
 * ```
 */
export function FlowDiagram({ config, boxWidth = 100, boxHeight = 36, gap = 12, className }: FlowDiagramProps) {
  const { from, before, after, note } = config;

  const svgWidth = 50;
  const svgHeight = boxHeight * 2 + gap;

  // 곡선 좌표 계산
  const startY = svgHeight / 2;
  const topY = boxHeight / 2;
  const bottomY = svgHeight - boxHeight / 2;

  // 곡선 경로
  const topPath = `M 0 ${startY} C ${svgWidth * 0.6} ${startY}, ${svgWidth * 0.4} ${topY}, ${svgWidth} ${topY}`;
  const bottomPath = `M 0 ${startY} C ${svgWidth * 0.6} ${startY}, ${svgWidth * 0.4} ${bottomY}, ${svgWidth} ${bottomY}`;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className='flex items-center justify-center'>
        {/* 시작점 (좌측) */}
        <div
          className='bg-muted text-foreground flex shrink-0 items-center justify-center truncate rounded-lg border px-3 text-sm font-medium'
          style={{ width: boxWidth, height: boxHeight }}
        >
          {from}
        </div>

        {/* SVG 분기선 */}
        <svg width={svgWidth} height={svgHeight} className='shrink-0'>
          {/* 이전 경로 (흐릿한 곡선) */}
          <path d={topPath} fill='none' stroke='currentColor' strokeWidth='1.5' className='text-muted-foreground/30' />
          {/* 이후 경로 배경 (글로우) */}
          <path d={bottomPath} fill='none' stroke='currentColor' strokeWidth='4' className='text-primary/15' />
          {/* 이후 경로 (강조 곡선) */}
          <path d={bottomPath} fill='none' stroke='currentColor' strokeWidth='1.5' className='text-primary' />
          {/* 흐르는 점 애니메이션 */}
          <circle r='2.5' fill='currentColor' className='text-primary'>
            <animateMotion dur='1s' repeatCount='indefinite' path={bottomPath} />
          </circle>
        </svg>

        {/* 상태들 (우측) */}
        <div className='flex flex-col' style={{ gap }}>
          {/* 이전 상태 (흐려짐) */}
          <div
            className='text-muted-foreground/40 flex items-center justify-center rounded-lg border border-dashed text-sm line-through'
            style={{ width: boxWidth, height: boxHeight }}
          >
            {before}
          </div>

          {/* 이후 상태 (강조) */}
          <div
            className='bg-primary text-primary-foreground shadow-primary/20 flex items-center justify-center rounded-lg text-sm font-semibold shadow-md'
            style={{ width: boxWidth, height: boxHeight }}
          >
            {after}
          </div>
        </div>
      </div>

      {note && (
        <p className='text-muted-foreground bg-muted/50 mx-auto rounded-md px-3 py-1.5 text-center text-xs'>{note}</p>
      )}
    </div>
  );
}

export default FlowDiagram;
