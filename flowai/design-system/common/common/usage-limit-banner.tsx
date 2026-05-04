'use client';

import { useAppTranslation } from '@/hooks/useAppTranslation';
import { usePlanLimitStore } from '@/stores/plan-limit.store';
import { i18n } from '@flowai/i18n';
import { AlertCircle, X } from 'lucide-react';

export type UsageLimitType = 'default' | 'premium';

interface UsageLimitBannerProps {
  type: UsageLimitType;
}

/**
 * 일반 사용자용 AI 사용량 한도 초과 배너
 * 화면 최상단에 고정으로 표시됩니다.
 */
export function UsageLimitBanner({ type }: UsageLimitBannerProps) {
  const { t } = useAppTranslation('common');
  const showDefaultBanner = usePlanLimitStore((s) => s.showDefaultLimitBanner);
  const showPremiumBanner = usePlanLimitStore((s) => s.showPremiumLimitBanner);
  const dismissDefaultBanner = usePlanLimitStore((s) => s.dismissDefaultBanner);
  const dismissPremiumBanner = usePlanLimitStore((s) => s.dismissPremiumBanner);

  const showBanner = type === 'default' ? showDefaultBanner : showPremiumBanner;
  const dismissBanner = type === 'default' ? dismissDefaultBanner : dismissPremiumBanner;
  const content =
    type === 'default'
      ? {
          title: t(i18n.common.usage_limit_banner.title_default),
          description: t(i18n.common.usage_limit_banner.description_default),
        }
      : {
          title: t(i18n.common.usage_limit_banner.title_premium),
          description: t(i18n.common.usage_limit_banner.description_premium),
        };

  if (!showBanner) return null;

  return (
    <div className='bg-background outline-destructive pointer-events-auto relative inline-flex w-full max-w-[550px] items-start justify-start gap-2 rounded-lg p-3 shadow-lg outline outline-1 outline-offset-[-1px] sm:gap-3 sm:p-4'>
      {/* 아이콘 */}
      <div className='flex shrink-0 items-start justify-start pt-0.5'>
        <AlertCircle className='text-destructive h-4 w-4' />
      </div>

      {/* 텍스트 내용 */}
      <div className='inline-flex min-w-0 flex-1 flex-col items-start justify-start gap-1 pr-6'>
        <div className='text-destructive text-xs font-semibold leading-5 sm:text-sm'>{content.title}</div>
        <div
          className='text-destructive text-xs font-normal leading-5 sm:text-sm'
          dangerouslySetInnerHTML={{ __html: content.description.replace(/\n/g, '<br/>') }}
        />
      </div>

      {/* 닫기 버튼 */}
      <button
        onClick={dismissBanner}
        className='absolute right-1.5 top-1.5 rounded p-1 opacity-50 transition-opacity hover:opacity-100 sm:right-2 sm:top-2'
        aria-label={t(i18n.common.usage_limit_banner.close_aria)}
      >
        <X className='text-foreground h-4 w-4' />
      </button>
    </div>
  );
}
