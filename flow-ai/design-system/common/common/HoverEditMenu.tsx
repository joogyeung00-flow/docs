'use client';

import { useLayoutEffect, useRef, useState } from 'react';

interface HoverEditMenuProps {
  onEditRequest: () => void;
  children: React.ReactNode;
}

type TooltipPosition = 'bottom-right' | 'top-right';

export default function HoverEditMenu({ onEditRequest, children }: HoverEditMenuProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>('bottom-right');
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = (e: React.MouseEvent) => {
    const related = e.relatedTarget;
    if (!related || !(related instanceof Node) || (menuRef.current && !menuRef.current.contains(related))) {
      setIsHovered(false);
    }
  };

  const handleEditClick = () => {
    setIsHovered(false);
    onEditRequest();
  };

  useLayoutEffect(() => {
    if (isHovered && menuRef.current && triggerRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      if (triggerRect.bottom + menuRect.height > viewportHeight) {
        setTooltipPosition('top-right');
      } else {
        setTooltipPosition('bottom-right');
      }
    }
  }, [isHovered]);

  const tooltipClass =
    tooltipPosition === 'bottom-right' ? 'absolute right-0 top-full z-50' : 'absolute right-0 bottom-full z-50';

  return (
    <div
      className='relative inline-flex items-center'
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={triggerRef}
    >
      <div
        data-property-1={isHovered ? 'selected' : undefined}
        className='inline-flex items-start justify-start transition-all'
      >
        <div
          className={`ml-[-12px] mt-[-12px] rounded p-[12px] outline outline-1 outline-offset-[-1px] ${
            isHovered ? 'outline-shadcn-ui-app-primary' : 'outline-transparent'
          } flex items-center justify-center transition-all`}
        >
          <div className='text-card-foreground justify-start text-2xl font-semibold leading-normal'>{children}</div>
        </div>
      </div>
      {
        <div
          className={`${tooltipClass} ${isHovered ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'} transition-opacity duration-300`}
          ref={menuRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleEditClick}
        >
          <div className='outline-border flex w-40 min-w-32 cursor-pointer flex-col items-center justify-start overflow-hidden rounded-md p-0 shadow-md outline outline-1 outline-offset-[-1px]'>
            <div data-type='separator' className='m-0 flex w-full flex-col items-start justify-start p-0'>
              <div className='outline-muted m-0 h-0 w-full p-0 outline outline-1 outline-offset-[-0.5px]'></div>
            </div>
            <div className='bg-popover flex flex-col items-start justify-start self-stretch p-1'>
              <div
                data-left-icon='false'
                data-right-icon='false'
                data-right-text='false'
                data-state='default'
                data-type='menu'
                className='bg-popover m-0 flex w-full min-w-32 items-center justify-start gap-2 px-2 py-1.5'
              >
                <div className='text-popover-foreground justify-start text-sm font-normal leading-tight'>
                  Ai에게 수정 요청
                </div>
              </div>
            </div>
            <div data-type='separator' className='m-0 flex w-full flex-col items-start justify-start p-0'>
              <div className='outline-muted m-0 h-0 w-full p-0 outline outline-1 outline-offset-[-0.5px]'></div>
            </div>
          </div>
        </div>
      }
    </div>
  );
}
