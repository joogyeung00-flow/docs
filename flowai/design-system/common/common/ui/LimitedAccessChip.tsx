'use client';

import { useEffect } from 'react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useFeatureFlagStore, useFeatureTargetTypes } from '@/stores/feature-flag.store';
import { i18n } from '@flowai/i18n';
import type { FeatureFlagKey } from '@flowai/shared';
import { InfoChip } from './InfoChip';

const TARGET_TYPE_LABELS: Record<string, string> = {
  DOMAIN: 'Domain',
  USER: 'User',
  COMPANY: 'Company',
};

interface LimitedAccessChipProps {
  featureKey: FeatureFlagKey;
  size?: 'sm' | 'xs';
  className?: string;
}

/**
 * 일부공개기능 칩 — feature flag key만 넘기면 라벨/툴팁 자동 구성
 *
 * 툴팁에 feature flag key와 활성화 조건(DOMAIN/USER/COMPANY)을 함께 표시합니다.
 */
export function LimitedAccessChip({ featureKey, size = 'xs', className }: LimitedAccessChipProps) {
  const { t } = useAppTranslation('sidebar');
  const fetchFeatureTargets = useFeatureFlagStore((s) => s.fetchFeatureTargets);
  const targetTypes = useFeatureTargetTypes(featureKey);

  useEffect(() => {
    fetchFeatureTargets();
  }, [fetchFeatureTargets]);

  const targetLabels = targetTypes.map((type) => TARGET_TYPE_LABELS[type] ?? type).join(', ');
  const tooltip = targetLabels ? `${featureKey}\n활성화: ${targetLabels}` : featureKey;

  return (
    <InfoChip
      label={t(i18n.sidebar.labs_limited_access)}
      tooltip={tooltip}
      size={size}
      className={className ?? 'shrink-0 cursor-default'}
    />
  );
}
