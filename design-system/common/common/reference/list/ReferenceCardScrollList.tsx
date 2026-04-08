'use client';

import ReferenceCardList from '@/components/agent/common/reference/ReferenceCardList';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Reference } from '@flowai/shared';
import { ReactNode, RefObject } from 'react';

interface ReferenceCardScrollListProps {
  referenceList: Reference[];
  scrollAreaRef: RefObject<HTMLDivElement | null>;
  onCardRef: (key: string, el: HTMLDivElement | null) => void;
  emptyState?: ReactNode;
}

/**
 * Reference 카드 목록을 스크롤 영역 내에 렌더링하는 컴포넌트
 *
 * ScrollArea + ReferenceCardList를 조합합니다.
 * 상태 없는 순수 UI 컴포넌트입니다.
 */
export function ReferenceCardScrollList({
  referenceList,
  scrollAreaRef,
  onCardRef,
  emptyState,
}: ReferenceCardScrollListProps) {
  if (referenceList.length === 0 && emptyState) {
    return <div className='flex h-full w-full items-center justify-center'>{emptyState}</div>;
  }

  return (
    <ScrollArea ref={scrollAreaRef} className='h-full w-full min-w-0 overflow-hidden'>
      <div className='flex w-full min-w-0 flex-col gap-3 p-3'>
        {referenceList.map((reference, globalIndex) => (
          <ReferenceCardList
            key={globalIndex}
            reference={reference}
            onWsCardRef={onCardRef}
            onVrCardRef={onCardRef}
            onFsCardRef={onCardRef}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
