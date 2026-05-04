'use client';

import { Button } from '@/components/ui/button';
import { CardHeader } from '@/components/ui/card';
import { CircleArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { getFileIcon, getReferenceDetailCardTitle } from '@/components/agent/assistant/util/assistant-util';
import { VectorReference } from '@flowai/shared';
import ReferenceDetailCardDescription from './ReferenceDetailCardDescription';

interface ReferenceDetailCardHeaderProps {
  selectedVectorReferenceCard: VectorReference;
  setSelectedVectorReferenceCard: (reference: VectorReference | null) => void;
}

export default function ReferenceDetailCardHeader({
  selectedVectorReferenceCard,
  setSelectedVectorReferenceCard,
}: ReferenceDetailCardHeaderProps) {
  return (
    <CardHeader className='flex w-full flex-row items-center justify-start px-2 py-0'>
      <Button variant='ghost' className='px-3' onClick={() => setSelectedVectorReferenceCard(null)}>
        <CircleArrowLeft className='h-4 w-4' />
      </Button>
      <div className='flex flex-col gap-1'>
        <div className='flex items-center gap-2'>
          <Image
            src={getFileIcon(selectedVectorReferenceCard)}
            alt='Reference Icon'
            width={16}
            height={16}
            className='min-h-4 min-w-4'
          />
          <div className='text-sm font-normal leading-5 text-gray-500'>
            {getReferenceDetailCardTitle(selectedVectorReferenceCard)}
          </div>
        </div>
        {/* 레퍼런스 디스크립션 - 2 Depth 표시 */}
        <ReferenceDetailCardDescription reference={selectedVectorReferenceCard} type='detail' />
      </div>
    </CardHeader>
  );
}
