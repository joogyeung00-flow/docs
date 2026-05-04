'use client';

import { useAppTranslation } from '@/hooks/useAppTranslation';
import { i18n } from '@flowai/i18n';
import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';

interface FeatureTooltipProps {
  children: ReactNode;
  title: string;
  description: string;
  enabled?: boolean;
  showStatusInTitle?: boolean;
}

/**
 * 기능 설명을 위한 공통 툴팁 컴포넌트
 *
 * @param children - 툴팁이 표시될 트리거 요소
 * @param title - 툴팁 제목 (예: "보안 마스킹", "고급 답변 모드")
 * @param description - 기능 설명
 * @param enabled - 기능 활성화 여부 (켜짐/꺼짐 표시용)
 * @param showStatusInTitle - 제목에 켜짐/꺼짐 상태를 표시할지 여부 (기본: true)
 */
export const FeatureTooltip = ({
  children,
  title,
  description,
  enabled,
  showStatusInTitle = true,
}: FeatureTooltipProps) => {
  const { t } = useAppTranslation('common');

  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, arrowLeft: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useRef(false);

  useEffect(() => {
    // 모바일 체크
    isMobile.current = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
  }, []);

  const updatePosition = useCallback(() => {
    if (triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      // 툴팁 위치 계산
      let tooltipLeft = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;

      // 화면 밖으로 나가지 않도록 조정
      const padding = 8;
      if (tooltipLeft < padding) {
        tooltipLeft = padding;
      } else if (tooltipLeft + tooltipRect.width > window.innerWidth - padding) {
        tooltipLeft = window.innerWidth - tooltipRect.width - padding;
      }

      // 화살표 위치는 버튼 중앙에 정확히 맞춤
      const arrowLeft = triggerRect.left + triggerRect.width / 2 - tooltipLeft;

      // 툴팁이 화면 위로 넘어가는 경우 아래에 표시
      const tooltipTop = triggerRect.top - tooltipRect.height - 14;
      const shouldShowBelow = tooltipTop < padding;

      setPosition({
        top: shouldShowBelow ? triggerRect.bottom + 8 : tooltipTop,
        left: tooltipLeft,
        arrowLeft,
      });
    }
  }, []);

  useEffect(() => {
    if (isVisible) {
      // 툴팁이 DOM에 렌더링된 후 위치 계산
      const timer = setTimeout(() => {
        setIsMounted(true);
        updatePosition();
      }, 0);
      return () => clearTimeout(timer);
    } else {
      setIsMounted(false);
    }
  }, [isVisible, updatePosition]);

  useEffect(() => {
    if (isVisible) {
      const handleResize = () => updatePosition();
      const handleScroll = () => updatePosition();

      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isVisible, updatePosition]);

  const showTooltip = useCallback(() => {
    setIsVisible(true);

    // 모바일인 경우 3초 후 자동으로 닫기 (타이머 리셋)
    if (isMobile.current) {
      // 기존 타이머가 있으면 취소하고 새로 시작
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setIsVisible(false);
        timerRef.current = null;
      }, 3000);
    }
  }, []);

  const hideTooltip = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsVisible(false);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isMobile.current) {
        e.stopPropagation();
        e.preventDefault();
        // 항상 툴팁을 켜고 타이머만 리셋
        showTooltip();
      }
    },
    [showTooltip],
  );

  // 모바일에서 다른 곳 클릭 시 툴팁 닫기
  useEffect(() => {
    if (isMobile.current && isVisible) {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          triggerRef.current &&
          !triggerRef.current.contains(e.target as Node) &&
          tooltipRef.current &&
          !tooltipRef.current.contains(e.target as Node)
        ) {
          hideTooltip();
        }
      };

      // setTimeout으로 다음 틱에 이벤트 리스너 등록
      // 현재 클릭 이벤트가 완료된 후에 등록되도록
      const timer = setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);

      return () => {
        clearTimeout(timer);
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [isVisible, hideTooltip]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const onLabel = t(i18n.common.ui.on);
  const offLabel = t(i18n.common.ui.off);
  const displayTitle = showStatusInTitle && enabled !== undefined ? `${title}: ${enabled ? onLabel : offLabel}` : title;

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={!isMobile.current ? showTooltip : undefined}
        onMouseLeave={!isMobile.current ? hideTooltip : undefined}
        onClick={handleClick}
        className='inline-block'
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className='fixed z-[9999] transition-opacity duration-200'
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            opacity: isMounted ? 1 : 0,
            pointerEvents: isMounted ? 'auto' : 'none',
          }}
        >
          <div className='relative rounded-lg bg-black px-4 py-3 text-sm font-normal leading-relaxed text-white shadow-lg'>
            <div className='whitespace-pre-line'>
              <span
                className={
                  enabled !== undefined
                    ? enabled
                      ? 'animate-unlimited-progress from-bot-05 to-bot-05 bg-gradient-to-r via-sky-400 bg-[length:200%_100%] bg-clip-text font-bold text-transparent'
                      : 'font-medium text-gray-400'
                    : 'font-bold text-white'
                }
              >
                {displayTitle}
              </span>
              {'\n'}
              <span className='text-white/90'>{description}</span>
            </div>
            {/* 아래 화살표 - 버튼 중앙에 정확히 위치 */}
            <div
              className='absolute -translate-x-1/2'
              style={{
                bottom: '-6px',
                left: `${position.arrowLeft}px`,
              }}
            >
              <svg width='12' height='6' viewBox='0 0 12 6' fill='none' xmlns='http://www.w3.org/2000/svg'>
                <path d='M6 6L0 0H12L6 6Z' fill='black' />
              </svg>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
