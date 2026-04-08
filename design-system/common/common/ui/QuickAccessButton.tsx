'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

type ToggleVariant = 'star' | 'check';

interface QuickAccessButtonProps {
  isQuickAccess: boolean;
  onToggle: (e: React.MouseEvent) => void;
  disabled?: boolean;
  className?: string;
  variant?: ToggleVariant;
}

export function QuickAccessButton({
  isQuickAccess,
  onToggle,
  disabled,
  className,
  variant = 'star',
}: QuickAccessButtonProps) {
  return (
    <button
      type='button'
      onClick={onToggle}
      disabled={disabled}
      className={cn('h-6 w-6 p-0 transition-colors', disabled && 'pointer-events-none opacity-50', className)}
      aria-label={isQuickAccess ? '빠른 접근 해제' : '빠른 접근 추가'}
    >
      {variant === 'check' ? (
        <div
          className={cn(
            'flex h-[18px] w-[18px] items-center justify-center rounded-sm border transition-colors',
            isQuickAccess ? 'border-primary bg-primary text-white' : 'border-slate-300 bg-white text-transparent',
          )}
        >
          <Check className='h-3 w-3' strokeWidth={3} />
        </div>
      ) : (
        <svg
          className={cn(
            'h-[18px] w-[18px]',
            isQuickAccess ? 'fill-[#FFB800] text-[#FFB800]' : 'fill-none text-slate-300',
          )}
          viewBox='0 0 24 24'
          stroke='currentColor'
          strokeWidth='2'
        >
          <path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' />
        </svg>
      )}
    </button>
  );
}
