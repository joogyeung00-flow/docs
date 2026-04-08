'use client';

import * as React from 'react';
import { useCallback, useId, useState } from 'react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { i18n } from '@flowai/i18n';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface LabeledInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  className?: string;
  id?: string;
  description?: string;
  readOnly?: boolean;
  onClick?: () => void;
  displayValue?: string;
  error?: string;
}

function CharacterCounter({
  current,
  max,
  isOverLimit,
  className,
}: {
  current: number;
  max: number;
  isOverLimit: boolean;
  className?: string;
}) {
  return (
    <span className={cn('text-xs', isOverLimit ? 'text-red-500' : 'text-slate-500', className)}>
      {current.toLocaleString()}/{max.toLocaleString()}
    </span>
  );
}

function useFieldValidation(maxLength: number, onChange: (value: string) => void) {
  const [isAttemptedOverLimit, setIsAttemptedOverLimit] = useState(false);

  const handleChange = useCallback(
    (newValue: string) => {
      if (newValue.length > maxLength) {
        setIsAttemptedOverLimit(true);
        onChange(newValue.slice(0, maxLength));
      } else {
        setIsAttemptedOverLimit(false);
        onChange(newValue);
      }
    },
    [onChange, maxLength],
  );

  return { isAttemptedOverLimit, handleChange };
}

const LabeledInput = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, LabeledInputProps>(
  (
    {
      label,
      value,
      onChange,
      maxLength,
      required = false,
      placeholder,
      disabled = false,
      multiline = false,
      rows = 3,
      className,
      id: propId,
      description,
      readOnly = false,
      onClick,
      displayValue,
      error,
    },
    ref,
  ) => {
    const { t } = useAppTranslation('common');
    const generatedId = useId();
    const id = propId ?? generatedId;
    const { isAttemptedOverLimit, handleChange } = useFieldValidation(maxLength, onChange);
    const hasError = !!error;

    const inputClassName = cn(
      'rounded-md border px-3 py-2 text-sm transition-colors focus:outline-none',
      !multiline && 'h-10',
      hasError
        ? 'border-red-300 bg-red-50 text-red-900 placeholder:text-red-400'
        : 'border-slate-300 bg-white text-slate-900 hover:border-slate-400',
      multiline && 'resize-none',
      readOnly && 'cursor-pointer',
    );

    return (
      <div className={cn('flex w-full flex-col gap-2', className)}>
        <div className='flex items-center justify-between'>
          <Label htmlFor={id} className={cn('text-sm font-medium', hasError ? 'text-red-500' : 'text-slate-900')}>
            {label}
            {required && <span className='text-2xs ml-1 text-red-400'>{t(i18n.common.labeled_input.required)}</span>}
          </Label>
          <CharacterCounter current={value.length} max={maxLength} isOverLimit={isAttemptedOverLimit} />
        </div>

        {multiline ? (
          <Textarea
            id={id}
            ref={ref as React.Ref<HTMLTextAreaElement>}
            value={displayValue ?? value}
            onChange={(e) => handleChange(e.target.value)}
            className={inputClassName}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            readOnly={readOnly}
            onClick={onClick}
          />
        ) : (
          <Input
            id={id}
            ref={ref as React.Ref<HTMLInputElement>}
            value={displayValue ?? value}
            onChange={(e) => handleChange(e.target.value)}
            className={inputClassName}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            onClick={onClick}
          />
        )}

        {description && <span className='whitespace-pre-line text-xs text-slate-500'>{description}</span>}
        {error && <div className='text-xs text-red-500'>{error}</div>}
        {!error && isAttemptedOverLimit && (
          <div className='text-xs text-red-500'>
            {t(i18n.common.labeled_input.max_length, { max: maxLength.toLocaleString() })}
          </div>
        )}
      </div>
    );
  },
);

LabeledInput.displayName = 'LabeledInput';

export { LabeledInput };
export type { LabeledInputProps };
