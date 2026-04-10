'use client';

import { getModelLogo, getModelSpecificIcon, getProviderLogo } from '@/lib/utils/model-display-utils';
import Image from 'next/image';

interface ModelLogoProps {
  modelId?: string;
  provider?: string;
  width?: number;
  height?: number;
  className?: string;
  alt?: string;
}

/**
 * 모델 로고를 표시합니다.
 * - Google 이미지 모델: 바나나 이모지 🍌
 * - Gemini 모델: Gemini 전용 로고
 * - Claude 모델: Claude 전용 로고
 * - GPT 계열 등 기타 모델: 프로바이더 로고 (OpenAI 로고 등)
 */
export function ModelLogo({
  modelId,
  provider,
  width = 20,
  height = 20,
  className = 'h-5 w-5 object-contain',
  alt,
}: ModelLogoProps) {
  if (!modelId) return null;

  // 1순위: 이모지 아이콘 (Google 이미지 모델 바나나)
  const emojiIcon = getModelSpecificIcon(modelId);
  if (emojiIcon) {
    return (
      <span
        className={`inline-flex items-center justify-center ${className}`}
        style={{ fontSize: width, lineHeight: 1 }}
      >
        {emojiIcon}
      </span>
    );
  }

  // 2순위: 모델 전용 로고 (Gemini, Claude)
  const modelLogo = getModelLogo(modelId);
  if (modelLogo) {
    return <Image src={modelLogo} alt={alt || `${modelId} logo`} width={width} height={height} className={className} />;
  }

  // 3순위: 프로바이더 로고 (GPT 계열 등)
  const providerLogo = provider ? getProviderLogo(provider) : null;
  if (providerLogo) {
    return (
      <Image src={providerLogo} alt={alt || `${provider} logo`} width={width} height={height} className={className} />
    );
  }

  return null;
}
