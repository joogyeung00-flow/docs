'use client';

import { DepartmentTreeSelector } from './DepartmentTreeSelector';
import { useCompany } from '@/hooks/api/admin/use-company';
import { useCompanyStore, type DivisionHierarchy } from '@/stores/company.store';
import { memo } from 'react';

export interface DepartmentTreeSelectProps {
  /** 현재 선택된 부서 코드 ('all' = 모든 부서) */
  value?: string;
  /** 부서 선택 변경 콜백 */
  onValueChange?: (value: string) => void;
  /** 외부에서 주입하는 부서 계층 구조 (미지정 시 내부에서 자동 fetch) */
  divisionHierarchy?: DivisionHierarchy;
  className?: string;
}

/**
 * DepartmentTreeSelect - 부서 선택 드롭다운 (Container)
 *
 * @description
 * 내부에서 useCompany()를 호출하여 회사/부서 데이터를 자동으로 fetch하고,
 * useCompanyStore의 divisionHierarchy를 DepartmentTreeSelector UI에 전달하는 Container 컴포넌트.
 * - 사용처에서 데이터 fetch나 divisionHierarchy 주입 불필요
 * - divisionHierarchy를 직접 전달하면 fetch 없이 해당 데이터 사용 (mock/demo 모드)
 * - 검색, 트리 펼침/접기, 인원수 표시 지원
 *
 * @example
 * ```tsx
 * <DepartmentTreeSelect
 *   value={department}
 *   onValueChange={setDepartment}
 *   className="w-64"
 * />
 * ```
 */
export const DepartmentTreeSelect = memo(function DepartmentTreeSelect({
  value = 'all',
  onValueChange,
  divisionHierarchy: externalHierarchy,
  className,
}: DepartmentTreeSelectProps) {
  // 외부 주입이 없으면 내부에서 자동으로 company 데이터 fetch
  const { isLoading } = useCompany();
  const storeHierarchy = useCompanyStore((s) => s.divisionHierarchy);
  const divisionHierarchy = externalHierarchy ?? storeHierarchy;

  if (!externalHierarchy && isLoading && !divisionHierarchy) {
    return null;
  }

  return (
    <DepartmentTreeSelector
      value={value}
      onValueChange={onValueChange}
      divisionHierarchy={divisionHierarchy}
      className={className}
    />
  );
});
