'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { getAssetPath } from '@/lib/utils/asset-utils';
import { useUIStore } from '@/stores/ui-store';
import { getStatusChip } from '@flowai/shared';
import { i18n } from '@flowai/i18n';
import type { DecryptMapEntry } from '@/lib/api/security-masking';
import { resolveMaskingLabels as resolveMaskingLabelsText } from '@/lib/utils/clipboard';
import Image from 'next/image';
import FieldChip from './FieldChip';
import { resolveWithMaskingLabels } from './MaskingLabelInline';

// 허용된 HTML 태그 목록 (Flow 에디터 지원 태그)
const ALLOWED_TAGS = [
  'h1',
  'h2',
  'h3',
  'p',
  'div',
  'br',
  'strong',
  'em',
  'u',
  's',
  'font',
  'ol',
  'ul',
  'li',
  'table',
  'tbody',
  'tr',
  'td',
];

// 간단한 HTML sanitizer (허용된 태그만 렌더링, 나머지는 텍스트로 표시)
function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';

  let result = html;

  // script, style, iframe 등 위험한 태그는 완전히 제거
  result = result.replace(/<(script|style|iframe|object|embed|form|input|button)[^>]*>[\s\S]*?<\/\1>/gi, '');
  result = result.replace(/<(script|style|iframe|object|embed|form|input|button)[^>]*\/?>/gi, '');

  // on* 이벤트 핸들러 제거
  result = result.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  result = result.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '');

  // javascript: 프로토콜 제거
  result = result.replace(/javascript:/gi, '');

  // 허용되지 않은 태그는 escape해서 텍스트로 표시
  const allowedTagsPattern = ALLOWED_TAGS.join('|');
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;

  result = result.replace(tagRegex, (match, tagName) => {
    if (ALLOWED_TAGS.includes(tagName.toLowerCase())) {
      return match; // 허용된 태그는 그대로
    }
    // 허용되지 않은 태그는 escape
    return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  });

  return result;
}

type SelectionState = {
  type: 'none' | 'single' | 'range' | 'column';
  cells: { rowIndex: number; columnId: string }[];
  startCell?: { rowIndex: number; columnId: string };
  endCell?: { rowIndex: number; columnId: string };
  selectedColumnId?: string;
};

type FieldCardType = {
  title?: string;
  value?: string | any[];
  selection?: SelectionState;
  selectedColumn?: any;
  statuses?: any[];
  allValues?: any[];
  decryptMap?: Map<string, DecryptMapEntry> | null;
};

export default function FieldCard({
  title,
  value,
  selection,
  selectedColumn,
  statuses,
  allValues,
  decryptMap,
}: FieldCardType) {
  const { t } = useAppTranslation('common');
  const isDebug = useUIStore((s) => s.isDebug);

  function getFieldCardValue(selection: SelectionState, selectedColumn: any, statuses: any, allValues: any[]) {
    if (!selectedColumn) return '';

    const translateOptionValue = (value: string, fieldId?: string) => {
      if (fieldId === 'status') {
        const statusKey = (i18n.common.default_statuses as Record<string, { k: string; v: string }>)[value];
        return statusKey ? t(statusKey) : value;
      }
      if (fieldId === 'priority') {
        const priorityKey = (i18n.common.priority_options as Record<string, { k: string; v: string }>)[value];
        return priorityKey ? t(priorityKey) : value;
      }
      return value;
    };

    if (selection.type === 'none' || selection.type === 'column') {
      if (selectedColumn.id === 'status') {
        return (
          statuses?.map((o: any) => {
            const chip = getStatusChip(o.name, statuses);
            return { ...chip, chipName: translateOptionValue(chip.chipName, 'status') };
          }) ?? []
        );
      }
      if (selectedColumn.type === 'OPTION') {
        return selectedColumn.options.map((o: string) => {
          const chip = getStatusChip(o, []);
          return { ...chip, chipName: translateOptionValue(chip.chipName, selectedColumn.id) };
        });
      }
      if (selectedColumn.type === 'DATE') {
        return 'YYYY-MM-DD';
      }
      return selectedColumn.type;
    }

    if (selection.type === 'single' || selection.type === 'range') {
      if (selection.type === 'range') {
        const uniqueColumnsCount = new Set(selection.cells.map((c) => c.columnId)).size;
        if (uniqueColumnsCount > 1) {
          return t(i18n.common.field_card.data_count, { count: selection.cells.length });
        }
      }

      const selectedValues = selection.cells
        .map((cell) => {
          const rowData = allValues[cell.rowIndex];
          if (!rowData) return null;
          return rowData[cell.columnId];
        })
        .filter((value) => value && !value.loading);

      if (selectedValues.length === 0) return t(i18n.common.field_card.no_cells_selected);

      if (selectedValues.length === 1) {
        const value = selectedValues[0];
        if (value?.chipName) {
          return [value];
        }
        if (typeof value?.check === 'boolean') {
          return value.check ? t(i18n.common.field_card.complete) : t(i18n.common.field_card.incomplete);
        }
        return typeof value === 'string' ? value : JSON.stringify(value);
      }

      if (selectedColumn.type === 'OPTION') {
        const uniqueChips = selectedValues
          .filter((v) => v?.chipName)
          .reduce((acc: any[], curr: any) => {
            if (!acc.find((item) => item.chipName === curr.chipName)) {
              acc.push(curr);
            }
            return acc;
          }, []);
        return uniqueChips.length > 0 ? uniqueChips : t(i18n.common.field_card.various_values);
      }

      if (selectedColumn.type === 'CHECKBOX') {
        const completed = selectedValues.filter((v) => v?.check === true).length;
        const total = selectedValues.length;
        return t(i18n.common.field_card.completed_count, { completed, total });
      }

      if (selectedColumn.type === 'DATE') {
        const validDates = selectedValues.filter((v) => v && v !== '-');
        if (validDates.length === 0) return t(i18n.common.field_card.no_date);
        if (validDates.length === 1) return validDates[0];
        return t(i18n.common.field_card.date_count, { count: validDates.length });
      }

      const uniqueValues = [...new Set(selectedValues.filter((v) => v && v !== '-'))];
      if (uniqueValues.length === 1) return uniqueValues[0];
      return t(i18n.common.field_card.different_values_count, { count: uniqueValues.length });
    }

    return '';
  }

  function getFieldCardTitle(selection: SelectionState, selectedColumn: any) {
    if (!selectedColumn) return '';

    if (selection.type === 'single') {
      return t(i18n.common.field_card.single_cell_selected, { name: selectedColumn.name });
    }

    if (selection.type === 'range') {
      const uniqueColumnsCount = new Set(selection.cells.map((c) => c.columnId)).size;
      if (uniqueColumnsCount > 1) {
        return t(i18n.common.field_card.columns_with_others, {
          name: selectedColumn.name,
          count: uniqueColumnsCount - 1,
        });
      }
      return t(i18n.common.field_card.cells_selected, {
        name: selectedColumn.name,
        count: selection.cells.length,
      });
    }

    if (selection.type === 'column') {
      return t(i18n.common.field_card.whole_column_selected, { name: selectedColumn.name });
    }

    return selectedColumn.name;
  }

  const finalTitle = selection && selectedColumn ? getFieldCardTitle(selection, selectedColumn) : title || '';

  const finalValue =
    selection && selectedColumn && statuses && allValues
      ? getFieldCardValue(selection, selectedColumn, statuses, allValues)
      : value || '';

  const isChip = Array.isArray(finalValue) && finalValue.length > 0 && finalValue[0]?.chipName;
  const isContentColumn = selectedColumn?.id === 'content';

  const Contents = () => {
    if (isChip) {
      return (
        <>
          {finalValue
            .filter((v) => !!v.chipName)
            .map((v: any, i: number) => (
              <>
                <FieldChip key={i} chipName={v.chipName} themeName={v.themeName} />
              </>
            ))}
        </>
      );
    }

    // content 컬럼: HTML 렌더링 (허용된 태그만)
    if (isContentColumn && typeof finalValue === 'string' && finalValue.includes('<')) {
      const sanitizedHtml = sanitizeHtml(resolveMaskingLabelsText(finalValue, decryptMap));
      return (
        <div
          className='prose prose-sm max-w-none text-sm [&_li]:my-0.5 [&_ol]:my-1 [&_p]:my-1 [&_ul]:my-1'
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
      );
    }

    const displayText = typeof finalValue === 'string' ? finalValue : JSON.stringify(finalValue);
    return <span>{resolveWithMaskingLabels(displayText, decryptMap)}</span>;
  };

  return (
    <Card className='border-shadcn-ui-app-primary shadow-shadow-md w-[480px] overflow-hidden rounded border-2 border-solid'>
      <CardHeader className='bg-shadcn-ui-flow-bg05 px-3 py-2'>
        <p className='text-muted-foreground text-xs leading-tight'>{t(i18n.common.field_card.checking_attribute)}</p>
        <div className='flex items-center gap-2'>
          <Image src={getAssetPath('/logo/flow-logo.png')} alt={`flow logo`} width={20} height={20} />
          <div className='text-foreground text-sm font-semibold leading-tight'>{finalTitle}</div>
        </div>
      </CardHeader>
      <div className='py-0'>
        <Separator className='mt-[-0.50px] h-px' />
      </div>
      <CardContent className='bg-white px-3 py-2'>
        <p className='text-muted-foreground text-xs leading-tight'>{t(i18n.common.field_card.data_in_attribute)}</p>
        <div className='flex gap-1.5 overflow-y-auto pt-2'>
          <Contents />
        </div>
      </CardContent>
      {isDebug && (
        <CardContent className='bg-white px-3 py-2'>
          <p className='text-muted-foreground text-xs leading-tight'>설명 [DEBUG]</p>
          <div className='flex flex-wrap gap-2 pt-2'>{selectedColumn?.description}</div>
        </CardContent>
      )}
    </Card>
  );
}
