'use client';

import { cn } from '@/lib/utils';

export type PromptGuardBadgeItemType = 'presidio' | 'masking' | 'banned';

interface PromptGuardBadgeItemProps {
  label: string;
  type: PromptGuardBadgeItemType;
}

const BADGE_STYLES: Record<PromptGuardBadgeItemType, string> = {
  presidio: 'bg-red-50 text-red-700 border-red-200', // 형식 일치 (빨강)
  masking: 'bg-orange-50 text-orange-700 border-orange-200', // 문자 일치 (주황)
  banned: 'bg-orange-50 text-orange-700 border-orange-200', // 금칙어 (주황)
};

/**
 * 프롬프트 가드 팝업 내 항목 표시용 작은 배지
 * - presidio: 형식 일치 (빨강)
 * - masking: 문자 일치 (주황)
 * - banned: 금칙어 (주황)
 */
export function PromptGuardBadgeItem({ label, type }: PromptGuardBadgeItemProps) {
  return (
    <span
      className={cn(
        'text-2xs inline-flex items-center rounded-full border px-1.5 py-[3px] font-normal',
        BADGE_STYLES[type],
      )}
    >
      {label}
    </span>
  );
}
