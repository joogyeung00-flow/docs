'use client';

import { usePromptGuardDetail } from '@/hooks/api/use-prompt-guard-status';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useChatConfig } from '@/hooks/useChatConfig';
import { useChatTypeConfig } from '@/hooks/useChatTypeConfig';
import { useCompanyStore } from '@/stores/company.store';
import { useChatSelectors } from '@/stores/hooks/useChatSelectors';
import { i18n } from '@flowai/i18n';
import { Loader2 } from 'lucide-react';
import { BannedWordSection } from './BannedWordSection';
import { CleanChatSection } from './CleanChatSection';
import { SecurityMaskingSection } from './SecurityMaskingSection';

/**
 * 프롬프트 가드 다이얼로그 (InputFieldContainer와 동일 조건)
 * - 보안마스킹 enabled = isSecurityMaskingActive (isAble && isAvailable && securityMaskingEnabled)
 */
export function PromptGuardDialogContent() {
  const { t } = useAppTranslation('common');
  const { type: chatType } = useChatSelectors();
  const isAbleSecurityMasking = useChatConfig('securityMasking');
  const { canToggleSecurityMasking } = useChatTypeConfig(chatType);
  const securityMaskingEnabled = useCompanyStore((s) => s.securityMaskingEnabled);
  const { data, isLoading } = usePromptGuardDetail();

  if (isLoading) {
    return (
      <div className='flex min-h-[400px] items-center justify-center p-6'>
        <Loader2 size={24} className='text-muted-foreground animate-spin' />
      </div>
    );
  }

  const isSecurityMaskingAvailable = canToggleSecurityMasking();
  const securityMaskingEnabledForSection =
    isAbleSecurityMasking && isSecurityMaskingAvailable && (securityMaskingEnabled ?? false);

  return (
    <div className='flex flex-1 flex-col gap-3'>
      {/* 설명 */}
      <p className='text-muted-foreground overflow-y-auto px-4 text-sm leading-5 md:px-0'>
        {t(i18n.common.prompt_guard_dialog.description)}
      </p>

      {/* 구분선 */}
      <div className='bg-border h-px w-full' />

      {/* 섹션들 */}
      <div className='flex flex-col gap-3 px-4 md:px-0'>
        <SecurityMaskingSection
          enabled={securityMaskingEnabledForSection}
          presidioEntities={data?.securityMasking.presidioEntities ?? []}
          maskingWords={data?.securityMasking.maskingWords ?? []}
        />

        <BannedWordSection enabled={data?.bannedWords.enabled ?? false} words={data?.bannedWords.words ?? []} />

        <CleanChatSection enabled={data?.cleanChat.enabled ?? false} />
      </div>
    </div>
  );
}
