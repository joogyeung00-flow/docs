'use client';

import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { FlexibleDialog } from '@/components/common/ui/FlexibleDialog';
import { PromptGuardDialogContent } from './PromptGuardDialogContent';
import { useChatSelectors } from '@/stores/hooks/useChatSelectors';
import { useChatConfig } from '@/hooks/useChatConfig';
import { useChatTypeConfig } from '@/hooks/useChatTypeConfig';
import { useChatConfigInitialized } from '@/stores/chat-config.store';
import { useCompanyStore } from '@/stores/company.store';
import { i18n } from '@flowai/i18n';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { usePromptGuardDetail } from '@/hooks/api/use-prompt-guard-status';

interface PromptGuardBadgeProps {
  className?: string;
}

/**
 * 프롬프트 가드 배지 (InputFieldContainer와 동일 조건)
 * - 노출: isAbleSecurityMasking && isSecurityMaskingAvailable (showSecurityMaskingInMenu)
 * - 활성(primary): 위 조건 + securityMaskingEnabled (isSecurityMaskingActive)
 */
export function PromptGuardBadge({ className = '' }: PromptGuardBadgeProps) {
  const { t } = useAppTranslation('common');
  const [open, setOpen] = useState(false);
  const { type: chatType } = useChatSelectors();
  const isAbleSecurityMasking = useChatConfig('securityMasking');
  const { canToggleSecurityMasking } = useChatTypeConfig(chatType);
  const securityMaskingEnabled = useCompanyStore((s) => s.securityMaskingEnabled);
  const isConfigInitialized = useChatConfigInitialized();
  const { data, isLoading } = usePromptGuardDetail();

  // 설정 초기화 전 또는 데이터 로딩 중에는 렌더링하지 않음
  if (!isConfigInitialized || isLoading) return null;

  const isSecurityMaskingAvailable = canToggleSecurityMasking();
  const isSecurityMaskingActive =
    isAbleSecurityMasking && isSecurityMaskingAvailable && (securityMaskingEnabled ?? false);

  // 셋 중 하나라도 활성화 되어 있으면 활성화
  const isActive = isSecurityMaskingActive || data?.bannedWords.enabled || data?.cleanChat.enabled;

  // 활성화 상태에 따른 색상 클래스
  const colorClass = isActive ? 'text-primary' : 'text-gray-400';
  const outlineClass = isActive ? 'outline-primary' : 'outline-gray-400';

  return (
    <>
      {/* 데스크톱: 텍스트 포함 pill 형태 */}
      <button
        type='button'
        onClick={() => setOpen(true)}
        className={`bg-background hidden cursor-pointer items-center gap-1.5 rounded-full px-2 py-1 outline outline-1 outline-offset-[-1px] transition-opacity hover:opacity-80 sm:inline-flex ${outlineClass} ${className}`}
      >
        <ShieldCheck className={`h-4 w-4 ${colorClass}`} />
        <span className={`text-xs font-medium ${colorClass}`}>{t(i18n.common.prompt_guard_dialog.title)}</span>
        {isActive ? (
          <span className='relative flex h-2.5 w-2.5'>
            <span className='bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75' />
            <span className='bg-primary relative inline-flex h-2.5 w-2.5 rounded-full' />
          </span>
        ) : (
          <div className='h-2.5 w-2.5 rounded-full bg-gray-400' />
        )}
      </button>

      {/* 모바일: 원형 배경 안에 방패 아이콘, 활성화 시 우상단 깜빡이는 dot */}
      <button
        type='button'
        onClick={() => setOpen(true)}
        className={`relative inline-flex cursor-pointer items-center justify-center rounded-full p-1.5 outline outline-[1px] outline-offset-[-2px] transition-opacity hover:opacity-80 sm:hidden ${outlineClass} bg-background ${className}`}
      >
        <ShieldCheck className={`h-4 w-4 ${colorClass}`} />
        {isActive && (
          <span className='absolute right-[1px] top-[1px] flex h-2 w-2'>
            <span className='bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75' />
            <span className='bg-primary relative inline-flex h-2 w-2 rounded-full' />
          </span>
        )}
      </button>

      <FlexibleDialog
        open={open}
        onOpenChange={setOpen}
        title={t(i18n.common.prompt_guard_dialog.title)}
        contentClassName='px-0'
      >
        <div className='overflow-y-auto'>
          <PromptGuardDialogContent />
        </div>
      </FlexibleDialog>
    </>
  );
}
export default PromptGuardBadge;
