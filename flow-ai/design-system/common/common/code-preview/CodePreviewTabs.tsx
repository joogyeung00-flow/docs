'use client';

import { memo } from 'react';
import type { ViewTab } from './utils';

interface CodePreviewTabsProps {
  /** 현재 활성 탭 */
  activeTab: ViewTab;
  /** 탭 변경 핸들러 */
  onTabChange: (tab: ViewTab) => void;
  /** 모바일 스타일 적용 여부 */
  isMobile?: boolean;
}

/**
 * Code/Preview 탭 전환 컴포넌트
 *
 * Claude Artifacts 스타일 UI
 */
export const CodePreviewTabs = memo(function CodePreviewTabs({
  activeTab,
  onTabChange,
  isMobile = false,
}: CodePreviewTabsProps) {
  const paddingClass = isMobile ? 'px-4 py-1.5' : 'px-3 py-1';

  return (
    <div className='bg-muted flex rounded-lg p-1'>
      <button
        type='button'
        onClick={() => onTabChange('code')}
        className={`rounded-md ${paddingClass} text-sm transition-colors ${
          activeTab === 'code' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Code
      </button>
      <button
        type='button'
        onClick={() => onTabChange('preview')}
        className={`rounded-md ${paddingClass} text-sm transition-colors ${
          activeTab === 'preview' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Preview
      </button>
    </div>
  );
});
