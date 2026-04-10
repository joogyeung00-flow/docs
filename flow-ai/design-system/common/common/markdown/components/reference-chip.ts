/**
 * @file reference-chip.ts
 * @description Reference 칩 렌더링 헬퍼 함수
 *
 * **책임:**
 * - VR/WS/FS 칩 및 그룹 렌더링
 * - Lookup maps 관리 (DB + SSE 데이터 merge)
 * - Title 조회 및 하이라이팅 지원
 */

import { useReferenceUIStore } from '@/stores/reference-ui-store';
import { normalizeFlowChipType } from '@/lib/reference/reference-key';
import { FlowSearchReference, VectorReference, WebSearchReference } from '@flowai/shared';
import { escapeHtml, truncateTitle } from '../utils/common';
import { REFERENCE_CHIP_STYLES } from '../utils/markdown-styles';
import { FS_TYPE_LABELS } from '../utils/reference-labels';

/** 주입된 다국어 라벨 (MarkdownRenderer에서 setReferenceChipLabels로 설정) */
export type ReferenceChipLabels = {
  fsType: { project: string; post: string; comment: string; chat: string };
  fileLabel: string;
  chipTitleRemaining: string;
};

let _referenceChipLabels: ReferenceChipLabels | null = null;

export function setReferenceChipLabels(labels: ReferenceChipLabels | null) {
  _referenceChipLabels = labels;
}

export function clearReferenceChipLabels() {
  _referenceChipLabels = null;
}

/** 파일 확장자 → 카테고리 라벨 */
const FILE_EXTENSION_LABELS: Record<string, string> = {
  pdf: 'PDF',
  doc: 'WORD',
  docx: 'WORD',
  rtf: 'WORD',
  odt: 'WORD',
  xls: 'EXCEL',
  xlsx: 'EXCEL',
  csv: 'EXCEL',
  ods: 'EXCEL',
  ppt: 'PPT',
  pptx: 'PPT',
  odp: 'PPT',
  txt: 'TXT',
  zip: 'ZIP',
  rar: 'ZIP',
  '7z': 'ZIP',
  tar: 'ZIP',
  gz: 'ZIP',
  jpg: 'IMAGE',
  jpeg: 'IMAGE',
  png: 'IMAGE',
  gif: 'IMAGE',
  bmp: 'IMAGE',
  webp: 'IMAGE',
  svg: 'IMAGE',
};

/** 파일명에서 확장자 라벨 추출 (e.g. "report.pdf" → "PDF") */
function getFileExtensionLabel(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot <= 0) return _referenceChipLabels?.fileLabel ?? '파일';
  const ext = fileName.slice(lastDot + 1).toLowerCase();
  return FILE_EXTENSION_LABELS[ext] ?? ext.toUpperCase();
}

/** 내용 텍스트를 10자로 자르고 '..' 붙이기 */
function truncateContent(text: string, maxLen = 10): string {
  if (!text) return '';
  return text.length > maxLen ? text.slice(0, maxLen) + '..' : text;
}

/** 칩 그룹 title 속성: "첫제목 외 N개" 형태 (다국어 템플릿 사용) */
function formatChipTitleRemaining(firstTitle: string, remainingCount: number): string {
  const template = _referenceChipLabels?.chipTitleRemaining;
  if (template) {
    return template.replace(/\{\{first\}\}/g, firstTitle).replace(/\{\{count\}\}/g, String(remainingCount));
  }
  return `${firstTitle} 외 ${remainingCount}개`;
}

/** createdAt(14자리 yyyyMMddHHmmss) → 'YY.MM 포맷 */
function formatCreatedAtShort(createdAt: string): string {
  if (!createdAt || createdAt.length < 6) return '';
  return `'${createdAt.slice(2, 4)}.${createdAt.slice(4, 6)}`;
}

/**
 * FS 칩 displayTitle 생성: prefix/suffix 보존, 가운데 title만 truncate
 * maxTitleLength는 title 부분의 최대 길이 (prefix/suffix 제외)
 *
 * @example
 * truncateFsDisplayTitle('[게시글] ', '아주 긴 제목의 내용입니다 어쩌고', " '25.01")
 * // → "[게시글] 아주 긴 제목의 내용입니다 어... '25.01"  (title 20자 기준)
 */
function truncateFsDisplayTitle(prefix: string, title: string, dateSuffix: string, maxTitleLength = 20): string {
  if (title.length <= maxTitleLength) {
    return `${prefix}${title}${dateSuffix}`;
  }
  return `${prefix}${title.slice(0, maxTitleLength - 3).trimEnd()}...${dateSuffix}`;
}

/**
 * FS 칩 타입 라벨 구하기
 * - file/chatfile: 파일 확장자 라벨 (PDF, EXCEL 등)
 * - 나머지: 타입 라벨 (게시글, 채팅 등)
 */
function getFsTypeLabel(type: string, title: string): string {
  const lowerType = type.toLowerCase();
  if (lowerType === 'file' || lowerType === 'chatfile') {
    return getFileExtensionLabel(title);
  }
  const fsType = _referenceChipLabels?.fsType ?? FS_TYPE_LABELS;
  return fsType[lowerType as keyof typeof fsType] ?? '';
}

/**
 * 렌더링 시 참조할 Lookup Maps (모듈 레벨)
 *
 * marked.js 확장은 동기적으로 실행되어 React Context에 접근 불가.
 * renderMarkdown() 호출 전에 setReferenceLookups()로 주입하면
 * renderReferenceChip()이 DB 저장 데이터도 참조 가능.
 */
let _vectorReferenceLookup: Map<string, { title: string; content?: string }> | null = null;
let _flowSearchReferenceLookup: Map<string, { title: string; url: string; createdAt?: string }> | null = null;
let _webSearchReferenceLookup: Map<string, { title: string; snippet?: string; publishedTime?: string }> | null = null;

/** 렌더링 전에 lookup maps를 주입 (ReferenceContext의 lookup maps 전달) */
export function setReferenceLookups(lookups: {
  vectorReferenceLookup?: Map<string, { title: string; content?: string }> | null;
  flowSearchReferenceLookup?: Map<string, { title: string; url: string; createdAt?: string }> | null;
  webSearchReferenceLookup?: Map<string, { title: string; snippet?: string; publishedTime?: string }> | null;
}) {
  _vectorReferenceLookup = lookups.vectorReferenceLookup ?? null;
  _flowSearchReferenceLookup = lookups.flowSearchReferenceLookup ?? null;
  _webSearchReferenceLookup = lookups.webSearchReferenceLookup ?? null;
}

/** 렌더링 완료 후 lookup maps 초기화 */
export function clearReferenceLookups() {
  _vectorReferenceLookup = null;
  _flowSearchReferenceLookup = null;
  _webSearchReferenceLookup = null;
}

/**
 * Reference Chip 타입
 */
export type ReferenceChipType = 'vr' | 'ws' | 'fs';

/**
 * Reference Chip 공통 속성
 */
export interface ReferenceChipAttrs {
  title?: string;
  url?: string;
  // VR 전용
  id?: string;
  chunkindex?: string;
  sentences?: string;
  // FS 전용
  type?: string;
  created?: string;
}

const parseSentenceIndexes = (sentences?: string): number[] =>
  Array.from(
    new Set(
      (sentences ?? '')
        .split(',')
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value)),
    ),
  ).sort((a, b) => a - b);

const encodeDataItems = (items: unknown[]): string => escapeHtml(JSON.stringify(items));

/**
 * vectorReferenceList에서 id와 chunkIndex로 title 찾기
 * 스트리밍 중 VR 칩 렌더링 시 사용 (LLM이 title을 출력하지 않으므로)
 */
function findVectorReferenceTitle(refList: VectorReference[], id: string, chunkIndex: number): string | null {
  const matchingRef = refList.find((r) => r.id === id && r.chunkIndex === chunkIndex);
  return matchingRef?.title || null;
}

/**
 * webSearchReferenceList에서 url로 title 찾기
 * 스트리밍 중 WS 칩 렌더링 시 사용 (LLM이 title을 출력하지 않으므로)
 */
function findWebSearchTitle(refList: WebSearchReference[], url: string): string | null {
  for (const ref of refList) {
    const matchingResult = ref.results?.find((r) => r.url === url);
    if (matchingResult?.title) return matchingResult.title;
  }
  return null;
}

/**
 * flowSearchReferenceList에서 type과 id로 title 찾기
 * 스트리밍 중 FS 칩 렌더링 시 사용 (LLM이 title을 출력하지 않으므로)
 */
function findFlowSearchTitle(refList: FlowSearchReference[], type: string, id: string): string | null {
  const normalizedType = normalizeFlowChipType(type);
  if (!normalizedType) return null;

  for (const ref of refList) {
    switch (normalizedType) {
      case 'project': {
        const p = ref.projectList?.find((p) => String(p.projectId) === id);
        if (p?.title) return p.title;
        if (p?.description) return truncateContent(p.description);
        break;
      }
      case 'post': {
        const p = ref.postList?.find((p) => String(p.postId) === id);
        if (p?.title) return p.title;
        if (p?.contents) return truncateContent(p.contents);
        break;
      }
      case 'comment': {
        const c = ref.commentList?.find((c) => String(c.commentId) === id);
        if (c?.postTitle) return c.postTitle;
        if (c?.commentContent) return truncateContent(c.commentContent);
        break;
      }
      case 'chat': {
        const c = ref.chatList?.find((c) => String(c.chatId) === id);
        if (c?.roomName) return c.roomName;
        if (c?.message) return truncateContent(c.message);
        break;
      }
      case 'file': {
        const f = ref.fileList?.find((f) => String(f.fileId) === id);
        if (f?.fileName) return f.fileName;
        break;
      }
      case 'chatfile': {
        const f = ref.chatFileList?.find((f) => String(f.fileId) === id);
        if (f?.fileName) return f.fileName;
        break;
      }
    }
  }
  return null;
}

/**
 * flowSearchReferenceList에서 type과 id로 createdAt 찾기
 */
function findFlowSearchCreatedAt(refList: FlowSearchReference[], type: string, id: string): string | null {
  for (const ref of refList) {
    const lowerType = type.toLowerCase();
    switch (lowerType) {
      case 'project': {
        const p = ref.projectList?.find((p) => String(p.projectId) === id);
        if (p?.createdAt) return p.createdAt;
        break;
      }
      case 'post': {
        const p = ref.postList?.find((p) => String(p.postId) === id);
        if (p?.createdAt) return p.createdAt;
        break;
      }
      case 'comment': {
        const c = ref.commentList?.find((c) => String(c.commentId) === id);
        if (c?.createdAt) return c.createdAt;
        break;
      }
      case 'chat': {
        const c = ref.chatList?.find((c) => String(c.chatId) === id);
        if (c?.createdAt) return c.createdAt;
        break;
      }
      case 'file': {
        const f = ref.fileList?.find((f) => String(f.fileId) === id);
        if (f?.createdAt) return f.createdAt;
        break;
      }
      case 'chatfile': {
        const f = ref.chatFileList?.find((f) => String(f.fileId) === id);
        if (f?.createdAt) return f.createdAt;
        break;
      }
    }
  }
  return null;
}

/**
 * Reference Chip 공통 HTML 생성 (VR, WS, FS 통합)
 *
 * **스타일 통일:**
 * - 모든 출처 칩은 동일한 wrapper, titleText 스타일 사용
 * - VR: span 태그 (클릭 시 하이라이트)
 * - WS/FS: span 태그 (캔버스 연동)
 *
 * **title 조회:**
 * - VR/FS: LLM이 title을 출력하지 않으므로 store에서 조회
 * - WS: LLM이 title을 출력하므로 그대로 사용
 *
 * @param chipType - 칩 타입 ('vr' | 'ws' | 'fs')
 * @param attrs - 칩 속성
 * @param index - 렌더링 순서 인덱스
 * @returns HTML 문자열
 */
export function renderReferenceChip(chipType: ReferenceChipType, attrs: ReferenceChipAttrs, index: number): string {
  // VR 칩 렌더링
  if (chipType === 'vr') {
    let vrTitle = 'ref';
    if (attrs.id && attrs.chunkindex) {
      // 1) 주입된 lookup map 우선 참조 (DB + SSE merge 데이터)
      const lookupKey = `${attrs.id}:${attrs.chunkindex}`;
      const lookupResult = _vectorReferenceLookup?.get(lookupKey);
      if (lookupResult?.title) {
        vrTitle = lookupResult.title;
      } else {
        // 2) fallback: streaming store
        const vectorReferenceList = useReferenceUIStore.getState().vectorReferenceList;
        vrTitle = findVectorReferenceTitle(vectorReferenceList, attrs.id, parseInt(attrs.chunkindex, 10)) || 'ref';
      }
    }
    const truncatedVrTitle = truncateTitle(vrTitle);
    const vrTitleSpan = `<span class="${REFERENCE_CHIP_STYLES.titleText}">${escapeHtml(truncatedVrTitle)}</span>`;

    const vectorItems = [
      {
        id: attrs.id || '',
        chunkIndex: Number(attrs.chunkindex || 0),
        sentenceIndexes: parseSentenceIndexes(attrs.sentences),
      },
    ];
    const dataAttrs = `data-vr-id="${attrs.id || ''}" data-vr-chunkindex="${attrs.chunkindex || ''}" data-vr-sentences="${attrs.sentences || ''}" data-vr-items="${encodeDataItems(vectorItems)}" data-vr-title="${escapeHtml(vrTitle)}" data-vr-index="${index}"`;
    return `<span class="${REFERENCE_CHIP_STYLES.wrapper} streaming-vr-group" ${dataAttrs} title="${escapeHtml(vrTitle)}" style="cursor: pointer;">${vrTitleSpan}</span>`;
  }

  // WS 칩 렌더링
  if (chipType === 'ws') {
    let wsTitle = attrs.title;
    if (!wsTitle && attrs.url) {
      // 1) 주입된 lookup map 우선 참조
      const lookupResult = _webSearchReferenceLookup?.get(attrs.url);
      if (lookupResult?.title) {
        wsTitle = lookupResult.title;
      } else {
        // 2) fallback: streaming store
        const webSearchReferenceList = useReferenceUIStore.getState().webSearchReferenceList;
        wsTitle = findWebSearchTitle(webSearchReferenceList, attrs.url) || 'ref';
      }
    } else {
      wsTitle = wsTitle || 'ref';
    }
    const truncatedWsTitle = truncateTitle(wsTitle);
    const wsTitleSpan = `<span class="${REFERENCE_CHIP_STYLES.titleText}">${escapeHtml(truncatedWsTitle)}</span>`;

    const webItems = [{ url: attrs.url || '' }];
    const dataAttrs = `data-ws-url="${attrs.url || ''}" data-ws-items="${encodeDataItems(webItems)}" data-ws-title="${escapeHtml(wsTitle)}" data-ws-index="${index}"`;
    return `<span class="${REFERENCE_CHIP_STYLES.wrapper} streaming-ws-group" ${dataAttrs} title="${escapeHtml(wsTitle)}" style="cursor: pointer;">${wsTitleSpan}</span>`;
  }

  // FS 칩 렌더링
  let fsTitle = 'Flow';
  let fsCreatedAt = '';
  if (attrs.id && attrs.type) {
    // 1) 주입된 lookup map 우선 참조 (DB + SSE merge 데이터)
    const lookupKey = `${attrs.type.toLowerCase()}:${attrs.id}`;
    const lookupResult = _flowSearchReferenceLookup?.get(lookupKey);
    if (lookupResult?.title) {
      fsTitle = lookupResult.title;
      fsCreatedAt = lookupResult.createdAt ?? '';
    } else {
      // 2) fallback: streaming store
      const flowSearchReferenceList = useReferenceUIStore.getState().flowSearchReferenceList;
      fsTitle = findFlowSearchTitle(flowSearchReferenceList, attrs.type, attrs.id) || 'Flow';
      fsCreatedAt = findFlowSearchCreatedAt(flowSearchReferenceList, attrs.type, attrs.id) ?? '';
    }
  }
  // attrs.created fallback
  if (!fsCreatedAt) fsCreatedAt = attrs.created ?? '';

  // [타입] 제목 'YY.MM 형태로 구성 (prefix/suffix 보존, 가운데 title만 truncate)
  const typeLabel = getFsTypeLabel(attrs.type ?? '', fsTitle);
  const prefix = typeLabel ? `[${typeLabel}] ` : '';
  const dateSuffix = fsCreatedAt ? ` ${formatCreatedAtShort(fsCreatedAt)}` : '';
  const displayTitle = `${prefix}${fsTitle}${dateSuffix}`;

  const truncatedFsTitle = truncateFsDisplayTitle(prefix, fsTitle, dateSuffix);
  const fsTitleSpan = `<span class="${REFERENCE_CHIP_STYLES.titleText}">${escapeHtml(truncatedFsTitle)}</span>`;

  const flowItems = [{ id: attrs.id || '', type: attrs.type || '' }];
  const dataAttrs = `data-fs-id="${attrs.id || ''}" data-fs-type="${attrs.type || ''}" data-fs-items="${encodeDataItems(flowItems)}" data-fs-index="${index}"`;
  return `<span class="${REFERENCE_CHIP_STYLES.wrapper} streaming-fs-group" ${dataAttrs} title="${escapeHtml(displayTitle)}" style="cursor: pointer;">${fsTitleSpan}</span>`;
}

/**
 * WS Group HTML 생성 (Web Search Citation Group)
 * 스트리밍 중 연속된 ws 태그를 그룹으로 표시
 *
 * @param items - ws 아이템 배열 [{url}, ...]
 * @param startIndex - 시작 인덱스 (렌더링 순서)
 * @returns HTML 문자열
 */
export function renderWSGroup(items: Array<{ title?: string; url?: string }>, startIndex: number): string {
  // 유효한 아이템만 필터링 (url만 필수)
  const validItems = items.filter((item) => item.url);

  if (validItems.length === 0) {
    return '';
  }

  // 단일 아이템인 경우 일반 칩으로 렌더링
  if (validItems.length === 1) {
    return renderReferenceChip('ws', validItems[0], startIndex);
  }

  // 다중 아이템인 경우: 첫 번째 + "+N" 형태로 그룹 렌더링
  const firstItem = validItems[0];
  let firstTitle = firstItem.title || '';
  if (!firstTitle && firstItem.url) {
    // 1) 주입된 lookup map 우선 참조
    const lookupResult = _webSearchReferenceLookup?.get(firstItem.url);
    if (lookupResult?.title) {
      firstTitle = lookupResult.title;
    } else {
      // 2) fallback: streaming store
      const webSearchReferenceList = useReferenceUIStore.getState().webSearchReferenceList;
      firstTitle = findWebSearchTitle(webSearchReferenceList, firstItem.url) || 'ref';
    }
  }
  firstTitle = firstTitle || 'ref';
  const remainingCount = validItems.length - 1;

  const itemsPayload = validItems.map((item) => ({ url: item.url || '' }));
  const dataAttrs = `data-ws-items="${encodeDataItems(itemsPayload)}" data-ws-index="${startIndex}"`;

  const titleAttr = escapeHtml(formatChipTitleRemaining(firstTitle, remainingCount));
  return `<span class="${REFERENCE_CHIP_STYLES.wrapper} streaming-ws-group" ${dataAttrs} title="${titleAttr}" style="cursor: pointer;"><span class="${REFERENCE_CHIP_STYLES.titleText}">${escapeHtml(truncateTitle(firstTitle))} +${remainingCount}</span></span>`;
}

/**
 * FS Group HTML 생성 (Flow Search Citation Group)
 * 스트리밍 중 연속된 fs 태그를 그룹으로 표시
 *
 * @param items - fs 아이템 배열 [{id, type}, ...]
 * @param startIndex - 시작 인덱스
 * @returns HTML 문자열
 */
export function renderFSGroup(
  items: Array<{ title?: string; url?: string; type?: string; created?: string; id?: string }>,
  startIndex: number,
): string {
  // 유효한 아이템만 필터링 (id, type만 필수)
  const validItems = items.filter((item) => item.id && item.type);

  if (validItems.length === 0) {
    return '';
  }

  // 단일 아이템인 경우 일반 칩으로 렌더링
  if (validItems.length === 1) {
    return renderReferenceChip('fs', validItems[0], startIndex);
  }

  // 다중 아이템인 경우: 첫 번째 + "+N" 형태로 그룹 렌더링
  const firstItem = validItems[0];
  let firstTitle = firstItem.title || '';
  let firstCreatedAt = '';
  if (!firstTitle && firstItem.id && firstItem.type) {
    // 1) 주입된 lookup map 우선 참조
    const lookupKey = `${firstItem.type.toLowerCase()}:${firstItem.id}`;
    const lookupResult = _flowSearchReferenceLookup?.get(lookupKey);
    if (lookupResult?.title) {
      firstTitle = lookupResult.title;
      firstCreatedAt = lookupResult.createdAt ?? '';
    } else {
      // 2) fallback: streaming store
      const flowSearchReferenceList = useReferenceUIStore.getState().flowSearchReferenceList;
      firstTitle = findFlowSearchTitle(flowSearchReferenceList, firstItem.type, firstItem.id) || 'Flow';
      firstCreatedAt = findFlowSearchCreatedAt(flowSearchReferenceList, firstItem.type, firstItem.id) ?? '';
    }
  }
  firstTitle = firstTitle || 'Flow';
  if (!firstCreatedAt) firstCreatedAt = firstItem.created ?? '';

  // [타입] 제목 'YY.MM +N 형태로 구성
  const typeLabel = getFsTypeLabel(firstItem.type ?? '', firstTitle);
  const prefix = typeLabel ? `[${typeLabel}] ` : '';
  const dateSuffix = firstCreatedAt ? ` ${formatCreatedAtShort(firstCreatedAt)}` : '';
  const displayTitle = `${prefix}${firstTitle}${dateSuffix}`;
  const remainingCount = validItems.length - 1;

  const itemsPayload = validItems.map((item) => ({ id: item.id || '', type: item.type || '' }));
  const dataAttrs = `data-fs-items="${encodeDataItems(itemsPayload)}" data-fs-index="${startIndex}"`;

  const titleAttr = escapeHtml(formatChipTitleRemaining(displayTitle, remainingCount));
  return `<span class="${REFERENCE_CHIP_STYLES.wrapper} streaming-fs-group" ${dataAttrs} title="${titleAttr}" style="cursor: pointer;"><span class="${REFERENCE_CHIP_STYLES.titleText}">${escapeHtml(truncateFsDisplayTitle(prefix, firstTitle, dateSuffix))} +${remainingCount}</span></span>`;
}

/**
 * VR Group HTML 생성 (Vector Reference Group)
 * 스트리밍 중 연속된 vr 태그를 그룹으로 표시
 *
 * @param items - vr 아이템 배열 [{id, chunkindex, sentences}, ...]
 * @param startIndex - 시작 인덱스
 * @returns HTML 문자열
 */
export function renderVRGroup(
  items: Array<{ id?: string; chunkindex?: string; sentences?: string; title?: string }>,
  startIndex: number,
): string {
  // 유효한 아이템만 필터링 (id, chunkindex만 필수)
  const validItems = items.filter((item) => item.id && item.chunkindex);

  if (validItems.length === 0) {
    return '';
  }

  // 단일 아이템인 경우 일반 칩으로 렌더링
  if (validItems.length === 1) {
    return renderReferenceChip('vr', validItems[0], startIndex);
  }

  // 다중 아이템인 경우: 첫 번째 + "+N" 형태로 그룹 렌더링
  const firstItem = validItems[0];
  let firstTitle = firstItem.title || '';
  if (!firstTitle && firstItem.id && firstItem.chunkindex) {
    // 1) 주입된 lookup map 우선 참조
    const lookupKey = `${firstItem.id}:${firstItem.chunkindex}`;
    const lookupResult = _vectorReferenceLookup?.get(lookupKey);
    if (lookupResult?.title) {
      firstTitle = lookupResult.title;
    } else {
      // 2) fallback: streaming store
      const vectorReferenceList = useReferenceUIStore.getState().vectorReferenceList;
      firstTitle =
        findVectorReferenceTitle(vectorReferenceList, firstItem.id, parseInt(firstItem.chunkindex, 10)) || 'ref';
    }
  }
  firstTitle = firstTitle || 'ref';
  const remainingCount = validItems.length - 1;

  const itemsPayload = validItems.map((item) => ({
    id: item.id || '',
    chunkIndex: Number(item.chunkindex || 0),
    sentenceIndexes: parseSentenceIndexes(item.sentences),
  }));
  const dataAttrs = `data-vr-items="${encodeDataItems(itemsPayload)}" data-vr-index="${startIndex}"`;

  const titleAttr = escapeHtml(formatChipTitleRemaining(firstTitle, remainingCount));
  return `<span class="${REFERENCE_CHIP_STYLES.wrapper} streaming-vr-group" ${dataAttrs} title="${titleAttr}" style="cursor: pointer;"><span class="${REFERENCE_CHIP_STYLES.titleText}">${escapeHtml(truncateTitle(firstTitle))} +${remainingCount}</span></span>`;
}
