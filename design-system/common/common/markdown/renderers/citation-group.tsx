'use client';

import { Z_INDEX } from '@/constants/z-index';
import { useDeviceContext } from '@/hooks/useDeviceContext';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { MobileBridge, SEND_EVENTS } from '@/lib/bridge';
import { i18n } from '@flowai/i18n';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { CITATION_STYLES } from '../utils';

interface CitationGroupProps {
  'data-citations': string;
  'data-first': string;
  'data-count': string;
  'data-encoding'?: string;
}

export default function CitationGroup({
  'data-citations': dataCitations,
  'data-first': dataFirst,
  'data-count': dataCount,
  'data-encoding': dataEncoding,
}: CitationGroupProps) {
  const { t } = useAppTranslation('common');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const [modalWidth, setModalWidth] = useState(320); // 기본값 (w-80)
  const badgeRef = useRef<HTMLSpanElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const { isWebView } = useDeviceContext();

  // Base64 인코딩 지원
  const decodeData = (data: string): string => {
    if (!data) return '';
    try {
      if (dataEncoding === 'base64') {
        return decodeURIComponent(atob(data));
      }
      return decodeURIComponent(data);
    } catch (e) {
      console.error('Failed to decode citation data:', e);
      return data;
    }
  };

  const citationsContent = decodeData(dataCitations);

  // 콤마로 분리할 때 URL 내부의 콤마는 무시하도록 개선된 파싱
  const citations: string[] = [];
  let currentCitation = '';
  let bracketDepth = 0;
  let parenDepth = 0;

  for (let i = 0; i < citationsContent.length; i++) {
    const char = citationsContent[i];

    if (char === '[') bracketDepth++;
    else if (char === ']') bracketDepth--;
    else if (char === '(') parenDepth++;
    else if (char === ')') parenDepth--;
    else if (char === ',' && bracketDepth === 0 && parenDepth === 0) {
      if (currentCitation.trim()) {
        citations.push(currentCitation.trim());
      }
      currentCitation = '';
      continue;
    }

    currentCitation += char;
  }

  if (currentCitation.trim()) {
    citations.push(currentCitation.trim());
  }

  const firstCitation = decodeData(dataFirst);
  const count = dataCount || '0';

  // 링크 텍스트 추출 및 URL 디코딩 처리
  const extractedText = firstCitation.match(/\[([^\]]+)\]/)?.[1] || '';
  const firstCitationText = (() => {
    try {
      // URL 인코딩된 문자가 있으면 디코딩 시도
      return decodeURIComponent(extractedText);
    } catch {
      // 디코딩 실패 시 원본 반환
      return extractedText;
    }
  })();

  const getHostFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const calculateModalWidth = useCallback(() => {
    if (!citations.length) return 320;

    const longestText = citations.reduce((longest, citation) => {
      const linkMatch = citation.match(/\[([^\]]+)\]/);
      let text = linkMatch ? linkMatch[1] : citation;

      // URL 인코딩된 텍스트 디코딩 시도
      try {
        text = decodeURIComponent(text);
      } catch {
        // 디코딩 실패 시 원본 유지
      }

      return text.length > longest.length ? text : longest;
    }, '');

    const avgCharWidth = 8;
    const padding = 80;
    const calculatedWidth = Math.min(Math.max(longestText.length * avgCharWidth + padding, 280), 400);

    return calculatedWidth;
  }, [citations]);

  // Badge 클릭시 위치 및 너비 계산
  const handleBadgeClick = useCallback(() => {
    if (badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect();
      const dynamicWidth = calculateModalWidth();
      const modalHeight = 115;

      let top = rect.top + window.scrollY - modalHeight - 8;
      let left = rect.left + window.scrollX + rect.width / 2 - dynamicWidth / 2;

      if (top < window.scrollY + 16) {
        top = rect.bottom + window.scrollY + 8;
      }
      if (left < 16) {
        left = 16;
      }
      if (left + dynamicWidth > window.innerWidth - 16) {
        left = window.innerWidth - dynamicWidth - 16;
      }

      setModalWidth(dynamicWidth);
      setModalPosition({ top, left });
    }
    setIsModalOpen(!isModalOpen);
  }, [isModalOpen, calculateModalWidth]);

  // 모달 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isModalOpen &&
        modalRef.current &&
        badgeRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        !badgeRef.current.contains(event.target as Node)
      ) {
        setIsModalOpen(false);
      }
    };

    const handleScroll = () => {
      // 스크롤 시 모달 닫기
      setIsModalOpen(false);
    };

    if (isModalOpen) {
      document.addEventListener('click', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);

      return () => {
        document.removeEventListener('click', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isModalOpen]);

  const modal = isModalOpen && (
    <div
      ref={modalRef}
      className={CITATION_STYLES.modalWrapper}
      style={{
        top: modalPosition.top,
        left: modalPosition.left,
        width: modalWidth,
        zIndex: Z_INDEX.MARKDOWN_MODAL,
      }}
    >
      <div className={CITATION_STYLES.modalContent}>
        <div className={CITATION_STYLES.modalScrollArea}>
          {citations.map((citation, index) => {
            const linkMatch = citation.match(/\[([^\]]+)\]\(([^)]+)\)/);
            if (linkMatch) {
              const [, text, url] = linkMatch;
              const cleanUrl = url.split(' ')[0].replace(/"/g, '');
              const host = getHostFromUrl(cleanUrl);

              // URL 인코딩된 텍스트 디코딩 시도
              const decodedText = (() => {
                try {
                  return decodeURIComponent(text);
                } catch {
                  return text;
                }
              })();

              return (
                <a
                  key={index}
                  href={cleanUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className={CITATION_STYLES.citationLink}
                  onClick={async (e) => {
                    if (isWebView) {
                      e.preventDefault();
                      try {
                        MobileBridge.send({ EVENT: SEND_EVENTS.OPEN_EXTERNAL_WEB_LINK, DATA: { url: cleanUrl } });
                      } catch {
                        toast.error(t(i18n.common.markdown_citation.external_link_blocked));
                      }
                    }
                  }}
                >
                  <div className={CITATION_STYLES.citationNumber}>{index + 1}</div>
                  <div className={CITATION_STYLES.citationTextContainer}>
                    <div className='flex items-center gap-1'>
                      <h4 className={CITATION_STYLES.citationTitle}>{decodedText}</h4>
                    </div>
                    <p className={CITATION_STYLES.citationHost}>{host}</p>
                  </div>
                </a>
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <span ref={badgeRef} className={CITATION_STYLES.badgeReact} onClick={handleBadgeClick}>
        {firstCitationText} +{count}
      </span>

      {typeof window !== 'undefined' && createPortal(modal, document.body)}
    </>
  );
}
