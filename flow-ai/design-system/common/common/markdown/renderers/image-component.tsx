'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { cn } from '@/lib/utils';
import { copyToClipboard } from '@/lib/utils/clipboard';
import { i18n } from '@flowai/i18n';
import { ExternalLink, ImageIcon, Loader2, Maximize2, Copy, Download } from 'lucide-react';
import { useState, Children } from 'react';
import { toast } from 'sonner';
import { isFlowAIApp, isWebView } from '@/lib/utils/device-utils';
import { sendFileDownloadBridge } from '@/lib/utils/file-utils';

// children에서 이미지 관련 요소 확인하는 유틸 함수들
export const hasImageElement = (children: any): boolean => {
  return Children.toArray(children).some((child: any) => child && typeof child === 'object' && child.type === 'img');
};

export const getImageElement = (children: any): any => {
  return Children.toArray(children).find((child: any) => child && typeof child === 'object' && child.type === 'img');
};

// 이미지 dimensions 타입
interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
  orientation: 'landscape' | 'portrait' | 'square';
}

// 간단한 이미지 메타 캐시(리마운트 시 깜빡임 방지)
const imageDimensionsCache = new Map<string, ImageDimensions>();
const imageErrorCache = new Set<string>();

// 이미지 레이아웃 분석 훅
const useImageAnalysis = (src?: string) => {
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(() =>
    src ? (imageDimensionsCache.get(src) ?? null) : null,
  );
  const [hasError, setHasError] = useState<boolean>(() => (src ? imageErrorCache.has(src) : false));
  const [isLoading, setIsLoading] = useState<boolean>(() =>
    src ? !imageDimensionsCache.has(src) && !imageErrorCache.has(src) : true,
  );

  const analyzeImage = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    const { naturalWidth, naturalHeight } = img;

    if (naturalWidth === 0 || naturalHeight === 0) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    const aspectRatio = naturalWidth / naturalHeight;

    let orientation: 'landscape' | 'portrait' | 'square';
    if (Math.abs(aspectRatio - 1) < 0.1) {
      orientation = 'square';
    } else if (aspectRatio > 1) {
      orientation = 'landscape';
    } else {
      orientation = 'portrait';
    }

    const next: ImageDimensions = {
      width: naturalWidth,
      height: naturalHeight,
      aspectRatio,
      orientation,
    };

    setDimensions(next);

    if (src) {
      imageDimensionsCache.set(src, next);
      imageErrorCache.delete(src);
    }

    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    if (src) {
      imageErrorCache.add(src);
    }
  };

  return {
    dimensions,
    isLoading,
    hasError,
    analyzeImage,
    handleError,
  };
};

// 이미지 다운로드 함수 (실제 작동)
const downloadImage = async (src: string, filename?: string): Promise<void> => {
  try {
    if (isWebView() && isFlowAIApp()) {
      const extension = src.split('.').pop()?.split('?')[0] || 'jpg';
      const finalFilename = filename || `image-${Date.now()}.${extension}`;
      sendFileDownloadBridge(src, finalFilename);
      return;
    }

    const response = await fetch(src, {
      mode: 'cors',
    });

    if (!response.ok) throw new Error('Network response was not ok');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;

    // 파일명 생성
    const extension = src.split('.').pop()?.split('?')[0] || 'jpg';
    const finalFilename = filename || `image-${Date.now()}.${extension}`;
    link.download = finalFilename;

    document.body.appendChild(link);
    link.click();

    // 클린업
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    // Fallback: 새 탭에서 열기
    window.open(src, '_blank');
  }
};

type CopyCallbacks = { onSuccess?: () => void; onError?: () => void };

const handleCopyToClipboard = async (text: string, callbacks?: CopyCallbacks): Promise<void> => {
  const { success } = await copyToClipboard(text);
  if (success) {
    callbacks?.onSuccess ? callbacks.onSuccess() : toast.success('Copied.');
  } else {
    callbacks?.onError ? callbacks.onError() : toast.error('Copy failed.');
  }
};

// 이미지 크기 계산 함수
const getImageContainerStyle = (dimensions: ImageDimensions | null) => {
  if (!dimensions) return {};

  const { width, height, orientation, aspectRatio } = dimensions;

  // 최대 크기 제한
  const maxWidth = 512;
  const maxHeight = 400;

  let containerWidth: number;
  let containerHeight: number;

  if (orientation === 'landscape') {
    // 가로형: 너비를 기준으로 스케일링
    containerWidth = Math.min(width, maxWidth);
    containerHeight = containerWidth / aspectRatio;

    if (containerHeight > maxHeight) {
      containerHeight = maxHeight;
      containerWidth = containerHeight * aspectRatio;
    }
  } else if (orientation === 'portrait') {
    // 세로형: 높이를 기준으로 스케일링
    containerHeight = Math.min(height, maxHeight);
    containerWidth = containerHeight * aspectRatio;

    if (containerWidth > maxWidth) {
      containerWidth = maxWidth;
      containerHeight = containerWidth / aspectRatio;
    }
  } else {
    // 정사각형: 작은 값을 기준으로 스케일링
    const size = Math.min(width, height, maxWidth, maxHeight);
    containerWidth = size;
    containerHeight = size;
  }

  return {
    width: Math.round(containerWidth),
    height: Math.round(containerHeight),
  };
};

// 이미지 툴바 컴포넌트
const ImageToolbar = ({ src }: { src: string }) => {
  const { t } = useAppTranslation('common');
  return (
    <div className='absolute right-2 top-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100'>
      <div className='flex gap-1 rounded-md bg-black/80 p-1 backdrop-blur-sm'>
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size='sm'
                variant='ghost'
                className='h-7 w-7 p-0 text-white hover:bg-white/20'
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(src, '_blank');
                }}
              >
                <Maximize2 className='h-3.5 w-3.5' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t(i18n.common.markdown_image.open_in_new_tab)}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size='sm'
                variant='ghost'
                className='h-7 w-7 p-0 text-white hover:bg-white/20'
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCopyToClipboard(src, {
                    onSuccess: () => toast.success(t(i18n.common.markdown_image.copy_success)),
                    onError: () => toast.error(t(i18n.common.markdown_image.copy_failed)),
                  });
                }}
              >
                <Copy className='h-3.5 w-3.5' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t(i18n.common.markdown_image.copy_url)}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size='sm'
                variant='ghost'
                className='h-7 w-7 p-0 text-white hover:bg-white/20'
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  downloadImage(src);
                }}
              >
                <Download className='h-3.5 w-3.5' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t(i18n.common.markdown_image.download)}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

// 로딩 상태 컴포넌트
const ImageLoadingState = ({ style }: { style?: React.CSSProperties }) => {
  const { t } = useAppTranslation('common');
  return (
    <div
      className='bg-muted/30 relative flex items-center justify-center rounded-lg'
      style={{ width: 300, height: 200, ...style }}
    >
      <Skeleton className='absolute inset-0 rounded-lg' />
      <div className='text-muted-foreground z-10 flex items-center gap-2'>
        <Loader2 className='h-4 w-4 animate-spin' />
        <span className='text-sm'>{t(i18n.common.markdown_image.loading)}</span>
      </div>
    </div>
  );
};

// 에러 상태 컴포넌트
const ImageErrorState = ({ style }: { style?: React.CSSProperties }) => {
  const { t } = useAppTranslation('common');
  return (
    <div
      className='bg-muted/20 border-muted-foreground/30 relative flex items-center justify-center rounded-lg border border-dashed'
      style={{ width: 300, height: 200, ...style }}
    >
      <div className='text-muted-foreground flex flex-col items-center gap-2'>
        <ImageIcon className='h-8 w-8' />
        <p className='text-sm font-medium'>{t(i18n.common.markdown_image.load_error)}</p>
      </div>
    </div>
  );
};

// 이미지 링크 카드 컴포넌트
export const ImageLinkCard = ({
  href,
  src,
  alt,
  title,
  className,
}: {
  href: string;
  src: string;
  alt?: string;
  title?: string;
  className?: string;
}) => {
  const { t } = useAppTranslation('common');
  const { dimensions, isLoading, hasError, analyzeImage, handleError } = useImageAnalysis(src);
  const containerStyle = getImageContainerStyle(dimensions);

  if (hasError) {
    return (
      <div className={cn('my-0', className)}>
        <ImageErrorState style={containerStyle} />
      </div>
    );
  }

  return (
    <div className={cn('not-prose group my-0 inline-block align-top leading-[0]', className)}>
      <a href={href} target='_blank' rel='noopener noreferrer' className='block'>
        <div className='relative overflow-hidden rounded-lg border shadow-sm transition-shadow duration-200 hover:shadow-md'>
          {isLoading && <ImageLoadingState style={containerStyle} />}

          <img
            src={src}
            alt={alt || t(i18n.common.markdown_image.alt_default)}
            className={cn(
              'm-0 block object-cover transition-all duration-200 group-hover:brightness-95',
              isLoading && 'absolute inset-0 opacity-0',
            )}
            style={isLoading ? undefined : containerStyle}
            onLoad={analyzeImage}
            onError={handleError}
          />

          {!isLoading && !hasError && <ImageToolbar src={src} />}
        </div>
      </a>
    </div>
  );
};

// 향상된 이미지 컴포넌트
export const EnhancedImage = ({ src, alt, title, className, ...props }: any) => {
  const { t } = useAppTranslation('common');
  const { dimensions, isLoading, hasError, analyzeImage, handleError } = useImageAnalysis(src);
  const containerStyle = getImageContainerStyle(dimensions);

  if (!src) {
    return null;
  }

  if (hasError) {
    return (
      <div className={cn('my-0', className)}>
        <ImageErrorState style={containerStyle} />
      </div>
    );
  }

  return (
    <div className={cn('not-prose group my-0 inline-block align-top leading-[0]', className)}>
      <div className='relative overflow-hidden rounded-lg border shadow-sm'>
        {isLoading && <ImageLoadingState style={containerStyle} />}

        <img
          src={src}
          alt={alt || t(i18n.common.markdown_image.alt_default)}
          className={cn(
            'm-0 block object-cover transition-all duration-200',
            isLoading && 'absolute inset-0 opacity-0',
          )}
          style={isLoading ? undefined : containerStyle}
          onLoad={analyzeImage}
          onError={handleError}
          {...props}
        />

        {!isLoading && !hasError && <ImageToolbar src={src} />}
      </div>
    </div>
  );
};
