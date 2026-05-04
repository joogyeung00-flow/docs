'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FlowDiagram } from '@/components/common/ui/FlowDiagram';
import { Z_INDEX } from '@/constants/z-index';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useDialog } from '@/hooks/use-dialog';
import { useSkipMatchingField } from '@/hooks/useSkipMatchingField';
import { cn } from '@/lib/utils';
import { i18n } from '@flowai/i18n';
import { getEffectiveColumnInfo, isSystemFieldId } from '@/lib/utils/matching-field.utils';
import { MatchingFieldType } from '@flowai/prompt';
import { FIELD_TYPE, PREDEFINED_COLUMNS } from '@flowai/shared';
import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type DropdownVariant = 'default' | 'custom' | 'error';
type MatchingFieldItemType = MatchingFieldType['matchingFields'][number];
type OriginJsonType = MatchingFieldItemType['original'];
type MatchingJsonType = MatchingFieldItemType['matching'];
interface MatchingFieldDropdownProps {
  originJson: OriginJsonType;
  matchingJson: MatchingJsonType;
  isWarnFocus?: boolean;
  disableDropdown?: boolean;
  onSend?: (message: string) => Promise<void>;
}
type MatchingFieldOptionBuilderProps = MatchingFieldDropdownProps & { currentValue?: string | 'skip' };

const variantLabelClass: Record<DropdownVariant, string> = {
  default: 'text-popover-foreground text-ellipsis overflow-hidden',
  custom: 'text-primary text-ellipsis overflow-hidden',
  error: 'text-destructive text-ellipsis overflow-hidden',
};

const baseTriggerClass =
  'bg-background border-input ring-offset-background inline-flex w-full min-w-32 items-center justify-between rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';

const getBaseMenuClass = () =>
  `bg-popover border-border mt-1 min-w-32 max-w-sm rounded-md border p-[5px] shadow-lg inline-flex flex-col`;

export function MatchingFieldDropdown({
  originJson,
  matchingJson,
  isWarnFocus: isHighlighted,
  disableDropdown = false,
  onSend,
}: MatchingFieldDropdownProps) {
  const { t } = useAppTranslation('common');
  const SKIP_LABEL = t(i18n.common.matching_field_dropdown.skip_label);

  const { showConfirm } = useDialog();
  const { applySkip, applyRestore } = useSkipMatchingField();

  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = internalOpen;
  const handleOpenChange = (next: boolean) => setInternalOpen(next);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [menuWidth, setMenuWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    const el = triggerRef.current;
    if (!el) return;
    const update = () => setMenuWidth(el.offsetWidth);
    update();
    const RO = (typeof window !== 'undefined' && (window as any).ResizeObserver) || undefined;
    let ro: any;
    if (RO) {
      ro = new RO(() => update());
      ro.observe(el);
    } else if (typeof window !== 'undefined') {
      window.addEventListener('resize', update);
    }
    return () => {
      if (ro) ro.disconnect();
      else if (typeof window !== 'undefined') window.removeEventListener('resize', update);
    };
  }, [isOpen]);

  const originalKey = useMemo(() => (originJson as any)?.colName ?? (originJson as any)?.key ?? '', [originJson]);
  const [initialMatchingJson, setInitialMatchingJson] = useState<MatchingJsonType | undefined>();
  const [currentMatchingName, setCurrentMatchingName] = useState<string | undefined>();

  useEffect(() => {
    if (
      initialMatchingJson === undefined &&
      matchingJson &&
      matchingJson.column &&
      'type' in matchingJson.column &&
      FIELD_TYPE.includes(matchingJson.column.type)
    ) {
      setInitialMatchingJson(matchingJson);
    }

    const columnInfo = getEffectiveColumnInfo(matchingJson);
    setCurrentMatchingName(columnInfo.name);
  }, [matchingJson]);

  const initialType = useMemo(() => {
    if (!initialMatchingJson) return undefined;
    const info = getEffectiveColumnInfo(initialMatchingJson);
    return info?.type;
  }, [initialMatchingJson]);

  const getTranslatedFieldName = (fieldId?: string, fallbackName?: string) => {
    if (!fieldId) return fallbackName ?? '';
    const key = (i18n.common.predefined_fields as Record<string, { k: string; v: string }>)[fieldId];
    return key ? t(key) : (fallbackName ?? '');
  };

  const renderTrigger = () => {
    if (!matchingJson) return null;
    const isSkip = matchingJson.id === 'skip' || matchingJson.type === 'skip';
    const isPredefined = matchingJson.type === 'predefined' || isSystemFieldId(matchingJson.id);
    const label = isSkip
      ? SKIP_LABEL
      : isPredefined
        ? getTranslatedFieldName(matchingJson.id, currentMatchingName)
        : currentMatchingName;
    const variant = isSkip ? 'error' : !isPredefined ? 'custom' : 'default';
    return (
      <button
        ref={triggerRef}
        type='button'
        aria-disabled={disableDropdown}
        className={cn(baseTriggerClass, isHighlighted && 'border-red-500/80 ring-1 ring-red-500/80')}
      >
        <span className={cn(variantLabelClass[variant], 'max-w-[calc(100%-1.25rem)] truncate')}>{label}</span>
        {!disableDropdown && <ChevronDown className='h-4 w-4 opacity-50' />}
      </button>
    );
  };

  const getFieldTypeLabel = (type?: string) => {
    if (!type) return '';
    const key = (i18n.common.field_type_labels as Record<string, { k: string; v: string }>)[type];
    return key ? t(key) : type;
  };

  const buildMatchingFieldOptions = ({ originJson, matchingJson }: MatchingFieldOptionBuilderProps) => {
    if (!originJson) return [];

    const columnInfo = getEffectiveColumnInfo(matchingJson);
    if (!columnInfo || typeof columnInfo !== 'object' || !('name' in columnInfo) || !('type' in columnInfo)) return [];

    const { name, type: currentType } = columnInfo;
    if (matchingJson && name && !Object.values(columnInfo).includes(name)) return [];

    // predefined 필드: id 기반으로 옵션 생성, 번역된 라벨 사용
    const predefinedOptions = PREDEFINED_COLUMNS.map((col) => ({
      value: col.name,
      label: getTranslatedFieldName(col.id, col.name),
      fieldId: col.id,
      fieldType: col.type,
    }));

    // 커스텀 필드: original 또는 현재 매칭의 이름
    // LLM이 공백을 정규화할 수 있으므로 (예: "플로우  담당자" → "플로우 담당자") trim + 연속 공백 제거로 비교
    const normalizeSpaces = (s: string) => s.trim().replace(/\s+/g, ' ');
    const customNames = [(originJson as any)?.colName ?? (originJson as any)?.key ?? '', name].filter(
      (v) => v !== '' && !PREDEFINED_COLUMNS.some((col) => col.name === v),
    );
    const uniqueCustomNames = Array.from(new Set(customNames.map(normalizeSpaces)));

    type OptionItem = {
      value: string;
      label: string;
      selected: boolean;
      typeLabel: string;
      disabled: boolean;
      variant: string;
    };
    const options: OptionItem[] = [];

    // predefined 옵션
    for (const po of predefinedOptions) {
      const optionType = po.fieldType;
      const typeLabel = optionType || initialType ? getFieldTypeLabel(optionType ?? initialType) : '';
      const disabled = !(optionType === initialType || optionType === 'TEXT');
      options.push({
        value: po.value,
        label: po.label,
        selected: name === po.value,
        typeLabel,
        disabled,
        variant: 'default',
      });
    }

    // 커스텀 옵션
    for (const customName of uniqueCustomNames) {
      options.push({
        value: customName,
        label: customName,
        selected: name === customName,
        typeLabel: getFieldTypeLabel(currentType || 'TEXT'),
        disabled: !(currentType === initialType || currentType === 'TEXT'),
        variant: 'custom',
      });
    }

    // 스킵 옵션
    options.push({
      value: SKIP_LABEL,
      label: SKIP_LABEL,
      selected: name === SKIP_LABEL,
      typeLabel: '',
      disabled: false,
      variant: 'error',
    });

    return options;
  };

  const buildFieldChangeMessage = (
    type: 'skip' | 'system' | 'custom',
    targetValue: string,
    systemId?: string,
  ): string => {
    const colName = originalKey;
    const originalType = getEffectiveColumnInfo(matchingJson)?.type ?? 'TEXT';

    if (type === 'skip') {
      return t(i18n.common.matching_field_dropdown.prompt_exclude, { colName, originalType });
    }

    if (type === 'system' && systemId) {
      return t(i18n.common.matching_field_dropdown.prompt_change_predefined, {
        colName,
        originalType,
        targetValue,
        systemId,
      });
    }

    // custom
    return t(i18n.common.matching_field_dropdown.prompt_change_same_type, {
      colName,
      originalType,
      targetValue,
    });
  };

  const getConfirmContent = (type: 'skip' | 'system' | 'custom', key: string, nextValue?: string) => {
    const source = key;
    // 현재 매칭 필드가 predefined이면 번역된 이름 사용
    const isPredefined = matchingJson?.type === 'predefined';
    const currentField = isPredefined
      ? getTranslatedFieldName(matchingJson?.id, currentMatchingName || key)
      : currentMatchingName || key;
    const newField = type === 'skip' ? SKIP_LABEL : (nextValue ?? '');

    return <FlowDiagram config={{ from: source, before: currentField, after: newField }} />;
  };

  const showSelectionConfirm = async (
    type: 'skip' | 'system' | 'custom',
    targetValue: string = '',
    systemId?: string,
  ) => {
    const title = t(i18n.common.matching_field_dropdown.confirm_title);
    const displayValue = type === 'system' && systemId ? getTranslatedFieldName(systemId, targetValue) : targetValue;
    const description = getConfirmContent(type, originalKey, displayValue);

    // skip은 LLM 없이 직접 상태 업데이트
    if (type === 'skip') {
      const confirmHandler = () => {
        handleOpenChange(false);
        applySkip(originalKey);
      };
      showConfirm(title, description, confirmHandler, undefined, {
        confirmText: t(i18n.common.matching_field_dropdown.confirm_button),
        cancelText: t(i18n.common.alert_dialog.cancel),
      });
      return;
    }

    const message = buildFieldChangeMessage(type, targetValue, systemId);
    const confirmHandler = async () => {
      handleOpenChange(false);
      await onSend?.(message);
    };

    showConfirm(title, description, confirmHandler, undefined, {
      confirmText: t(i18n.common.matching_field_dropdown.confirm_button),
      cancelText: t(i18n.common.alert_dialog.cancel),
    });
  };

  const resolveSelection = async (normalizedValue: string) => {
    // 이미 선택된 값이면 드롭다운만 닫기
    const normalize = (s: string) => s.trim().replace(/\s+/g, ' ');
    if (normalize(normalizedValue) === normalize(currentMatchingName ?? '')) {
      handleOpenChange(false);
      return;
    }
    if (normalizedValue === 'skip' || normalizedValue === SKIP_LABEL) {
      const isAlreadySkip = matchingJson?.id === 'skip' || matchingJson?.type === 'skip';
      if (isAlreadySkip) {
        handleOpenChange(false);
        return;
      }
      await showSelectionConfirm('skip', 'skip');
      return;
    }
    // skip 상태에서 원래 매칭 필드로 복원: values가 있거나 TEXT 타입이면 LLM 없이 직접 복원
    const isCurrentlySkip = matchingJson?.id === 'skip' || matchingJson?.type === 'skip';
    if (isCurrentlySkip && initialMatchingJson) {
      const initialInfo = getEffectiveColumnInfo(initialMatchingJson);
      const hasValues = initialMatchingJson.values && initialMatchingJson.values.length > 0;
      const canRestoreWithOriginalValues =
        !hasValues && initialInfo.type === 'TEXT' && originJson?.values && originJson.values.length > 0;
      if ((hasValues || canRestoreWithOriginalValues) && normalize(normalizedValue) === normalize(initialInfo.name)) {
        const restoreJson = canRestoreWithOriginalValues
          ? { ...initialMatchingJson, values: originJson.values }
          : initialMatchingJson;
        const confirmHandler = () => {
          handleOpenChange(false);
          applyRestore(originalKey, restoreJson);
        };
        const title = t(i18n.common.matching_field_dropdown.confirm_title);
        const displayValue =
          initialMatchingJson.type === 'predefined'
            ? getTranslatedFieldName(initialMatchingJson.id, initialInfo.name)
            : initialInfo.name;
        const description = getConfirmContent('custom', originalKey, displayValue);
        showConfirm(title, description, confirmHandler, undefined, {
          confirmText: t(i18n.common.matching_field_dropdown.confirm_button),
          cancelText: t(i18n.common.alert_dialog.cancel),
        });
        return;
      }
    }

    // predefined 필드인지 name으로 확인 (value는 여전히 한글 name)
    const predefined = PREDEFINED_COLUMNS.find((col) => col.name === normalizedValue);
    if (predefined) {
      await showSelectionConfirm('system', normalizedValue, predefined.id);
      return;
    }
    await showSelectionConfirm('custom', normalizedValue);
  };

  return (
    <div className='inline-flex w-full flex-col items-start gap-1'>
      <DropdownMenu
        open={isOpen}
        onOpenChange={(next) => {
          if (disableDropdown) return;
          handleOpenChange(next);
        }}
      >
        <DropdownMenuTrigger asChild>{renderTrigger()}</DropdownMenuTrigger>
        <DropdownMenuContent
          align={'start'}
          side={'bottom'}
          className={cn(getBaseMenuClass())}
          style={{ width: menuWidth, zIndex: Z_INDEX.SELECT_DROPDOWN }}
        >
          {buildMatchingFieldOptions({ originJson, matchingJson })
            .sort((a, b) => (a.disabled ? 1 : 0) - (b.disabled ? 1 : 0))
            .map((option, idx) => {
              const variant = (option.variant ?? 'default') as DropdownVariant;
              return (
                <DropdownMenuItem
                  key={idx}
                  disabled={option.disabled}
                  onSelect={() => {
                    if (option.disabled) return;
                    resolveSelection(option.value as string);
                  }}
                  className={cn(
                    'hover:bg-accent/50 inline-flex w-full min-w-32 items-center justify-between px-2 py-1.5',
                    option.selected ? 'bg-accent text-popover-foreground' : 'bg-popover',
                    option.disabled && 'cursor-not-allowed !opacity-30',
                    !option.disabled && 'cursor-pointer',
                  )}
                >
                  <div className='inline-flex w-full max-w-full flex-col items-start justify-start gap-0.5 overflow-hidden'>
                    <div
                      className={cn('w-full justify-start truncate text-sm font-normal', variantLabelClass[variant])}
                    >
                      {option.label}
                    </div>
                    {option.typeLabel ? (
                      <div
                        className={cn(
                          'text-2xs w-full justify-start truncate font-normal leading-[14px]',
                          option.disabled ? 'text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {option.typeLabel}
                      </div>
                    ) : null}
                  </div>
                  {option.selected ? (
                    <span className='relative h-4 w-4 overflow-hidden'>
                      <Check className='text-primary absolute h-4 w-4' strokeWidth={2} />
                    </span>
                  ) : null}
                </DropdownMenuItem>
              );
            })}
        </DropdownMenuContent>
      </DropdownMenu>
      {/* {isDebug && (
        <div className='absolute bottom-[-3px] left-11 text-4xs text-red-500'>
          처음감지: {initialType} / 풀데이터: {originJson?.isFullData ? 'full' : 'no'}
        </div>
      )} */}
    </div>
  );
}

export default MatchingFieldDropdown;
