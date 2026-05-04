import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ReactNode } from 'react';

export interface SingleToggleItem {
  value: string;
  icon: ReactNode;
  ariaLabel: string;
}

interface SingleToggleGroupProps {
  items: SingleToggleItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  variant?: 'dark' | 'light';
}

export default function SingleToggleGroup({
  items,
  defaultValue,
  value,
  onValueChange,
  className,
  variant = 'dark',
}: SingleToggleGroupProps) {
  const itemClass =
    variant === 'dark'
      ? 'h-[22px] text-neutral-300 data-[state=on]:bg-neutral-700 data-[state=on]:text-white'
      : 'h-[22px] text-neutral-600 data-[state=on]:bg-neutral-300 data-[state=on]:text-neutral-900';

  const handleValueChange = (newValue: string) => {
    // 이미 선택된 항목을 다시 클릭하면 빈 문자열이 오는데, 이를 무시
    if (newValue && onValueChange) {
      onValueChange(newValue);
    }
  };

  return (
    <ToggleGroup
      type='single'
      defaultValue={defaultValue}
      value={value}
      onValueChange={handleValueChange}
      className={className}
    >
      {items.map((item) => (
        <ToggleGroupItem key={item.value} value={item.value} aria-label={item.ariaLabel} className={itemClass}>
          {item.icon}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
