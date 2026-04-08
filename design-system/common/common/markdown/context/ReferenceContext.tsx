'use client';

import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useReferenceUIStore } from '@/stores/reference-ui-store';
import { FlowSearchReference, VectorReference, WebSearchReference } from '@flowai/shared';

/**
 * Reference Context
 *
 * 마크다운 렌더링 시 Reference lookup을 위한 컨텍스트
 *
 * **역할:**
 * - 스트리밍 중 미완성 태그 필터링을 위한 lookup 제공
 *
 * **Reference 등록은 아래 훅에서 처리:**
 * - useReferenceRegistration.registerReferenceChips (비스트리밍)
 * - useStreamingDOM.registerNewReferenceChips (스트리밍)
 * - useFlowSearchSSE.registerFlowSearchReferencesFromDOM (Flow Search embed)
 */

/* -----------------------------
   Types
   ----------------------------- */

interface ReferenceContextValue {
  /** 현재 메시지 ID */
  messageId: number;

  /** 스트리밍 중 여부 (마지막 메시지이고 스트리밍 활성화) */
  isStreamingMessage: boolean;

  /** Vector Reference lookup - "id:chunkIndex" → { title, content? } */
  vectorReferenceLookup: Map<string, { title: string; content?: string }> | null;

  /** Flow Search Reference lookup - "type:id" → { title, url, createdAt } */
  flowSearchReferenceLookup: Map<string, { title: string; url: string; createdAt?: string }> | null;

  /** Web Search Reference lookup - URL → { title, snippet?, publishedTime? } */
  webSearchReferenceLookup: Map<string, { title: string; snippet?: string; publishedTime?: string }> | null;

  /** Reference 칩 인덱스 카운터 (렌더링 순서) */
  referenceChipIndexRef: { current: number };
}

const ReferenceContext = createContext<ReferenceContextValue | null>(null);

/* -----------------------------
   Hook
   ----------------------------- */

/**
 * Reference Context Hook
 *
 * VrElement, FsElement 등 커스텀 마크다운 엘리먼트에서 사용
 * Context가 없으면 에러 발생 (Provider 필수)
 */
export function useReferenceContext(): ReferenceContextValue {
  const context = useContext(ReferenceContext);
  if (!context) {
    throw new Error('useReferenceContext must be used within ReferenceProvider');
  }
  return context;
}

/**
 * Reference Context Hook (Optional)
 *
 * Context가 없어도 에러 발생하지 않음 (null 반환)
 * 스트리밍 완료 후 재렌더링 시 등에서 사용
 */
export function useReferenceContextOptional(): ReferenceContextValue | null {
  return useContext(ReferenceContext);
}

/* -----------------------------
   Provider
   ----------------------------- */

interface ReferenceProviderProps {
  children: ReactNode;
  messageId: number;
  isStreamingMessage: boolean;
  referenceChipIndexRef: { current: number };
  /** DB에서 로드된 메시지의 저장된 Vector References (비스트리밍용) */
  storedVectorReferences?: VectorReference[];
  /** DB에서 로드된 메시지의 저장된 Flow Search References (비스트리밍용) */
  storedFlowSearchReferences?: FlowSearchReference[];
  /** DB에서 로드된 메시지의 저장된 Web Search References (비스트리밍용) */
  storedWebSearchReferences?: WebSearchReference[];
}

/**
 * Reference Provider
 *
 * ChatMessageList 또는 AIMessage에서 제공
 * 마크다운 렌더러 내 커스텀 엘리먼트들이 사용
 */
export function ReferenceProvider({
  children,
  messageId,
  isStreamingMessage,
  referenceChipIndexRef,
  storedVectorReferences,
  storedFlowSearchReferences,
  storedWebSearchReferences,
}: ReferenceProviderProps) {
  // Store에서 스트리밍 중 임시 데이터 가져오기
  const vectorReferenceList = useReferenceUIStore((s) => s.vectorReferenceList);
  const flowSearchReferenceList = useReferenceUIStore((s) => s.flowSearchReferenceList);
  const webSearchReferenceList = useReferenceUIStore((s) => s.webSearchReferenceList);

  // Vector Reference Lookup 생성 (O(1) 검색 + 데이터 조회)
  // SSE 스트리밍 데이터 + DB에서 로드된 저장 데이터 모두 포함
  const vectorReferenceLookup = useMemo(() => {
    const hasStreamingData = Array.isArray(vectorReferenceList) && vectorReferenceList.length > 0;
    const hasStoredData = Array.isArray(storedVectorReferences) && storedVectorReferences.length > 0;

    if (!hasStreamingData && !hasStoredData) {
      return null;
    }

    const map = new Map<string, { title: string; content?: string }>();

    // 1. 저장된 데이터 먼저 추가 (DB에서 로드된 메시지)
    if (hasStoredData) {
      for (const ref of storedVectorReferences!) {
        if (!ref?.id) continue;
        const normalizedChunkIndex = Number(ref.chunkIndex);
        if (Number.isNaN(normalizedChunkIndex)) continue;
        map.set(`${ref.id}:${normalizedChunkIndex}`, {
          title: ref.title,
          content: ref.content,
        });
      }
    }

    // 2. SSE 스트리밍 데이터 추가 (덮어쓰기 - 최신 데이터 우선)
    if (hasStreamingData) {
      for (const ref of vectorReferenceList) {
        if (!ref?.id) continue;
        const normalizedChunkIndex = Number(ref.chunkIndex);
        if (Number.isNaN(normalizedChunkIndex)) continue;
        map.set(`${ref.id}:${normalizedChunkIndex}`, {
          title: ref.title,
          content: ref.content,
        });
      }
    }

    return map;
  }, [vectorReferenceList, storedVectorReferences]);

  // Flow Search Reference Lookup 생성 (O(1) 검색 + 데이터 조회)
  // SSE 스트리밍 데이터 + DB에서 로드된 저장 데이터 모두 포함
  const flowSearchReferenceLookup = useMemo(() => {
    const hasStreamingData = Array.isArray(flowSearchReferenceList) && flowSearchReferenceList.length > 0;
    const hasStoredData = Array.isArray(storedFlowSearchReferences) && storedFlowSearchReferences.length > 0;

    if (!hasStreamingData && !hasStoredData) {
      return null;
    }

    const map = new Map<string, { title: string; url: string; createdAt?: string }>();

    /** 내용 텍스트를 10자로 잘라서 fallback title 생성 */
    const contentFallback = (text?: string) => (text ? (text.length > 10 ? text.slice(0, 10) + '..' : text) : '');

    // 헬퍼 함수: FlowSearchReference 배열을 Map에 추가
    const addFlowRefsToMap = (flowRefs: FlowSearchReference[]) => {
      for (const flowRef of flowRefs) {
        flowRef.projectList?.forEach((p) => {
          const title = p.title || contentFallback(p.description);
          if (title && p.url) map.set(`project:${p.projectId}`, { title, url: p.url, createdAt: p.createdAt });
        });
        flowRef.postList?.forEach((p) => {
          if (!p.url) return;
          const title = p.title || contentFallback(p.contents);
          if (title) map.set(`post:${p.postId}`, { title, url: p.url, createdAt: p.createdAt });
        });
        flowRef.commentList?.forEach((c) => {
          if (!c.url) return;
          const title = c.postTitle || contentFallback(c.commentContent);
          map.set(`comment:${c.commentId}`, { title, url: c.url, createdAt: c.createdAt });
        });
        flowRef.chatList?.forEach((c) => {
          if (!c.url) return;
          const title = c.roomName || contentFallback(c.message);
          map.set(`chat:${c.chatId}`, { title, url: c.url, createdAt: c.createdAt });
        });
        flowRef.fileList?.forEach((f) => {
          if (f.fileName && f.url)
            map.set(`file:${f.fileId}`, { title: f.fileName, url: f.url, createdAt: f.createdAt });
        });
        flowRef.chatFileList?.forEach((f) => {
          if (f.fileName && f.url)
            map.set(`chatfile:${f.fileId}`, { title: f.fileName, url: f.url, createdAt: f.createdAt });
        });
      }
    };

    // 1. 저장된 데이터 먼저 추가 (DB에서 로드된 메시지)
    if (hasStoredData) {
      addFlowRefsToMap(storedFlowSearchReferences!);
    }

    // 2. SSE 스트리밍 데이터 추가 (덮어쓰기 - 최신 데이터 우선)
    if (hasStreamingData) {
      addFlowRefsToMap(flowSearchReferenceList);
    }

    return map;
  }, [flowSearchReferenceList, storedFlowSearchReferences]);

  // Web Search Reference Lookup 생성 (O(1) 검색 + 데이터 조회)
  // SSE 스트리밍 데이터 + DB에서 로드된 저장 데이터 모두 포함
  const webSearchReferenceLookup = useMemo(() => {
    const hasStreamingData = Array.isArray(webSearchReferenceList) && webSearchReferenceList.length > 0;
    const hasStoredData = Array.isArray(storedWebSearchReferences) && storedWebSearchReferences.length > 0;

    if (!hasStreamingData && !hasStoredData) {
      return null;
    }

    const map = new Map<string, { title: string; snippet?: string; publishedTime?: string }>();

    // 헬퍼 함수: WebSearchReference 배열을 Map에 추가
    const addWebRefsToMap = (wsRefs: WebSearchReference[]) => {
      for (const wsRef of wsRefs) {
        wsRef.results?.forEach((result) => {
          map.set(result.url, {
            title: result.title,
            snippet: result.snippet,
            publishedTime: result.publishedTime,
          });
        });
      }
    };

    // 1. 저장된 데이터 먼저 추가 (DB에서 로드된 메시지)
    if (hasStoredData) {
      addWebRefsToMap(storedWebSearchReferences!);
    }

    // 2. SSE 스트리밍 데이터 추가 (덮어쓰기 - 최신 데이터 우선)
    if (hasStreamingData) {
      addWebRefsToMap(webSearchReferenceList);
    }

    return map;
  }, [webSearchReferenceList, storedWebSearchReferences]);

  const value = useMemo<ReferenceContextValue>(
    () => ({
      messageId,
      isStreamingMessage,
      vectorReferenceLookup,
      flowSearchReferenceLookup,
      webSearchReferenceLookup,
      referenceChipIndexRef,
    }),
    [
      messageId,
      isStreamingMessage,
      vectorReferenceLookup,
      flowSearchReferenceLookup,
      webSearchReferenceLookup,
      referenceChipIndexRef,
    ],
  );

  return <ReferenceContext.Provider value={value}>{children}</ReferenceContext.Provider>;
}
