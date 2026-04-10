'use client';

import { useEffect } from 'react';

/**
 * 마스킹 라벨(.masking-label)에 대한 글로벌 툴팁 프로바이더
 *
 * overflow: auto 컨테이너 안에서도 잘리지 않도록
 * body에 fixed 위치 툴팁을 직접 렌더링합니다.
 */
export function MaskingTooltipProvider() {
  useEffect(() => {
    let tooltipEl = document.getElementById('masking-tooltip');
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'masking-tooltip';
      document.body.appendChild(tooltipEl);
    }

    const handleMouseEnter = (e: Event) => {
      const target = (e.target as HTMLElement).closest('.masking-label') as HTMLElement | null;
      if (!target || !tooltipEl) return;

      const text = target.getAttribute('data-tooltip');
      if (!text) return;

      tooltipEl.textContent = text;
      tooltipEl.classList.add('visible');

      const rect = target.getBoundingClientRect();
      tooltipEl.style.left = `${rect.left + rect.width / 2 - tooltipEl.offsetWidth / 2}px`;
      tooltipEl.style.top = `${rect.top - tooltipEl.offsetHeight - 4}px`;
    };

    const handleMouseLeave = (e: Event) => {
      const target = (e.target as HTMLElement).closest('.masking-label');
      if (!target || !tooltipEl) return;
      tooltipEl.classList.remove('visible');
    };

    document.addEventListener('mouseover', handleMouseEnter);
    document.addEventListener('mouseout', handleMouseLeave);

    return () => {
      document.removeEventListener('mouseover', handleMouseEnter);
      document.removeEventListener('mouseout', handleMouseLeave);
    };
  }, []);

  return null;
}
