'use client';

import { X } from 'lucide-react';
import { ReactNode } from 'react';

interface ReferenceAreaLayoutProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

/**
 * Reference Area의 레이아웃 컴포넌트
 *
 * 헤더(제목 + 닫기 버튼)와 children을 렌더링합니다.
 * 상태 없는 순수 UI 컴포넌트입니다.
 */
export function ReferenceAreaLayout({ title, onClose, children, className }: ReferenceAreaLayoutProps) {
  return (
    <div className={`flex h-screen w-full flex-col ${className ?? ''}`}>
      {/* Header */}
      <div className='flex h-[60px] flex-shrink-0 flex-row items-center justify-between border-y border-gray-100 px-4 py-4 backdrop-blur-sm'>
        <div className='flex flex-col text-lg font-bold'>{title}</div>
        <button
          onClick={onClose}
          className='group flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 hover:scale-105 hover:bg-gray-100 active:scale-95'
        >
          <X className='h-4 w-4 transition-colors group-hover:text-gray-700' />
        </button>
      </div>

      {/* Content */}
      <div className='min-h-0 flex-1 overflow-hidden'>{children}</div>
    </div>
  );
}
