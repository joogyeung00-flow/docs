/**
 * @file markdown-styles.ts
 * @description Markdown 렌더링에 사용되는 공통 Tailwind 스타일 상수
 *
 * **목적:**
 * - HTML 렌더링(streaming)과 React 컴포넌트(renderers)가 동일한 스타일 사용
 * - 스타일 변경 시 단일 진실 공급원(Single Source of Truth)
 * - 유지보수성 향상
 */

import { RESPONSIVE_MAX_WIDTH_CLASS } from '@/constants/layout';

/**
 * 코드 블록 공통 스타일
 */
const CODE_BLOCK_COMMON = {
  /** 반응형 max-width */
  maxWidth: RESPONSIVE_MAX_WIDTH_CLASS,
  /** 기본 wrapper 스타일 (테마 무관) - 코드블록 간 간격을 위해 my-3 추가 */
  wrapperBase: 'p-0 rounded-md border my-3',
  /** 헤더 기본 스타일 (높이 26px 고정) */
  headerBase: 'flex items-center justify-between border-b px-1 h-[26px]',
  /** 언어 라벨 기본 스타일 */
  labelBase: 'rounded px-2 py-0.5 text-2xs font-medium uppercase tracking-wider font-mono',
  /** 버튼 기본 스타일 (보더 없는 텍스트 버튼) */
  buttonBase: 'rounded px-2 py-0.5 text-xs leading-[16px]',
} as const;

/**
 * 코드 블록 스타일 (다크 테마)
 */
export const CODE_BLOCK_STYLES = {
  /** 코드 블록 전체 wrapper (다크) */
  wrapper: `${CODE_BLOCK_COMMON.wrapperBase} border-neutral-800 bg-neutral-900`,

  /** 코드 블록 헤더 (다크) */
  header: `${CODE_BLOCK_COMMON.headerBase} border-neutral-800 bg-neutral-800`,

  /** 언어 라벨 (다크) */
  languageLabel: `${CODE_BLOCK_COMMON.labelBase} bg-neutral-700 text-neutral-200`,

  /** 복사 버튼 (다크) */
  copyButton: `${CODE_BLOCK_COMMON.buttonBase} text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700`,

  /** pre 태그 (HTML 렌더링용) - 가로 스크롤 활성화, 다크 테마용 스크롤바 */
  pre: 'm-0 py-[5px] px-0 text-base overflow-x-auto',

  /** pre 태그 인라인 스타일 (HTML 렌더링용, 다크 테마용) */
  preInlineStyle: 'scrollbar-width: thin; scrollbar-color: rgb(63 63 70) transparent;',

  /** code 태그 (HTML 렌더링용) */
  code: 'text-neutral-200',
} as const;

/**
 * 코드 블록 스타일 (라이트 테마 - 기본값)
 */
export const CODE_BLOCK_STYLES_LIGHT = {
  /** 코드 블록 전체 wrapper (라이트) */
  wrapper: `${CODE_BLOCK_COMMON.wrapperBase} border-neutral-300 bg-white`,

  /** 코드 블록 헤더 (라이트) */
  header: `${CODE_BLOCK_COMMON.headerBase} border-neutral-300 bg-neutral-50 rounded-t-md`,

  /** 언어 라벨 (라이트) */
  languageLabel: `${CODE_BLOCK_COMMON.labelBase} bg-neutral-200 text-neutral-700`,

  /** 복사 버튼 (라이트) */
  copyButton: `${CODE_BLOCK_COMMON.buttonBase} text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200`,

  /** pre 태그 (HTML 렌더링용) - 가로 스크롤 활성화, 라이트 테마용 스크롤바 */
  pre: 'm-0 py-[5px] px-0 text-base overflow-x-auto',

  /** pre 태그 인라인 스타일 (HTML 렌더링용, 라이트 테마용) */
  preInlineStyle: 'scrollbar-width: thin; scrollbar-color: rgb(209 213 219) transparent;',

  /** code 태그 (HTML 렌더링용) */
  code: 'text-neutral-900',
} as const;

/**
 * 테마에 따른 코드 블록 스타일 반환 (기본값: 라이트 테마)
 *
 * **사용 시나리오:**
 * - Streaming (marked.js): data-theme 속성으로 토글 (JS 이벤트 핸들러)
 * - 코드 블록 복사 기능: code-block-helpers.ts에서 사용
 *
 * **미래 다크모드 지원:**
 * - useTheme() 훅 도입 시: isDark = useTheme().isDark 변경
 * - globals.css: dark: selector 추가 가능
 * - CSS variable 활용 가능: var(--color-bg-code-block) 등
 */
export const getCodeBlockStyles = (isDark: boolean) =>
  isDark ? { ...CODE_BLOCK_STYLES_LIGHT, ...CODE_BLOCK_STYLES } : CODE_BLOCK_STYLES_LIGHT;

/**
 * 인라인 코드 스타일
 */
export const INLINE_CODE_STYLES = {
  /** 인라인 코드 wrapper */
  wrapper:
    'not-prose inline rounded-[2px] bg-neutral-100 px-1 py-[2px] text-[0.875em] text-neutral-700 border border-neutral-200/60 align-baseline',
} as const;

const citationChipStyle =
  'w-fit inline-flex not-prose bg-muted cursor-pointer items-center rounded-full px-2 py-0.5 h-4 text-3xs text-slate-400 not-italic no-underline duration-150 hover:bg-slate-400 hover:text-white align-middle tracking-tighter';
/**
 * Citation Group (출처 그룹) 스타일
 */
export const CITATION_STYLES = {
  /** Badge 스타일 (streaming용 HTML) - citationChip과 동일 */
  badgeHtml: citationChipStyle,

  /** Badge 스타일 (React 컴포넌트용, className에 추가) - citationChip과 동일 */
  badgeReact: citationChipStyle,

  /** 모달 wrapper - z-index는 인라인 스타일로 설정 */
  modalWrapper: 'absolute transition-all duration-200 ease-out',

  /** 모달 컨텐츠 */
  modalContent: 'border-border bg-background rounded-md border shadow-lg',

  /** 모달 내부 스크롤 영역 */
  modalScrollArea: 'max-h-56 overflow-y-auto p-2',

  /** Citation 아이템 링크 */
  citationLink: 'hover:bg-muted/40 group flex items-center gap-2 rounded-sm p-2 transition-colors',

  /** Citation 번호 뱃지 */
  citationNumber:
    'bg-primary/10 text-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-medium',

  /** Citation 텍스트 컨테이너 */
  citationTextContainer: 'min-w-0 flex-1',

  /** Citation 제목 */
  citationTitle: 'text-foreground group-hover:text-primary line-clamp-1 text-xs font-medium',

  /** Citation URL 호스트 */
  citationHost: 'text-muted-foreground/80 truncate text-2xs',

  /** Citation Chip (단일 출처 칩 - link.external과 동일) */
  citationChip: citationChipStyle,
} as const;

/**
 * Reference Chip 공통 스타일 (VR, WS, FS 통합)
 *
 * **사용처:**
 * - Marked.js 확장: streaming/marked-extensions.ts의 VR/WS/FS 렌더링
 * - 이벤트 핸들러: useMarkdownEvents.ts의 칩 클릭 처리
 *
 * **스타일 통일 원칙:**
 * - 모든 출처 칩은 동일한 스타일 사용
 * - 하이라이트 상태: flow-bg01 색상 (#e9e5ff, 보라색 계열) 통일
 */
export const REFERENCE_CHIP_STYLES = {
  /** 칩 wrapper - 기본 상태 (inline-flex로 인라인 표시) */
  wrapper:
    'reference-chip inline-flex align-middle py-1 mb-[2.5px] items-center gap-1 rounded-full bg-slate-100 px-2 text-center no-underline cursor-pointer hover:bg-slate-200 ml-1',

  /** 칩 wrapper - 하이라이트 상태 (보라색 - flow-bg01 계열) */
  wrapperHighlighted: 'border-2 border-purple-500 !bg-purple-100 [&>span]:text-purple-700 [&>span]:text-2xs',

  /** 번호 뱃지 - 기본 상태 */
  numberBadge:
    'inline-flex h-3 w-3 shrink-0 items-center justify-center rounded-full border-[0.8px] border-slate-400 text-center text-4xs font-medium leading-[12px] text-slate-400',

  /** 번호 뱃지 - 하이라이트 상태 (보라색 통일) */
  numberBadgeHighlighted: 'border-purple-400 text-purple-700',

  /** 제목 텍스트 - 기본 상태 */
  titleText: 'whitespace-nowrap text-3xs leading-none text-slate-400 tracking-tight',

  /** 제목 텍스트 - 하이라이트 상태 (보라색 통일) */
  titleTextHighlighted: 'text-purple-700',
} as const;

/**
 * AQ (Additional Question) 스타일
 */
export const AQ_STYLES = {
  /** AQ 섹션 컨테이너 (prose 제외) */
  container: 'additional-question-section not-prose',

  /** AQ 헤더 */
  header: 'text-foreground mb-3 mt-6 flex items-center gap-2 text-base font-medium',

  /** AQ 리스트 */
  list: 'my-2 space-y-2 pl-0',

  /** AQ 리스트 아이템 */
  listItem:
    'not-prose m-0 flex cursor-pointer items-center justify-between rounded-md border border-[#e5e7eb] px-4 py-2 text-sm font-normal transition-colors hover:bg-gray-50',

  /** AQ 리스트 아이템 텍스트 */
  listItemText: 'flex-1',

  /** AQ 리스트 아이템 아이콘 (텍스트 화살표) */
  listItemIcon: 'ml-2 h-4 w-4 text-[#020617]',
} as const;

/**
 * XML 태그 블록 스타일 (사용자 정의 태그 렌더링)
 */
export const XML_TAG_STYLES = {
  /** 태그명 스타일 (빨간색 모노스페이스) */
  tagName: 'xml-tag-name',
  /** outer wrapper (마크다운 렌더링된 block-level HTML 포함) */
  block: 'xml-tag-block',
  /** plain text fallback wrapper (white-space: pre-wrap) */
  pre: 'xml-tag-pre',
  /** 콘텐츠 영역 (들여쓰기) */
  content: 'xml-tag-content',
} as const;

const TH_TD =
  'px-4 !py-2 !leading-5 align-middle border-b border-gray-200 [&:has([role=checkbox])]:pr-0 min-w-[100px] max-w-[300px]';

/**
 * 기타 마크다운 요소 스타일
 */
export const MARKDOWN_STYLES = {
  /** 헤딩 스타일 (prose 오버라이드를 위해 !important 사용) */
  heading: {
    h1: 'first:!mt-0 !mb-3 !my-4 border-b border-gray-300 pb-2 !text-2xl !font-extrabold !tracking-tight text-gray-900',
    h2: 'first:!mt-0 !mb-3 !my-4 !text-xl !font-bold text-gray-800',
    h3: 'first:!mt-0 !mb-2 !my-4 !text-lg !font-semibold text-gray-700',
    h4: 'first:!mt-0 !mb-1 !my-4 !text-base !font-semibold text-gray-600',
    h5: 'first:!mt-0 !mb-1 !my-3 !text-sm !font-semibold text-gray-500',
    h6: 'first:!mt-0 !mb-1 !my-2 !text-xs !font-semibold text-gray-400',
  },

  /** 테이블 스타일 */
  table: {
    // 표 전체 wrapper: 가로 스크롤 가능
    wrapper: 'pb-4 relative overflow-x-auto',

    table: 'mb-0 mt-1 caption-bottom text-sm border-separate border-spacing-0 w-max min-w-full',
    // thead: 헤더 배경만 강조, border는 일반 굵기
    thead: 'border-b border-gray-300',
    // th: 적절한 너비 범위 설정, 넘치면 줄바꿈
    th: `text-muted-foreground text-left font-bold ${TH_TD}`,
    // tbody: 마지막 tr은 border 없음
    tbody: '[&_tr:last-child]:border-0',
    // tr: 아래 가로선(b), hover
    tr: 'hover:bg-muted/50 data-[state=selected]:bg-muted border-b border-gray-200 transition-colors',
    // td: 적절한 너비 범위 설정, 넘치면 줄바꿈
    td: `${TH_TD}`,
  },

  /** 리스트 스타일 - 색상은 prose에서 상속 */
  list: {
    ul: '!my-0.5 md:!my-1 list-disc !pl-5 md:!pl-6',
    ol: '!my-0.5 md:!my-1 list-decimal !pl-7 md:!pl-8',
    li: 'm-0 p-0 !my-0.5 md:!my-1 text-base',
  },

  /** 기타 */
  strong: 'font-semibold', // prose 기본값(600)과 동일
  link: 'text-blue-600 underline',
  blockquote: '!my-4 border-l-4 border-indigo-500 pl-4 text-gray-600 not-italic',
  // 부모가 li이면 my-1, 아니면 기본 마진
  // 색상은 prose에서 상속
  paragraph: 'align-middle !my-2 [&:where(li_*)]:!my-1 text-base',

  /** 이미지 */
  image: {
    wrapper: 'not-prose group my-0 inline-block align-top leading-[0]',
    container: 'relative overflow-hidden rounded-lg border shadow-sm',
    img: 'm-0 block object-cover transition-all duration-200',
  },
} as const;
