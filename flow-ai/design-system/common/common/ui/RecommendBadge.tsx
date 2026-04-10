import { cn } from '@/lib/utils';

interface RecommendBadgeProps {
  className?: string;
}

export function RecommendBadge({ className }: RecommendBadgeProps) {
  return (
    <div
      className={cn(
        'text-2xs flex h-4 w-4 items-center justify-center rounded-sm bg-[#02a39e] font-semibold leading-none text-white shadow-sm',
        className,
      )}
    >
      👍
    </div>
  );
}
