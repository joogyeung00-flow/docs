'use client';

import { ReactNode, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, X } from 'lucide-react';

// ============================================
// Field Type Definitions
// ============================================

interface SelectOption {
  value: string;
  label: string;
}

interface RadioOption {
  value: string;
  label: string;
  id: string;
}

interface BaseField {
  /** 필드 식별 키 (values 객체의 key) */
  name: string;
  /** 필드 라벨 */
  label: string;
  /** 라벨 아래 보조 설명 */
  hint?: ReactNode;
  /** 필수 여부 표시 */
  required?: boolean;
  /** 필수 표시 텍스트 (기본: '*필수') */
  requiredText?: string;
}

interface SelectField extends BaseField {
  type: 'select';
  placeholder?: string;
  options: SelectOption[];
}

interface TextareaField extends BaseField {
  type: 'textarea';
  placeholder?: string;
  /** textarea 높이 클래스 (기본: 'h-36') */
  heightClass?: string;
  /** 최대 글자 수 (초과 시 경고 표시 + 제출 비활성화) */
  maxLength?: number;
}

interface InputField extends BaseField {
  type: 'input';
  placeholder?: string;
  /** 최대 글자 수 (초과 시 경고 표시 + 제출 비활성화) */
  maxLength?: number;
}

interface RadioField extends BaseField {
  type: 'radio';
  options: RadioOption[];
  /** 라디오 방향 (기본: 'horizontal') */
  direction?: 'horizontal' | 'vertical';
}

interface CheckboxOption {
  value: string;
  label: string;
  id: string;
  /** 선택 시 텍스트 입력 필드 표시 (기타 옵션용) */
  hasTextInput?: boolean;
}

interface CheckboxField extends BaseField {
  type: 'checkbox';
  options: CheckboxOption[];
}

interface ConsentField {
  type: 'consent';
  name: string;
  /** 체크박스 옆에 링크로 표시할 텍스트 */
  label: string;
  /** 클릭 시 이동할 URL */
  href: string;
  required?: boolean;
  requiredText?: string;
}

export type FormField = SelectField | TextareaField | InputField | RadioField | CheckboxField | ConsentField;

// ============================================
// FormDialog Props
// ============================================

export interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  submitText: string;
  submittingText?: string;
  isSubmitting: boolean;
  onSubmit: (values: Record<string, string>) => void;
  /** 선언적 필드 정의 */
  fields: FormField[];
  /** 필드 초기값 */
  defaultValues?: Record<string, string>;
  className?: string;
  /** z-index 오버라이드 (overlay: zIndex, content: zIndex + 1) */
  zIndex?: number;
  /** overlay 추가 클래스 */
  overlayClassName?: string;
  /** maxLength 초과 시 표시할 경고 텍스트 콜백 */
  maxLengthWarning?: (max: number) => string;
}

/**
 * FormDialog - 필드 스키마 기반의 폼 다이얼로그
 *
 * @description
 * fields 배열로 select, textarea, input, radio 필드를 선언적으로 정의하면
 * 자동으로 폼 UI를 생성하고, onSubmit에 { [name]: value } 객체를 전달합니다.
 *
 * @example
 * ```tsx
 * <FormDialog
 *   open={open}
 *   onOpenChange={onOpenChange}
 *   title="업그레이드 신청"
 *   description="신청 후 안내드립니다."
 *   submitText="신청하기"
 *   isSubmitting={isSubmitting}
 *   onSubmit={(values) => console.log(values.plan, values.content)}
 *   fields={[
 *     {
 *       type: 'select',
 *       name: 'plan',
 *       label: '희망 요금제',
 *       placeholder: '요금제 선택',
 *       options: [
 *         { value: 'ai-pro', label: 'AI 프로' },
 *         { value: 'ai-ultra', label: 'AI 울트라' },
 *       ],
 *     },
 *     {
 *       type: 'textarea',
 *       name: 'content',
 *       label: '문의 내용',
 *       placeholder: '내용을 입력하세요',
 *     },
 *     {
 *       type: 'radio',
 *       name: 'contact',
 *       label: '안내 방식',
 *       options: [
 *         { value: 'phone', label: '유선 안내', id: 'phone' },
 *         { value: 'email', label: '이메일 안내', id: 'email' },
 *       ],
 *     },
 *   ]}
 *   defaultValues={{ content: '기본 내용', contact: 'phone' }}
 * />
 * ```
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitText,
  submittingText = '신청 중...',
  isSubmitting,
  onSubmit,
  fields,
  defaultValues = {},
  zIndex,
  overlayClassName,
  maxLengthWarning,
}: FormDialogProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of fields) {
      initial[field.name] = defaultValues[field.name] ?? '';
      if (field.type === 'checkbox') {
        initial[`${field.name}_other`] = defaultValues[`${field.name}_other`] ?? '';
      }
    }
    return initial;
  });

  // open될 때 defaultValues로 리셋
  useEffect(() => {
    if (open) {
      const initial: Record<string, string> = {};
      for (const field of fields) {
        initial[field.name] = defaultValues[field.name] ?? '';
        if (field.type === 'checkbox') {
          initial[`${field.name}_other`] = defaultValues[`${field.name}_other`] ?? '';
        }
      }
      setValues(initial);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const isRequiredValid = fields.filter((field) => field.required).every((field) => values[field.name]?.trim() !== '');
  const isMaxLengthValid = fields
    .filter(
      (field): field is InputField | TextareaField =>
        (field.type === 'input' || field.type === 'textarea') && !!field.maxLength,
    )
    .every((field) => (values[field.name]?.length ?? 0) <= field.maxLength!);
  const isFormValid = isRequiredValid && isMaxLengthValid;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className='inline-flex max-w-[512px] flex-col items-center justify-start gap-0 overflow-hidden p-0'
        closeButton={false}
        scroll='none'
        zIndex={zIndex}
        overlayClassName={overlayClassName}
      >
        {/* 헤더 - 고정 */}
        <div className='flex flex-col items-start justify-start gap-4 self-stretch px-6 pt-6'>
          <div className='flex flex-col items-start justify-center self-stretch'>
            <div className='inline-flex items-center justify-start gap-4 self-stretch'>
              <div className='inline-flex flex-1 flex-col items-start justify-start'>
                <DialogTitle className='text-foreground text-lg font-semibold leading-7'>{title}</DialogTitle>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className='hover:bg-accent flex items-center justify-center gap-2 rounded-md p-3'
              >
                <X className='text-foreground h-4 w-4' />
              </button>
            </div>
            {description && <div className='text-muted-foreground text-sm font-normal leading-5'>{description}</div>}
          </div>
          <div className='outline-border h-0 self-stretch outline outline-1 outline-offset-[-0.50px]' />
        </div>

        {/* 폼 영역 - 스크롤 */}
        <div className='flex min-h-0 flex-1 flex-col items-start justify-start gap-4 self-stretch overflow-y-auto px-8 py-6'>
          <div className='flex flex-col items-start justify-start gap-4 self-stretch'>
            {fields.map((field) => (
              <FormFieldRenderer
                key={field.name}
                field={field}
                value={values[field.name] ?? ''}
                onChange={(v) => handleChange(field.name, v)}
                otherValue={field.type === 'checkbox' ? values[`${field.name}_other`] : undefined}
                onOtherChange={field.type === 'checkbox' ? (v) => handleChange(`${field.name}_other`, v) : undefined}
                maxLengthWarning={maxLengthWarning}
              />
            ))}
          </div>
        </div>

        {/* 제출 버튼 - 고정 */}
        <div className='flex w-full flex-col items-end justify-center gap-3 px-6 pb-6'>
          <Button
            onClick={() => onSubmit(values)}
            disabled={isSubmitting || !isFormValid}
            className='h-12 self-stretch'
          >
            {isSubmitting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                {submittingText}
              </>
            ) : (
              submitText
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Field Renderer
// ============================================

function FormFieldRenderer({
  field,
  value,
  onChange,
  otherValue,
  onOtherChange,
  maxLengthWarning,
}: {
  field: FormField;
  value: string;
  onChange: (value: string) => void;
  otherValue?: string;
  onOtherChange?: (value: string) => void;
  maxLengthWarning?: (max: number) => string;
}) {
  if (field.type === 'consent') {
    return (
      <div className='flex items-center gap-2 self-stretch'>
        <Checkbox
          id={field.name}
          checked={value === 'Yes'}
          onCheckedChange={(checked) => onChange(checked ? 'Yes' : '')}
        />
        <label htmlFor={field.name} className='cursor-pointer text-sm font-normal leading-5'>
          <a
            href={field.href}
            target='_blank'
            rel='noopener noreferrer'
            className='text-primary underline'
            onClick={(e) => e.stopPropagation()}
          >
            {field.label}
          </a>
        </label>
        {field.required && (
          <div className='text-destructive text-xs font-normal leading-4'>{field.requiredText ?? '*필수'}</div>
        )}
      </div>
    );
  }

  return (
    <div className='flex flex-col items-start justify-start gap-3 self-stretch'>
      {/* 라벨 + 힌트 */}
      <div className='flex flex-col items-start justify-end gap-1.5 self-stretch'>
        <div className='inline-flex items-end gap-1.5 self-stretch'>
          <div className='text-foreground text-sm font-medium leading-5'>{field.label}</div>
          {field.required && (
            <div className='text-destructive text-xs font-normal leading-4'>{field.requiredText ?? '*필수'}</div>
          )}
        </div>
        {field.hint && <div className='text-muted-foreground text-xs font-normal leading-4'>{field.hint}</div>}
      </div>

      {/* 필드 본체 */}
      {field.type === 'select' && (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className='min-w-40'>
            <SelectValue placeholder={field.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {field.type === 'textarea' && (
        <>
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`resize-none text-xs leading-5 ${field.heightClass ?? 'h-36'}`}
            placeholder={field.placeholder}
          />
          {maxLengthWarning && field.maxLength && value.length > field.maxLength && (
            <p className='text-destructive text-xs'>{maxLengthWarning(field.maxLength)}</p>
          )}
        </>
      )}

      {field.type === 'input' && (
        <>
          <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />
          {maxLengthWarning && field.maxLength && value.length > field.maxLength && (
            <p className='text-destructive text-xs'>{maxLengthWarning(field.maxLength)}</p>
          )}
        </>
      )}

      {field.type === 'radio' && (
        <RadioGroup
          value={value}
          onValueChange={onChange}
          className={field.direction === 'vertical' ? 'flex flex-col gap-3' : 'flex gap-3'}
        >
          {field.options.map((opt) => (
            <div key={opt.value} className='flex items-center justify-start gap-1.5'>
              <RadioGroupItem value={opt.value} id={opt.id} />
              <label htmlFor={opt.id} className='text-popover-foreground cursor-pointer text-sm font-normal leading-5'>
                {opt.label}
              </label>
            </div>
          ))}
        </RadioGroup>
      )}

      {field.type === 'checkbox' &&
        (() => {
          const selected = value ? value.split(',') : [];
          const hasOtherOption = field.options.some((opt) => opt.hasTextInput);
          const otherOptionChecked =
            hasOtherOption && field.options.some((opt) => opt.hasTextInput && selected.includes(opt.value));

          const toggleCheckbox = (optValue: string, checked: boolean) => {
            const next = checked ? [...selected, optValue] : selected.filter((v) => v !== optValue);
            onChange(next.join(','));
          };

          return (
            <div className='flex flex-col gap-3 self-stretch'>
              <div className='flex flex-wrap content-start items-start justify-start gap-4 self-stretch'>
                {field.options.map((opt) => (
                  <div key={opt.value} className='flex items-center justify-start gap-1.5'>
                    <Checkbox
                      id={opt.id}
                      checked={selected.includes(opt.value)}
                      onCheckedChange={(checked) => toggleCheckbox(opt.value, !!checked)}
                    />
                    <label
                      htmlFor={opt.id}
                      className='text-popover-foreground cursor-pointer text-xs font-normal leading-5'
                    >
                      {opt.label}
                    </label>
                  </div>
                ))}
              </div>
              {otherOptionChecked && onOtherChange && (
                <Input
                  value={otherValue ?? ''}
                  onChange={(e) => onOtherChange(e.target.value)}
                  className='self-stretch'
                />
              )}
            </div>
          );
        })()}
    </div>
  );
}
