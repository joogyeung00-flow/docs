'use client';

import { CardDescription } from '@/components/ui/card';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { VectorReference, isVectorReferenceFileMetadata } from '@flowai/shared';
import { i18n } from '@flowai/i18n';

interface ReferenceDetailCardDescriptionProps {
  reference: VectorReference;
  type: 'detail' | 'card';
}

/**
 * VectorReference용 상세 카드 설명 컴포넌트
 * NOTE: 프로젝트 관련 분기 제거됨 (FlowSearchReference로 대체)
 */
export default function ReferenceDetailCardDescription({
  reference,
  type = 'card',
}: ReferenceDetailCardDescriptionProps) {
  const { t } = useAppTranslation('common');

  const getDescription = () => {
    if (isVectorReferenceFileMetadata(reference.metadata)) {
      return t(i18n.common.reference.file_pages, { pages: reference.metadata.pages.join(', ') });
    }
    return reference.title;
  };

  const getDetailDescription = () => {
    return reference.title;
  };

  return (
    <CardDescription className='flex h-fit w-fit justify-start gap-2 p-0'>
      <span className={`text-sm font-medium leading-5 text-black`}>
        {type === 'detail' ? getDetailDescription() : getDescription()}
      </span>
    </CardDescription>
  );
}
