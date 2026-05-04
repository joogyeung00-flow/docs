import { cn } from '@/lib/utils';

interface GradationTextProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Shimmer 그라데이션 효과가 적용된 텍스트 컴포넌트
 *
 * - bg-clip-text + text-transparent로 그라데이션 텍스트 구현
 * - animate-shimmer로 좌→우 shimmer 효과
 * - 외부에서 className으로 hover 동작, 패딩 등 커스터마이징 가능
 */
export function GradationText({ children, className }: GradationTextProps) {
  return (
    <span
      className={cn(
        // 기본 스타일
        'inline-flex items-center font-semibold',

        // Shimmer Effect 핵심 스타일
        'animate-shimmer',
        'bg-clip-text',
        'text-transparent',
        'bg-gradient-to-r',
        'bg-[size:400%_100%]',

        // 라이트 모드: 어두운 베이스 → 밝은 shimmer (배경과 대비 유지)
        'from-gray-600 via-gray-400 to-gray-600',

        // 다크 모드: 밝은 베이스 → 더 밝은 shimmer (배경과 대비 유지)
        'dark:from-gray-300 dark:via-white dark:to-gray-300',

        className,
      )}
    >
      {children}
    </span>
  );
}
