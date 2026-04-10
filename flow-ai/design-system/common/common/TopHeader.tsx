'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface TopHeaderProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
  };
  className?: string;
  children?: React.ReactNode;
}

export default function TopHeader({ title, subtitle, action, className = '', children }: TopHeaderProps) {
  return (
    <div className={cn('flex h-[60px] w-full items-center justify-between', className)}>
      <div className='flex flex-col'>
        {title && <div className='ko-h4 text-shadcn-ui-app-foreground whitespace-nowrap'>{title}</div>}
        {subtitle && <div className='text-muted-foreground mt-1 text-sm'>{subtitle}</div>}
      </div>

      <div className='flex items-center gap-2'>
        {action && (
          <Button
            className={cn(action.variant === 'default' && 'bg-flow-main-d01', 'rounded-md px-4 py-2')}
            variant={action.variant || 'default'}
            size={action.size || 'default'}
            onClick={action.onClick}
            disabled={action.disabled || action.loading}
          >
            {action.loading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                <span className='text-primary-foreground text-sm'>{action.label}</span>
              </>
            ) : (
              <span className='text-primary-foreground text-sm'>{action.label}</span>
            )}
          </Button>
        )}
        {children}
      </div>
    </div>
  );
}
