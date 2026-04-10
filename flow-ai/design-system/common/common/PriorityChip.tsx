'use client';

import { Badge } from '@/components/ui/badge';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { i18n } from '@flowai/i18n';

export type PriorityLevel = 'NONE' | 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

interface PriorityConfig {
  labelKey: keyof typeof i18n.common.priority_chip;
  icon: string;
  color: string;
  textColor: string;
  borderColor: string;
}

const PRIORITY_CONFIG: Record<PriorityLevel, PriorityConfig> = {
  NONE: {
    labelKey: 'none',
    icon: '',
    color: 'bg-gray-100',
    textColor: 'text-gray-500',
    borderColor: 'border-gray-200',
  },
  LOW: {
    labelKey: 'low',
    icon: '➖',
    color: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200',
  },
  NORMAL: {
    labelKey: 'normal',
    icon: '🟢',
    color: 'bg-gray-100',
    textColor: 'text-gray-600',
    borderColor: 'border-gray-300',
  },
  HIGH: {
    labelKey: 'high',
    icon: '🟠',
    color: 'bg-orange-50',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-200',
  },
  URGENT: {
    labelKey: 'urgent',
    icon: '🚨',
    color: 'bg-red-50',
    textColor: 'text-red-600',
    borderColor: 'border-red-200',
  },
};

// 한글 라벨로 우선순위 레벨 찾기
const LABEL_TO_LEVEL: Record<string, PriorityLevel> = {
  없음: 'NONE',
  낮음: 'LOW',
  보통: 'NORMAL',
  높음: 'HIGH',
  긴급: 'URGENT',
};

export function getPriorityLevel(label: string): PriorityLevel {
  return LABEL_TO_LEVEL[label] ?? 'NONE';
}

export function getPriorityConfig(level: PriorityLevel): PriorityConfig {
  return PRIORITY_CONFIG[level];
}

interface PriorityChipProps {
  priority: PriorityLevel | string;
}

export default function PriorityChip({ priority }: PriorityChipProps) {
  const { t } = useAppTranslation('common');
  // string이면 레벨로 변환
  const level: PriorityLevel =
    typeof priority === 'string' && priority in LABEL_TO_LEVEL
      ? LABEL_TO_LEVEL[priority]
      : ((priority as PriorityLevel) ?? 'NONE');

  const config = PRIORITY_CONFIG[level] ?? PRIORITY_CONFIG.NONE;

  if (level === 'NONE') {
    return null;
  }

  const label = t(i18n.common.priority_chip[config.labelKey]);
  return (
    <Badge variant='outline' className={`${config.color} ${config.borderColor} gap-1 px-2 py-0`}>
      <span className={`${config.textColor}`}>{config.icon}</span>
      <span className={`text-sm font-medium ${config.textColor} whitespace-nowrap`}>{label}</span>
    </Badge>
  );
}
