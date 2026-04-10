'use client';

import { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { Z_INDEX } from '@/constants/z-index';
import { UsageCount } from '@flowai/shared';
import { i18n } from '@flowai/i18n';
import { AlertCircle } from 'lucide-react';

/**
 * 무한대 아이콘 컴포넌트
 */
export const InfinityIcon = () => (
  <svg width='12' height='6' viewBox='0 0 16 8' fill='none' xmlns='http://www.w3.org/2000/svg'>
    <path
      d='M3.66667 7.33333C2.64444 7.33333 1.77778 6.97778 1.06667 6.26667C0.355556 5.55556 0 4.68889 0 3.66667C0 2.64444 0.355556 1.77778 1.06667 1.06667C1.77778 0.355556 2.64444 0 3.66667 0C4.07778 0 4.47222 0.0722222 4.85 0.216667C5.22778 0.361111 5.56667 0.566667 5.86667 0.833333L7 1.86667L6 2.76667L4.96667 1.83333C4.78889 1.67778 4.58889 1.55556 4.36667 1.46667C4.14444 1.37778 3.91111 1.33333 3.66667 1.33333C3.02222 1.33333 2.47222 1.56111 2.01667 2.01667C1.56111 2.47222 1.33333 3.02222 1.33333 3.66667C1.33333 4.31111 1.56111 4.86111 2.01667 5.31667C2.47222 5.77222 3.02222 6 3.66667 6C3.91111 6 4.14444 5.95556 4.36667 5.86667C4.58889 5.77778 4.78889 5.65556 4.96667 5.5L10.1333 0.833333C10.4333 0.566667 10.7722 0.361111 11.15 0.216667C11.5278 0.0722222 11.9222 0 12.3333 0C13.3556 0 14.2222 0.355556 14.9333 1.06667C15.6444 1.77778 16 2.64444 16 3.66667C16 4.68889 15.6444 5.55556 14.9333 6.26667C14.2222 6.97778 13.3556 7.33333 12.3333 7.33333C11.9222 7.33333 11.5278 7.26111 11.15 7.11667C10.7722 6.97222 10.4333 6.76667 10.1333 6.5L9 5.46667L10 4.56667L11.0333 5.5C11.2111 5.65556 11.4111 5.77778 11.6333 5.86667C11.8556 5.95556 12.0889 6 12.3333 6C12.9778 6 13.5278 5.77222 13.9833 5.31667C14.4389 4.86111 14.6667 4.31111 14.6667 3.66667C14.6667 3.02222 14.4389 2.47222 13.9833 2.01667C13.5278 1.56111 12.9778 1.33333 12.3333 1.33333C12.0889 1.33333 11.8556 1.37778 11.6333 1.46667C11.4111 1.55556 11.2111 1.67778 11.0333 1.83333L5.86667 6.5C5.56667 6.76667 5.22778 6.97222 4.85 7.11667C4.47222 7.26111 4.07778 7.33333 3.66667 7.33333Z'
      fill='currentColor'
    />
  </svg>
);

/**
 * 기능 태그 컴포넌트
 */
export const FeatureTag = ({ label }: { label: string }) => (
  <div className='bg-background flex items-center justify-center gap-2.5 rounded px-2.5 py-0.5 outline outline-1 outline-offset-[-1px] outline-slate-200'>
    <span className='text-xs font-normal leading-5 text-slate-950'>{label}</span>
  </div>
);

/**
 * 사용량 섹션 컴포넌트 Props
 */
export interface UsageSectionProps {
  title: string;
  description: string;
  usageData: UsageCount | null;
  colorClass: 'primary' | 'sky';
  features: string[];
  availableKey: 'default' | 'premium';
}

/**
 * 사용량 섹션 컴포넌트
 * 회사 전체 AI 사용 현황 및 고급 기능 사용 현황을 표시
 */
export const UsageSection = ({
  title,
  description,
  usageData,
  colorClass,
  features,
  availableKey,
}: UsageSectionProps) => {
  const { t } = useAppTranslation('common');
  const { usedCount, totalLimit, remainingCount, usagePercentage, isUnlimited, isExhausted } = useMemo(() => {
    if (!usageData) {
      return {
        usedCount: 0,
        totalLimit: 0,
        remainingCount: 0,
        usagePercentage: 0,
        isUnlimited: false,
        isExhausted: false,
      };
    }

    const usedCount = availableKey === 'premium' ? usageData.premiumTotal || 0 : usageData.total || 0;
    const totalLimit = usageData.availableUsage?.[availableKey] || 0;

    // 음수이면 무제한
    if (totalLimit < 0) {
      return {
        usedCount,
        totalLimit: 0,
        remainingCount: 0,
        usagePercentage: 100,
        isUnlimited: true,
        isExhausted: false,
      };
    }

    const remainingCount = Math.max(0, totalLimit - usedCount);
    const usagePercentage = totalLimit > 0 ? Math.min(100, (usedCount / totalLimit) * 100) : 0;
    // 10% 이하로 남았을 때 소진 경고 표시
    const isExhausted = totalLimit > 0 && remainingCount <= totalLimit * 0.1;

    return { usedCount, totalLimit, remainingCount, usagePercentage, isUnlimited: false, isExhausted };
  }, [usageData, availableKey]);

  const progressColorClass = isExhausted ? 'bg-red-500' : colorClass === 'primary' ? 'bg-primary' : 'bg-sky-600';
  const textColorClass = isExhausted ? 'text-red-500' : colorClass === 'primary' ? 'text-primary' : 'text-sky-600';
  const outlineColorClass = isExhausted
    ? 'outline-red-500'
    : colorClass === 'primary'
      ? 'outline-primary'
      : 'outline-sky-600';

  return (
    <div
      className={`flex flex-col items-start justify-start gap-6 self-stretch rounded-lg p-5 outline outline-1 outline-offset-[-1px] ${
        isExhausted ? 'bg-pink-50 outline-red-500' : 'bg-slate-50 outline-slate-200'
      }`}
    >
      {/* 헤더 */}
      <div className='flex items-start justify-between gap-1 self-stretch'>
        <div className='flex flex-1 flex-col items-start justify-center gap-1'>
          <div className='line-clamp-1 self-stretch text-base font-semibold leading-5 text-slate-950'>{title}</div>
          <div className='text-muted-foreground line-clamp-1 self-stretch text-sm font-normal leading-5'>
            {description}
          </div>
        </div>
        {isExhausted && (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertCircle className='h-6 w-6 cursor-pointer text-red-500' />
              </TooltipTrigger>
              <TooltipContent
                side='top'
                className='max-w-[320px] whitespace-pre-line bg-slate-800 text-white'
                style={{ zIndex: Z_INDEX.TOOLTIP }}
              >
                <p className='text-xs leading-5'>
                  {availableKey === 'default'
                    ? t(i18n.common.usage_section.exhausted_tooltip_ai)
                    : t(i18n.common.usage_section.exhausted_tooltip_premium)}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* 사용량 정보 */}
      <div className='flex flex-col items-start justify-start gap-4 self-stretch'>
        <div className='flex flex-col items-start justify-start gap-2 self-stretch'>
          {/* 무제한 라벨 또는 일반 사용량 표시 */}
          {isUnlimited ? (
            <div className='flex items-center justify-between self-stretch'>
              <div
                className={`bg-muted flex items-center justify-center gap-1 rounded-lg px-2 py-1 outline outline-1 outline-offset-[-1px] ${outlineColorClass} ${textColorClass}`}
              >
                <InfinityIcon />
                <span className={`text-2xs font-normal ${textColorClass}`}>
                  {t(i18n.common.usage_section.unlimited_label)}
                </span>
              </div>
              <div className='flex items-center justify-start gap-1'>
                <span className='text-accent-foreground text-sm font-medium'>
                  {t(i18n.common.usage_section.current)}
                </span>
                <span className={`${textColorClass} text-sm font-medium`}>{usedCount.toLocaleString()}</span>
                <span className={`${textColorClass} text-sm font-medium`}>
                  {t(i18n.common.usage_section.times_unit)}
                </span>
                <span className='text-accent-foreground text-sm font-medium'>
                  {t(i18n.common.usage_section.used_suffix)}
                </span>
              </div>
            </div>
          ) : isExhausted ? (
            <div className='flex items-center justify-start gap-1 self-stretch'>
              <span className='text-sm font-medium text-red-500'>{remainingCount.toLocaleString()}</span>
              <span className='text-sm font-medium text-red-500'>{t(i18n.common.usage_section.times_unit)}</span>
              <span className='text-accent-foreground text-sm font-medium'>
                {t(i18n.common.usage_section.remaining_suffix)}
              </span>
            </div>
          ) : (
            <div className='flex items-center justify-start gap-1 self-stretch'>
              <span className='text-accent-foreground text-sm font-medium'>{t(i18n.common.usage_section.current)}</span>
              <span className={`${textColorClass} text-sm font-medium`}>{remainingCount.toLocaleString()}</span>
              <span className={`${textColorClass} text-sm font-medium`}>{t(i18n.common.usage_section.times_unit)}</span>
              <span className='text-accent-foreground text-sm font-medium'>
                {t(i18n.common.usage_section.remaining_suffix)}
              </span>
              <span className='text-muted-foreground text-sm font-normal'>
                {t(i18n.common.usage_section.total_times, { count: totalLimit })}
              </span>
            </div>
          )}

          {/* 진행바 */}
          <div className='relative h-2 self-stretch overflow-hidden rounded-[900px] bg-slate-200'>
            <div
              className={`absolute left-0 top-0 h-2 ${progressColorClass} rounded-[900px]`}
              style={{ width: `${isUnlimited ? 100 : usagePercentage}%` }}
            />
          </div>
        </div>

        {/* 기능 태그 */}
        <div className='flex flex-wrap items-start justify-start gap-2'>
          {features.map((feature) => (
            <FeatureTag key={feature} label={feature} />
          ))}
        </div>
      </div>
    </div>
  );
};
