import { useAppTranslation } from '@/hooks/useAppTranslation';
import { i18n } from '@flowai/i18n';
import { useAuth } from '@/components/providers/user/auth-provider';
import { Z_INDEX } from '@/constants/z-index';
import { useIsFunc } from '@/hooks/useFeatureFlag';
import { useAssistantStore } from '@/stores/assistant.store';
import { useChatInputStore } from '@/stores/chat-input.store';
import { useChatStore } from '@/stores/chat.store';
import { useUIStore } from '@/stores/ui-store';
import { FEATURE_FLAG, isFlowAIMember } from '@flowai/shared';
import { ChevronDown, ChevronRight, LucideAirplay, LucideBug, Maximize2, Minimize2, X } from 'lucide-react';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Switch } from '../ui/switch';

interface JsonViewerProps {
  data: any;
  name: string;
  level?: number;
}

interface JsonDebugButtonProps {
  json: Record<string, unknown>;
}

function JsonViewer({ data, name, level = 0 }: JsonViewerProps) {
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const indent = level * 16;

  if (data === null) {
    return (
      <div style={{ paddingLeft: indent }} className='text-gray-500'>
        <span className='text-blue-600'>{name}</span>: <span className='text-gray-400'>null</span>
      </div>
    );
  }

  if (typeof data !== 'object') {
    const valueColor =
      typeof data === 'string' ? 'text-green-600' : typeof data === 'number' ? 'text-purple-600' : 'text-orange-600';
    return (
      <div style={{ paddingLeft: indent }}>
        <span className='text-blue-600'>{name}</span>: <span className={valueColor}>{JSON.stringify(data)}</span>
      </div>
    );
  }

  const isArray = Array.isArray(data);
  const keys = Object.keys(data);
  const isEmpty = keys.length === 0;

  return (
    <div>
      <div
        style={{ paddingLeft: indent }}
        className='flex cursor-pointer items-center py-1 hover:bg-gray-50'
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {!isEmpty &&
          (isExpanded ? <ChevronDown className='mr-1 h-3 w-3' /> : <ChevronRight className='mr-1 h-3 w-3' />)}
        <span className='text-blue-600'>{name}</span>
        <span className='ml-1 text-gray-500'>{isArray ? `[${keys.length}]` : `{${keys.length}}`}</span>
      </div>

      {isExpanded && !isEmpty && (
        <div>
          {keys.map((key) => (
            <JsonViewer key={key} data={data[key]} name={isArray ? `[${key}]` : key} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * canvasSteps의 v.tool_calls[0].args를 1뎁스로 평탄화
 * Before: { id, name, v: { tool_calls: [{ id, name, args: { ... } }] } }
 * After:  { id, name, args: { ... } }
 */
function flattenCanvasSteps(steps: any[]): any[] {
  return steps.map((step) => {
    const args = step.v?.tool_calls?.[0]?.args;
    return {
      id: step.id,
      name: step.name,
      ...(args != null ? { args } : { v: step.v }),
    };
  });
}

function JsonDebugButton({ json }: JsonDebugButtonProps) {
  const { t } = useAppTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  const isDebug = useUIStore((s) => s.isDebug);
  const setDebug = useUIStore((s) => s.setDebug);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [isFull, setIsFull] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    function handleClick(e: MouseEvent) {
      if (!wrapperRef.current) return;
      const target = e.target as Node;
      if (!wrapperRef.current.contains(target)) setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
      document.addEventListener('mousedown', handleClick);
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [isOpen]);

  return (
    <div ref={wrapperRef}>
      <div className='flex items-center justify-center gap-2'>
        <div className='mx-1 flex items-center justify-center gap-1'>
          <LucideAirplay className='h-4' />
          <div className='racking-wider text-sm'>{t(i18n.common.json_debug.developer_mode)}</div>
        </div>

        <Switch checked={isDebug} onCheckedChange={(v) => setDebug(v)} />
        {isDebug && (
          <button
            onClick={() => setIsOpen((v) => !v)}
            className={`flex h-6 w-6 transform items-center justify-center rounded-full text-white shadow-lg transition-all duration-1000 ${
              isDebug
                ? 'animate-in slide-in-from-bottom-2 bg-red-600 hover:bg-red-500'
                : 'animate-out slide-out-to-bottom-2 bg-gray-800 hover:bg-gray-700'
            }`}
            style={{ zIndex: Z_INDEX.JSON_DEBUG_CONTAINER }}
            title={t(i18n.common.json_debug.open_console)}
          >
            <LucideBug className='h-3 w-3' />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          className={`opacity-85 ${
            isFull
              ? 'fixed inset-0 flex flex-col rounded-none border-0 bg-white'
              : 'fixed bottom-[40px] left-[240px] flex h-[600px] w-[600px] flex-col rounded-md border bg-white shadow-2xl'
          }`}
          style={{ zIndex: Z_INDEX.TOAST }}
        >
          <div className='flex items-center justify-between border-b bg-gray-50 px-3 py-2'>
            <div className='flex items-center gap-2 text-sm'>
              <span className='text-gray-700'>{t(i18n.common.json_debug.developer_mode)}</span>
            </div>
            <div className='flex items-center gap-1'>
              <button
                onClick={() => setIsFull((v) => !v)}
                className='flex h-6 w-6 items-center justify-center rounded hover:bg-gray-200'
                title={isFull ? t(i18n.common.json_debug.restore) : t(i18n.common.json_debug.full_size)}
              >
                {isFull ? (
                  <Minimize2 className='h-4 w-4 text-gray-600' />
                ) : (
                  <Maximize2 className='h-4 w-4 text-gray-600' />
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className='flex h-6 w-6 items-center justify-center rounded hover:bg-gray-200'
                title={t(i18n.common.json_debug.close)}
              >
                <X className='h-4 w-4 text-gray-500' />
              </button>
            </div>
          </div>

          <div className={`${isFull ? 'flex-1' : 'h-full'} overflow-auto p-3`}>
            <div className='space-y-2 font-mono text-xs'>
              {Object.entries(json).map(([key, value]) => (
                <JsonViewer key={key} data={value} name={key} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const JsonDebugButtonMemo = memo(JsonDebugButton, (prev, next) => prev.json === next.json);

export const JsonDebugButtonContainer = () => {
  const { thirdPartyInfo } = useAuth();
  const isDebugAllowed = useIsFunc(FEATURE_FLAG.DEBUG_INFO_ALLOWED) || isFlowAIMember(thirdPartyInfo?.thirdPartyUserId);
  const viewMode = useUIStore((s) => s.viewMode);
  const currentStepId = useAssistantStore((s) => s.currentStepId);
  const canvasSteps = useAssistantStore((s) => s.canvasSteps);
  const messageItems = useChatStore((s) => s.messageItems);
  const conversationInputMap = useChatInputStore((s) => s.conversationInputMap);

  const debugPayload = useMemo(
    () => ({
      thirdPartyUserId: thirdPartyInfo?.thirdPartyUserId,
      viewMode,
      currentStepId,
      conversationInputMap,
      messageItems,
      canvasSteps: flattenCanvasSteps(canvasSteps),
    }),
    [thirdPartyInfo?.thirdPartyUserId, viewMode, currentStepId, conversationInputMap, messageItems, canvasSteps],
  );

  if (!isDebugAllowed) {
    return null;
  }

  return <JsonDebugButtonMemo json={debugPayload} />;
};

export default JsonDebugButtonContainer;
