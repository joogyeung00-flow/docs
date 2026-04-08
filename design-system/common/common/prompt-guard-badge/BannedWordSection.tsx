'use client';

import { i18n } from '@flowai/i18n';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import type { RestrictedWord } from '@/lib/api/prompt-guard';
import { PromptGuardBadgeItem } from './PromptGuardBadgeItem';

interface BannedWordSectionProps {
  enabled: boolean;
  words: RestrictedWord[];
}

/**
 * 금칙어 차단 섹션
 */
export function BannedWordSection({ enabled, words }: BannedWordSectionProps) {
  const { t } = useAppTranslation('common');

  return (
    <div className='outline-border flex flex-col gap-4 rounded-xl p-3 outline outline-1 outline-offset-[-1px]'>
      <div className='flex flex-col gap-1.5'>
        <div className='flex items-center gap-3'>
          <span className='text-foreground text-sm font-medium leading-5'>
            {t(i18n.common.prompt_guard_dialog.section_banned_words)}
          </span>
          {enabled ? (
            <div className='flex items-center gap-1'>
              <span className='relative flex h-2.5 w-2.5'>
                <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2EAD55] opacity-75' />
                <span className='relative inline-flex h-2.5 w-2.5 rounded-full bg-[#2EAD55]' />
              </span>
              <span className='text-2xs font-medium leading-5 text-[#2EAD55]'>
                {t(i18n.common.prompt_guard_dialog.status_applied)}
              </span>
            </div>
          ) : (
            <div className='flex items-center gap-1'>
              <div className='h-2.5 w-2.5 rounded-full bg-gray-400' />
              <span className='text-2xs font-medium leading-5 text-gray-400'>
                {t(i18n.common.prompt_guard_dialog.status_disabled)}
              </span>
            </div>
          )}
        </div>
        <p className='text-muted-foreground text-xs leading-5'>
          {t(i18n.common.prompt_guard_dialog.section_banned_words_description)}
        </p>
      </div>
      {words.length > 0 && (
        <div className='flex flex-wrap gap-1.5'>
          {words.map((word) => (
            <PromptGuardBadgeItem key={word.id} label={word.word} type='banned' />
          ))}
        </div>
      )}
    </div>
  );
}
