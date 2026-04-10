import { cn } from '@/lib/utils';

type MiddleHeaderProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
};

export default function MiddleHeader({ title, description, className }: MiddleHeaderProps) {
  return (
    <header className={cn('space-y-1 py-2', className)}>
      <h2 className='text-xl font-semibold leading-none tracking-tight'>{title}</h2>
      {description ? <p className='text-muted-foreground text-sm'>{description}</p> : null}
    </header>
  );
}
