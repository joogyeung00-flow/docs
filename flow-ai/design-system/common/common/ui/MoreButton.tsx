'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface MoreButtonProps {
  onClick?: () => void;
  loading?: boolean;
  label?: string;
  loadingLabel?: string;
  className?: string;
}

/**
 * MoreButton - 목록 하단 "더보기" 버튼
 *
 * @example
 * ```tsx
 * {hasMore && (
 *   <MoreButton onClick={handleLoadMore} loading={isLoading} />
 * )}
 * ```
 */
export function MoreButton({
  onClick,
  loading = false,
  label = '더 보기',
  loadingLabel = '불러오는 중...',
  className,
}: MoreButtonProps) {
  return (
    <div className='flex justify-center py-2'>
      <button
        type='button'
        onClick={onClick}
        disabled={loading}
        className={cn(
          'rounded-lg bg-zinc-100 px-6 py-2 text-sm font-medium text-zinc-700 transition-colors',
          'hover:bg-zinc-200',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
      >
        {loading ? (
          <>
            <Loader2 className='mr-2 inline-block h-4 w-4 animate-spin' />
            {loadingLabel}
          </>
        ) : (
          label
        )}
      </button>
    </div>
  );
}
