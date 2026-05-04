'use client';

import { useAppTranslation } from '@/hooks/useAppTranslation';
import { i18n } from '@flowai/i18n';
import { Search } from 'lucide-react';
import { Button } from '../../ui/button';

interface SearchButtonProps {
  onClick?: () => void;
  className?: string;
}

export function SearchButton({ onClick, className = '' }: SearchButtonProps) {
  const { t } = useAppTranslation('common');
  return (
    <Button variant='outline' onClick={onClick} className={`gap-2 ${className}`}>
      <Search className='h-4 w-4' />
      <span className='text-sm font-medium text-slate-950'>{t(i18n.common.ui.search)}</span>
    </Button>
  );
}
