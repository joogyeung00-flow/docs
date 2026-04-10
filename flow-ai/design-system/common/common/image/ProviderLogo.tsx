'use client';

import { getProviderLogo } from '@/lib/utils/model-display-utils';
import Image from 'next/image';

interface ProviderLogoProps {
  provider: string;
  width?: number;
  height?: number;
  className?: string;
  alt?: string;
}

/**
 * 프로바이더 로고를 표시합니다.
 * 항상 제공사(OpenAI, Google, Anthropic 등)의 로고만 표시합니다.
 *
 * 모델 전용 아이콘이 필요한 경우 ModelIcon 컴포넌트를 사용하세요.
 */
export function ProviderLogo({
  provider,
  width = 20,
  height = 20,
  className = 'h-5 w-5 object-contain',
  alt,
}: ProviderLogoProps) {
  const logo = getProviderLogo(provider);
  if (!logo) return null;

  return <Image src={logo} alt={alt || `${provider} logo`} width={width} height={height} className={className} />;
}
