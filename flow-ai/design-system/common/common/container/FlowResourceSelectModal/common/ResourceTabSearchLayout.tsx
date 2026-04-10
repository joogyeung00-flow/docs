'use client';

import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { cn } from '@/lib/utils';
import { i18n } from '@flowai/i18n';
import { Search } from 'lucide-react';
import { memo, type ReactNode } from 'react';

interface TabItem {
  value: string;
  label: string;
}

interface ResourceTabSearchLayoutProps {
  /** 탭 목록 */
  tabs: TabItem[];
  /** 현재 활성 탭 */
  activeTab: string;
  /** 탭 변경 콜백 */
  onTabChange: (value: string) => void;
  /** 검색 키워드 */
  searchKeyword: string;
  /** 검색 키워드 변경 콜백 */
  onSearchKeywordChange: (keyword: string) => void;
  /** 검색 placeholder */
  searchPlaceholder?: string;
  /** 우측 border 표시 (multi 모드에서 선택 패널과 구분) */
  showBorderRight?: boolean;
  /** 리스트 콘텐츠 */
  children: ReactNode;
  className?: string;
}

/**
 * 공통 탭 + 검색 레이아웃
 * - 상단: 탭 영역 (h-[52px])
 * - 중단: 검색 Input
 * - 하단: children (리스트 콘텐츠)
 */
export const ResourceTabSearchLayout = memo(function ResourceTabSearchLayout({
  tabs,
  activeTab,
  onTabChange,
  searchKeyword,
  onSearchKeywordChange,
  searchPlaceholder,
  showBorderRight = false,
  children,
  className,
}: ResourceTabSearchLayoutProps) {
  const { t } = useAppTranslation('common');
  const resolvedPlaceholder = searchPlaceholder ?? t(i18n.common.flow_select_modal.search_placeholder_default);
  return (
    <div className={cn('flex min-h-0 flex-1 flex-col gap-2 overflow-hidden px-0', showBorderRight && '', className)}>
      {/* 탭 영역 */}
      <div className='box-border flex shrink-0 items-center'>
        <Tabs value={activeTab} onValueChange={onTabChange} className='w-full'>
          <TabsList className='w-full'>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className='flex-1'>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* 검색 영역 */}
      <div className='relative'>
        <Search className='text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2' />
        <Input
          type='text'
          placeholder={resolvedPlaceholder}
          value={searchKeyword}
          onChange={(e) => onSearchKeywordChange(e.target.value)}
          className='pl-9'
        />
      </div>

      {/* 리스트 콘텐츠 */}
      <div className='min-h-0 flex-1 overflow-hidden'>{children}</div>
    </div>
  );
});
