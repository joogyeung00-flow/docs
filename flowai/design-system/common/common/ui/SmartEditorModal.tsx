'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { X, Copy, Check, FileCode2, Eye, EyeOff, Columns2, ChevronLeft, ArrowUp, ShieldCheck } from 'lucide-react';
import MarkdownRenderer from '@/components/common/markdown/markdown-renderer';
import MDEditor, { commands } from '@uiw/react-md-editor';
import { SimpleDialog } from '@/components/common/ui/SimpleDialog';
import SecurityMaskingListModal from '@/components/chat/ai-message/security-masking-list-modal';
import { SecurityMaskingEmptyModal } from '@/components/chat/ai-message/security-masking-empty-modal';
import type { SecurityMaskingHit } from '@/lib/api/security-masking';
import { Z_INDEX } from '@/constants/z-index';
import { scheduleFocus } from '@/lib/utils/focus-scheduler';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { i18n } from '@flowai/i18n';
import type { PromptMaskingDetection } from '@flowai/shared/types/assistant';
import { toast } from 'sonner';

// ============================================================================
// 타입 정의
// ============================================================================

export type SmartEditorModalMode = 'editor' | 'viewer';
type EditorType = 'basic' | 'advanced';
type AdvancedEditorTab = 'md-editor' | 'md-viewer' | 'side-by-side';
type AdvancedViewerTab = 'md-viewer' | 'side-by-side';
type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full' | 'wide' | 'fullscreen';

interface SmartEditorModalProps {
  /** 모드: editor(편집), viewer(읽기 전용) */
  mode: SmartEditorModalMode;
  /** 초기값 (모달 열릴 때 내부 상태로 복사) */
  initialValue: string;
  /** 제출 핸들러 (editor 모드에서 제출 버튼 클릭 시 호출) */
  onSubmit?: (value: string) => void;
  /** 모달 열림 상태 */
  open: boolean;
  /** 모달 열림 상태 변경 핸들러 */
  onOpenChange: (open: boolean) => void;
  /** 모달 제목 */
  title?: string;
  /** 최대 글자수 */
  maxLength?: number;
  /** placeholder (미입력 시 기본 placeholder 사용) */
  placeholder?: string;
  /** 제출 버튼 텍스트 */
  submitText?: string;
  /** 마스킹된 콘텐츠 (viewer 모드에서 토글 버튼으로 원문/마스킹 전환) */
  maskedContent?: string | null;
  /** 마스킹 detection 정보 (뱃지 클릭 시 목록 표시, decrypt 시 하이라이팅용) */
  maskingDetections?: PromptMaskingDetection[] | null;
  /** 복사 제한 여부 (true일 때 복사 버튼 숨김 + 텍스트 선택 차단) */
  copyRestricted?: boolean;
  /** 붙여넣기 제한 여부 (true일 때 붙여넣기 차단) */
  pasteRestricted?: boolean;
}

// ============================================================================
// 상수
// ============================================================================

const BORDER_COLOR = '#d0d7de';

const TEXT_VIEWER_CLASS = 'min-h-0 flex-1 overflow-auto whitespace-pre-wrap bg-white p-4 text-base text-gray-700';

const MD_EDITOR_STYLE = `
  .w-md-editor-text {
    padding: 16px !important;
  }
  .w-md-editor-text-pre,
  .w-md-editor-text-pre > code,
  .w-md-editor-text-input {
    color: rgba(55, 65, 81, 1);
    font-size: 16px !important;
    line-height: 1.6 !important;
    font-family: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, 'Helvetica Neue', 'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif !important;
  }
`;

const MD_EDITOR_COMMANDS = [
  commands.bold,
  commands.italic,
  commands.strikethrough,
  commands.divider,
  commands.title,
  commands.quote,
  commands.code,
  commands.codeBlock,
  commands.divider,
  commands.unorderedListCommand,
  commands.orderedListCommand,
  commands.checkedListCommand,
];

type SmartEditorTip = {
  title: string;
  content: string;
};

// ============================================================================
// 서브 컴포넌트
// ============================================================================

interface TabButtonProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onClick: () => void;
  hideOnMobile?: boolean;
}

function TabButton({ label, icon: Icon, isActive, onClick, hideOnMobile }: TabButtonProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={`h-full whitespace-nowrap rounded px-2 text-xs transition-colors ${
        isActive ? 'bg-slate-200 text-slate-900' : 'text-slate-400 hover:text-slate-600'
      } ${hideOnMobile ? 'max-md:hidden' : ''}`}
    >
      <span className='max-md:hidden'>{label}</span>
      <Icon className='hidden h-3.5 w-3.5 max-md:block' />
    </button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='flex h-[20px] w-[20px] items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600'
    >
      <ChevronLeft className='h-4 w-4' />
    </button>
  );
}

interface CharacterCountProps {
  current: number;
  max?: number;
  isOverLimit: boolean;
  unitLabel: string;
}

function CharacterCount({ current, max, isOverLimit, unitLabel }: CharacterCountProps) {
  return (
    <div className={`text-sm ${isOverLimit ? 'text-red-500' : 'text-slate-500'}`}>
      {max ? (
        <>
          {current.toLocaleString()} / {max.toLocaleString()}
          {unitLabel}
        </>
      ) : (
        <>
          {current.toLocaleString()}
          {unitLabel}
        </>
      )}
    </div>
  );
}

interface TipSliderProps {
  tips: SmartEditorTip[];
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
}

function TipSlider({ tips, currentIndex, onPrev, onNext }: TipSliderProps) {
  return (
    <div className='w-full rounded-lg border border-slate-200 bg-white p-5 shadow-lg max-md:p-4'>
      <div className='mb-1 flex items-center justify-between'>
        <p className='text-sm text-slate-500'>
          <span className='font-bold'>TIP.</span> {tips[currentIndex].title}
        </p>
        <div className='flex items-center gap-1.5 text-xs text-slate-400'>
          <button type='button' onClick={onPrev} className='hover:text-slate-600'>
            &lt;
          </button>
          <span>
            {currentIndex + 1}/{tips.length}
          </span>
          <button type='button' onClick={onNext} className='hover:text-slate-600'>
            &gt;
          </button>
        </div>
      </div>
      <p className='text-sm font-light tracking-tight text-slate-400'>{tips[currentIndex].content}</p>
    </div>
  );
}

// ============================================================================
// 메인 컴포넌트
// ============================================================================

/**
 * SmartEditorModal - 스마트 에디터 모달
 *
 * @description
 * 텍스트/마크다운을 편집하거나 읽기 전용으로 표시하는 모달 컴포넌트입니다.
 *
 * - 기본모드: 단순 Textarea (에디터) 또는 마크다운 뷰어 (뷰어)
 * - 고급모드: 탭으로 전환 가능
 *   - 에디터: 마크다운 | 미리보기 | 같이보기
 *   - 뷰어: 마크다운 | 같이보기
 */
export function SmartEditorModal({
  mode,
  initialValue,
  onSubmit,
  open,
  onOpenChange,
  title,
  maxLength,
  placeholder,
  submitText,
  maskedContent,
  maskingDetections,
  copyRestricted = false,
  pasteRestricted = false,
}: SmartEditorModalProps) {
  const { t } = useAppTranslation(['common', 'chat']);

  const resolvedPlaceholder = placeholder ?? t(i18n.common.smart_editor.placeholder_default);
  const characterUnitLabel = t(i18n.common.smart_editor.character_unit);
  const tips = useMemo<SmartEditorTip[]>(
    () => [
      {
        title: t(i18n.common.smart_editor.tips.section_title),
        content: t(i18n.common.smart_editor.tips.section_content),
      },
      { title: t(i18n.common.smart_editor.tips.list_title), content: t(i18n.common.smart_editor.tips.list_content) },
      {
        title: t(i18n.common.smart_editor.tips.emphasis_title),
        content: t(i18n.common.smart_editor.tips.emphasis_content),
      },
      {
        title: t(i18n.common.smart_editor.tips.codeblock_title),
        content: t(i18n.common.smart_editor.tips.codeblock_content),
      },
      { title: t(i18n.common.smart_editor.tips.quote_title), content: t(i18n.common.smart_editor.tips.quote_content) },
    ],
    [t],
  );

  // 상태
  const [editorType, setEditorType] = useState<EditorType>('basic');
  const [advancedEditorTab, setAdvancedEditorTab] = useState<AdvancedEditorTab>('md-editor');
  const [advancedViewerTab, setAdvancedViewerTab] = useState<AdvancedViewerTab>('md-viewer');
  const [isCopied, setIsCopied] = useState(false);
  const [internalValue, setInternalValue] = useState(initialValue);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isDecryptMode, setIsDecryptMode] = useState(false);
  const [isMaskingModalOpen, setIsMaskingModalOpen] = useState(false);
  const [isMaskingEmptyModalOpen, setIsMaskingEmptyModalOpen] = useState(false);
  const hasMasking = !!maskedContent && maskedContent !== initialValue;
  const [tipIndex, setTipIndex] = useState(0);
  const [tipTimerKey, setTipTimerKey] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sideBySideLeftRef = useRef<HTMLDivElement>(null);
  const sideBySideRightRef = useRef<HTMLDivElement>(null);
  const scrollMaster = useRef<'left' | 'right' | null>(null);
  const lastSyncTime = useRef(0);
  const viewerContentRef = useRef<HTMLDivElement>(null);
  const [editorHeight, setEditorHeight] = useState(720);

  // 로컬 decrypt map 빌드 (하이라이팅용)
  const localDecryptMap = useMemo(() => {
    if (!maskingDetections?.length) return null;
    const map = new Map<string, { originalWord: string; detectionType: string }>();
    for (const d of maskingDetections) {
      map.set(d.anonymizedText, { originalWord: d.originalText, detectionType: d.detectionType });
    }
    return map;
  }, [maskingDetections]);

  // maskingDetections → SecurityMaskingHit 변환 (목록 모달용)
  const maskingHits = useMemo<SecurityMaskingHit[]>(() => {
    if (!maskingDetections?.length) return [];
    return maskingDetections.map((d, idx) => ({
      id: idx,
      chattingMessageId: 0,
      originalWord: d.originalText,
      maskedWord: d.anonymizedText,
      detectionType: d.detectionType,
      source: 'PROMPT' as const,
    }));
  }, [maskingDetections]);

  // 화면 높이 기준 에디터 높이 계산
  useLayoutEffect(() => {
    const calculateHeight = () => {
      const modalHeight = window.innerHeight * 0.8; // 80vh
      const headerHeight = 56; // h-14
      const footerHeight = 60; // py-3 + 버튼
      const toolbarHeight = 28;
      const extraHeight = 4; // 모르겠음
      setEditorHeight(modalHeight - headerHeight - footerHeight - toolbarHeight - extraHeight);
    };

    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    return () => window.removeEventListener('resize', calculateHeight);
  }, []);

  // 파생 상태
  const isEditorMode = mode === 'editor';
  const isAdvancedMode = editorType === 'advanced';
  const currentLength = internalValue?.length || 0;
  const isOverLimit = maxLength ? currentLength >= maxLength : false; // 글자수 카운터 빨간색 표시용
  const isSubmitDisabled = maxLength ? currentLength > maxLength : false; // 제출 차단용 (실제로는 slice로 초과 불가)
  const hasChanges = isEditorMode && internalValue !== initialValue;
  const displayTitle =
    title || (isEditorMode ? t(i18n.common.smart_editor.title_editor) : t(i18n.common.smart_editor.title_viewer));
  const displaySubmitText =
    submitText || (isEditorMode ? t(i18n.common.smart_editor.apply) : t(i18n.common.alert_dialog.confirm));
  const hasMdEditorToolbar =
    isAdvancedMode && isEditorMode && (advancedEditorTab === 'md-editor' || advancedEditorTab === 'side-by-side');
  const isSideBySide =
    isAdvancedMode &&
    ((isEditorMode && advancedEditorTab === 'side-by-side') || (!isEditorMode && advancedViewerTab === 'side-by-side'));
  const dialogSize: DialogSize = isSideBySide ? 'full' : '4xl';

  // 다이얼로그 열릴 때 초기화
  useEffect(() => {
    if (open) {
      setInternalValue(initialValue);
      setEditorType('basic');
      setAdvancedEditorTab('md-editor');
      setAdvancedViewerTab('md-viewer');
      setIsCopied(false);
      setIsDecryptMode(false);
    }
  }, [open, initialValue]);

  // decrypt 모드 시 마스킹 라벨을 하이라이팅된 원문으로 교체
  useEffect(() => {
    if (!isDecryptMode || !localDecryptMap || !viewerContentRef.current) return;
    // MarkdownRenderer 렌더링 완료 대기
    const timer = setTimeout(() => {
      if (!viewerContentRef.current) return;
      const labels = viewerContentRef.current.querySelectorAll('.masking-label[data-mask-key]');
      labels.forEach((el) => {
        const maskKey = el.getAttribute('data-mask-key');
        if (!maskKey || !localDecryptMap.has(maskKey)) return;
        const entry = localDecryptMap.get(maskKey)!;
        const span = document.createElement('span');
        span.className = 'decrypted-text--static';
        span.textContent = entry.originalWord;
        span.title = el.getAttribute('data-tooltip') || '';
        el.replaceWith(span);
      });
    }, 50);
    return () => clearTimeout(timer);
  }, [isDecryptMode, localDecryptMap]);

  // 팁 자동 슬라이드
  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [tipTimerKey, tips.length]);

  // 에디터 포커스
  const focusEditor = useCallback(() => {
    const target = textareaRef.current ?? (document.querySelector('.w-md-editor-text-input') as HTMLTextAreaElement);
    if (target) {
      scheduleFocus(target);
      const len = target.value?.length ?? 0;
      setTimeout(() => target.setSelectionRange(len, len), 210);
    }
  }, []);

  useEffect(() => {
    if (open && isEditorMode) focusEditor();
  }, [open, editorType, advancedEditorTab, isEditorMode, focusEditor]);

  const getScrollEl = (ref: React.RefObject<HTMLDivElement | null>): HTMLElement | null => {
    const el = ref.current;
    if (!el) return null;
    return (el.querySelector('.w-md-editor-text-input') as HTMLElement) || el;
  };

  const scrollToTop = (ref: React.RefObject<HTMLDivElement | null>) => {
    getScrollEl(ref)?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 스크롤 싱크: 마우스가 있는 쪽이 마스터, 반대쪽이 비율로 따라감
  const handleScrollSync = useCallback((source: 'left' | 'right') => {
    if (scrollMaster.current !== source) return;

    const now = Date.now();
    if (now - lastSyncTime.current < 50) return;
    lastSyncTime.current = now;

    const sourceEl = getScrollEl(source === 'left' ? sideBySideLeftRef : sideBySideRightRef);
    const targetEl = getScrollEl(source === 'left' ? sideBySideRightRef : sideBySideLeftRef);
    if (!sourceEl || !targetEl) return;

    const maxScroll = sourceEl.scrollHeight - sourceEl.clientHeight;
    const ratio = maxScroll > 0 ? sourceEl.scrollTop / maxScroll : 0;
    const targetMax = targetEl.scrollHeight - targetEl.clientHeight;
    targetEl.scrollTop = ratio * targetMax;
  }, []);

  useEffect(() => {
    if (!isSideBySide) return;

    const leftWrapper = sideBySideLeftRef.current;
    const rightWrapper = sideBySideRightRef.current;
    const leftEl = getScrollEl(sideBySideLeftRef);
    const rightEl = getScrollEl(sideBySideRightRef);

    const onLeftEnter = () => {
      scrollMaster.current = 'left';
    };
    const onRightEnter = () => {
      scrollMaster.current = 'right';
    };
    const onLeft = () => handleScrollSync('left');
    const onRight = () => handleScrollSync('right');

    leftWrapper?.addEventListener('mouseenter', onLeftEnter);
    rightWrapper?.addEventListener('mouseenter', onRightEnter);
    leftEl?.addEventListener('scroll', onLeft, { passive: true });
    rightEl?.addEventListener('scroll', onRight, { passive: true });

    return () => {
      leftWrapper?.removeEventListener('mouseenter', onLeftEnter);
      rightWrapper?.removeEventListener('mouseenter', onRightEnter);
      leftEl?.removeEventListener('scroll', onLeft);
      rightEl?.removeEventListener('scroll', onRight);
      scrollMaster.current = null;
    };
  }, [isSideBySide, handleScrollSync]);

  // 핸들러
  const handleTextChange = (newValue: string | undefined) => {
    const val = newValue || '';
    setInternalValue(maxLength ? val.slice(0, maxLength) : val);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(internalValue || '');
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSubmit = () => {
    if (isEditorMode && isSubmitDisabled) return;
    if (isEditorMode && onSubmit) onSubmit(internalValue);
    onOpenChange(false);
  };

  const handleCloseAttempt = (newOpen: boolean) => {
    if (!newOpen && hasChanges) {
      setShowCloseConfirm(true);
      return;
    }
    onOpenChange(newOpen);
  };

  const handleCloseConfirmResult = (confirmed: boolean | string | null) => {
    if (confirmed) onOpenChange(false);
  };

  const handleTipChange = (direction: 'prev' | 'next') => {
    setTipIndex((prev) => (direction === 'prev' ? prev - 1 + tips.length : prev + 1) % tips.length);
    setTipTimerKey((prev) => prev + 1);
  };

  const handlePasteRestriction = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      toast.error(t(i18n.chat.file_upload.paste_restricted));
    },
    [t],
  );

  // 렌더 요소
  const textEditorElement = (
    <Textarea
      ref={textareaRef}
      value={internalValue || ''}
      onChange={(e) => handleTextChange(e.target.value)}
      onPaste={pasteRestricted ? handlePasteRestriction : undefined}
      className={`min-h-0 flex-1 resize-none rounded-none border-0 bg-white p-4 text-base text-gray-700 focus-visible:ring-0 ${
        isOverLimit ? 'text-red-900' : ''
      }`}
      placeholder={resolvedPlaceholder}
    />
  );

  const textViewerElement = hasMasking ? (
    <div
      key={`viewer-${isDecryptMode}`}
      ref={viewerContentRef}
      className={`flex-1 overflow-auto bg-white p-4 ${copyRestricted ? 'select-none' : ''}`}
      style={copyRestricted ? { WebkitTouchCallout: 'none' } : undefined}
      {...(copyRestricted ? { 'data-copy-restricted': true } : {})}
    >
      {maskedContent?.trim() ? (
        <MarkdownRenderer markdownText={maskedContent} />
      ) : (
        <div className={TEXT_VIEWER_CLASS}>{''}</div>
      )}
    </div>
  ) : (
    <div
      className={`${TEXT_VIEWER_CLASS} ${copyRestricted ? 'select-none' : ''}`}
      style={copyRestricted ? { WebkitTouchCallout: 'none' } : undefined}
      {...(copyRestricted ? { 'data-copy-restricted': true } : {})}
    >
      {internalValue || ''}
    </div>
  );

  const mdEditorElement = (
    <MDEditor
      value={internalValue || ''}
      onChange={handleTextChange}
      preview='edit'
      commands={MD_EDITOR_COMMANDS}
      extraCommands={[]}
      height='100%'
      minHeight={editorHeight}
      visibleDragbar={false}
      highlightEnable={false}
      className='!rounded-none'
      textareaProps={{ placeholder, onPaste: pasteRestricted ? handlePasteRestriction : undefined }}
    />
  );

  const mdPreviewValue = !isEditorMode && hasMasking ? maskedContent : internalValue;
  const mdPreviewElement = (
    <div
      key={`preview-${isDecryptMode}`}
      ref={!isEditorMode && hasMasking ? viewerContentRef : undefined}
      className='flex-1 overflow-auto bg-white p-4'
    >
      {mdPreviewValue?.trim() ? (
        <MarkdownRenderer markdownText={mdPreviewValue} />
      ) : (
        <div className='flex h-full items-center justify-center'>
          <p className='text-base text-slate-400'>{t(i18n.common.smart_editor.empty_preview)}</p>
        </div>
      )}
    </div>
  );

  // 하단 플로팅 팁 (내용이 없을 때만 표시, 애니메이션 적용)
  const showFloatingTip = !internalValue?.trim() && isEditorMode;
  const floatingTip = isEditorMode && (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4 transition-all duration-300 ease-out ${
        showFloatingTip ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <div className={`w-full max-w-sm ${showFloatingTip ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <TipSlider
          tips={tips}
          currentIndex={tipIndex}
          onPrev={() => handleTipChange('prev')}
          onNext={() => handleTipChange('next')}
        />
      </div>
    </div>
  );

  const scrollTopButton = (ref: React.RefObject<HTMLDivElement | null>) => (
    <button
      type='button'
      onClick={() => scrollToTop(ref)}
      className='absolute bottom-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-600'
      title={t(i18n.common.smart_editor.scroll_to_top)}
    >
      <ArrowUp className='h-3.5 w-3.5' />
    </button>
  );

  const sideBySideEditorElement = (
    <div className='flex min-h-0 flex-1'>
      <div ref={sideBySideLeftRef} className='relative flex min-h-0 w-1/2 flex-col border-r'>
        {mdEditorElement}
        {scrollTopButton(sideBySideLeftRef)}
      </div>
      <div className='relative flex w-1/2 flex-col'>
        <div
          className='-mt-[1px] flex h-[28px] shrink-0 items-center border-y bg-white'
          style={{ borderColor: BORDER_COLOR }}
        />
        <div ref={sideBySideRightRef} className='flex-1 overflow-auto bg-white p-4'>
          {internalValue?.trim() ? (
            <MarkdownRenderer markdownText={internalValue} />
          ) : (
            <div className='flex h-full items-center justify-center'>
              <p className='text-base text-slate-400'>{t(i18n.common.smart_editor.empty_preview)}</p>
            </div>
          )}
        </div>
        {scrollTopButton(sideBySideRightRef)}
      </div>
    </div>
  );

  const sideBySideViewerDisplayValue = hasMasking ? maskedContent : internalValue;
  const sideBySideViewerElement = (
    <div key={`side-viewer-${isDecryptMode}`} className='flex min-h-0 flex-1'>
      <div className='relative w-1/2 border-r'>
        <div ref={sideBySideLeftRef} className={`${TEXT_VIEWER_CLASS} h-full`}>
          {internalValue || ''}
        </div>
        {scrollTopButton(sideBySideLeftRef)}
      </div>
      <div className='relative flex w-1/2 flex-col'>
        <div
          ref={(el) => {
            sideBySideRightRef.current = el;
            if (hasMasking) viewerContentRef.current = el;
          }}
          className='flex-1 overflow-auto bg-white p-4'
        >
          {sideBySideViewerDisplayValue?.trim() ? (
            <MarkdownRenderer markdownText={sideBySideViewerDisplayValue} />
          ) : (
            <div className='flex h-full items-center justify-center'>
              <p className='text-base text-slate-400'>{t(i18n.common.smart_editor.empty_preview)}</p>
            </div>
          )}
        </div>
        {scrollTopButton(sideBySideRightRef)}
      </div>
    </div>
  );

  // 탭 렌더링
  const renderAdvancedTabs = () => {
    const editorTabs = [
      { label: t(i18n.common.smart_editor.tabs.markdown), icon: FileCode2, value: 'md-editor' as const },
      { label: t(i18n.common.smart_editor.tabs.preview), icon: Eye, value: 'md-viewer' as const },
      {
        label: t(i18n.common.smart_editor.tabs.side_by_side),
        icon: Columns2,
        value: 'side-by-side' as const,
        hideOnMobile: true,
      },
    ];

    const viewerTabs = [
      { label: t(i18n.common.smart_editor.tabs.markdown), icon: Eye, value: 'md-viewer' as const },
      {
        label: t(i18n.common.smart_editor.tabs.side_by_side),
        icon: Columns2,
        value: 'side-by-side' as const,
        hideOnMobile: true,
      },
    ];

    const tabs = isEditorMode ? editorTabs : viewerTabs;
    const currentTab = isEditorMode ? advancedEditorTab : advancedViewerTab;
    const setTab = isEditorMode
      ? (v: AdvancedEditorTab) => setAdvancedEditorTab(v)
      : (v: AdvancedViewerTab) => setAdvancedViewerTab(v as AdvancedViewerTab);

    return (
      <>
        {tabs.map((tab) => (
          <TabButton
            key={tab.value}
            label={tab.label}
            icon={tab.icon}
            isActive={currentTab === tab.value}
            onClick={() => setTab(tab.value as any)}
            hideOnMobile={tab.hideOnMobile}
          />
        ))}
      </>
    );
  };

  // 툴바 렌더링
  const renderToolbar = () => {
    const backButton = <BackButton onClick={() => setEditorType('basic')} />;
    const tabButtons = <div className='flex rounded'>{renderAdvancedTabs()}</div>;

    if (hasMdEditorToolbar) {
      return (
        <div className='pointer-events-none absolute -top-[0.5px] right-0 z-10 flex h-[27px] w-fit items-center gap-1 pr-1'>
          <div className='pointer-events-auto'>{backButton}</div>
          <div className='pointer-events-auto'>{tabButtons}</div>
        </div>
      );
    }

    return (
      <div
        className='relative inset-0 -mt-[1px] flex h-[28px] shrink-0 items-center justify-center border-y'
        style={{ borderColor: BORDER_COLOR }}
      >
        {isAdvancedMode ? (
          <div className='absolute right-1 flex items-center gap-1'>
            {backButton}
            {tabButtons}
          </div>
        ) : (
          <div className='absolute right-1 flex rounded'>
            <button
              type='button'
              className='h-[20px] whitespace-nowrap rounded bg-slate-200 px-2 text-xs text-slate-900 transition-colors'
            >
              {t(i18n.common.smart_editor.mode.basic)}
            </button>
            <button
              type='button'
              onClick={() => setEditorType('advanced')}
              className='h-[20px] whitespace-nowrap rounded px-2 text-xs text-slate-400 transition-colors hover:text-slate-600'
            >
              {t(i18n.common.smart_editor.mode.advanced)}
            </button>
          </div>
        )}
      </div>
    );
  };

  // 콘텐츠 렌더링
  const renderContent = () => {
    if (!isAdvancedMode) {
      return isEditorMode ? textEditorElement : textViewerElement;
    }

    if (isEditorMode) {
      const contentMap = {
        'md-editor': mdEditorElement,
        'md-viewer': mdPreviewElement,
        'side-by-side': sideBySideEditorElement,
      };
      return contentMap[advancedEditorTab] || mdEditorElement;
    }

    const contentMap = {
      'md-viewer': mdPreviewElement,
      'side-by-side': sideBySideViewerElement,
    };
    return contentMap[advancedViewerTab] || mdPreviewElement;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleCloseAttempt}>
        <DialogContent
          size={dialogSize}
          maxHeight='80vh'
          scroll='none'
          closeButton={false}
          className='flex h-[80vh] flex-col gap-0 p-0 transition-[max-width] duration-300 ease-in-out max-md:h-dvh max-md:max-h-dvh max-md:w-screen max-md:max-w-none max-md:rounded-none'
        >
          <style>{MD_EDITOR_STYLE}</style>

          {/* 헤더 */}
          <DialogHeader className='flex h-14 flex-row items-center justify-between px-4'>
            <div className='flex items-center gap-2'>
              <DialogTitle className='text-base font-semibold'>{displayTitle}</DialogTitle>
              {!!maskedContent && !isEditorMode && (
                <button
                  type='button'
                  onClick={() => {
                    if (maskingHits.length === 0) {
                      setIsMaskingEmptyModalOpen(true);
                    } else {
                      setIsMaskingModalOpen(true);
                    }
                  }}
                  className='inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-gray-100 px-3 py-[3px] outline outline-1 outline-offset-[-1px] outline-gray-200 transition-colors hover:bg-gray-200'
                >
                  <ShieldCheck className='text-primary h-4 w-4' />
                  <span className='text-xs font-normal leading-5 text-black'>
                    {t(i18n.common.smart_editor.security_masking_applied)}
                  </span>
                </button>
              )}
            </div>
            <button
              type='button'
              onClick={() => handleCloseAttempt(false)}
              className='cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-500'
            >
              <X className='h-5 w-5' />
            </button>
          </DialogHeader>

          {/* 콘텐츠 영역 */}
          <div className='relative flex min-h-0 flex-1 flex-col' data-color-mode='light'>
            {renderToolbar()}
            {renderContent()}
            {floatingTip}
          </div>

          {/* 하단 영역 */}
          <div
            className='flex items-center justify-between border-t-[1.5px] px-4 py-3'
            style={{ borderColor: BORDER_COLOR }}
          >
            <CharacterCount
              current={currentLength}
              max={maxLength}
              isOverLimit={isOverLimit}
              unitLabel={characterUnitLabel}
            />
            <div className='flex items-center gap-2'>
              {hasMasking && !isEditorMode && (
                <Button
                  variant='outline'
                  onClick={() => setIsDecryptMode(!isDecryptMode)}
                  className={`gap-1.5 ${isDecryptMode ? 'border-primary text-primary' : ''}`}
                >
                  {isDecryptMode ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                  {isDecryptMode ? t(i18n.common.smart_editor.view_masked) : t(i18n.common.smart_editor.view_original)}
                </Button>
              )}
              {!copyRestricted && (
                <Button variant='outline' onClick={handleCopy} className='gap-1.5'>
                  {isCopied ? <Check className='h-4 w-4 text-green-500' /> : <Copy className='h-4 w-4' />}
                  {isCopied ? t(i18n.common.smart_editor.copied) : t(i18n.common.smart_editor.copy)}
                </Button>
              )}
              <Button
                type='button'
                onClick={handleSubmit}
                disabled={isEditorMode && isSubmitDisabled}
                className='bg-flow-main-l01 rounded-md px-6 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'
              >
                {displaySubmitText}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 닫기 확인 다이얼로그 */}
      <SimpleDialog
        config={{
          type: 'confirm',
          title: t(i18n.common.smart_editor.close_confirm_title),
          description: t(i18n.common.smart_editor.close_confirm_description),
          confirmText: t(i18n.common.smart_editor.close_confirm_exit),
          cancelText: t(i18n.common.alert_dialog.cancel),
        }}
        open={showCloseConfirm}
        onOpenChange={setShowCloseConfirm}
        onResult={handleCloseConfirmResult}
        zIndex={Z_INDEX.CONFIRM_DIALOG_OVERLAY}
      />

      {/* 마스킹 목록 모달 */}
      <SecurityMaskingListModal
        open={isMaskingModalOpen}
        setOpen={setIsMaskingModalOpen}
        hits={maskingHits}
        isLoading={false}
        hasMore={false}
        onLoadMore={() => {}}
      />
      <SecurityMaskingEmptyModal isOpen={isMaskingEmptyModalOpen} onClose={() => setIsMaskingEmptyModalOpen(false)} />
    </>
  );
}

// 기존 이름과 호환성 유지
export { SmartEditorModal as InstructionModal, SmartEditorModal as MarkdownContentModal };
export type { SmartEditorModalMode as InstructionModalMode, SmartEditorModalMode as MarkdownContentModalMode };
