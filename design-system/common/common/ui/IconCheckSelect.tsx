'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { i18n } from '@flowai/i18n';
import type { LucideIcon } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface IconCheckSelectProps {
  value: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
  icon?: LucideIcon;
  placeholder?: string;
  className?: string;
  checkPosition?: 'left' | 'right';
  showIcon?: boolean;
  showChevron?: boolean;
}

export function IconCheckSelect({
  value,
  options,
  onValueChange,
  icon: Icon,
  placeholder,
  className = 'h-10 w-auto min-w-[144px]',
  checkPosition = 'right',
  showIcon = true,
  showChevron = true,
}: IconCheckSelectProps) {
  const { t } = useAppTranslation('common');
  const resolvedPlaceholder = placeholder ?? t(i18n.common.ui.select_placeholder);
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={`gap-2 rounded-md border-slate-200 bg-white py-0 ${className}`}
        hideChevron={!showChevron}
      >
        <div className='flex w-full min-w-0 items-center gap-2'>
          {showIcon && Icon && <Icon className='h-4 w-4 shrink-0 text-slate-950' />}
          <span className='truncate text-sm font-normal text-slate-950'>
            <SelectValue placeholder={resolvedPlaceholder} />
          </span>
        </div>
      </SelectTrigger>
      <SelectContent align='end' checkPosition={checkPosition}>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
