import { cn } from '@/lib/utils';
import { getAssetPath } from '@/lib/utils/asset-utils';
import Image from 'next/image';

export type FileIconType = 'image' | 'pdf' | 'document' | 'spreadsheet' | 'presentation' | 'archive' | 'other';

interface FileIconProps {
  type: FileIconType;
  className?: string;
  size?: number;
}

const iconMap: Record<FileIconType, string> = {
  image: getAssetPath('/assets/svg/image_icon.svg'),
  pdf: getAssetPath('/assets/svg/pdf_icon.svg'),
  document: getAssetPath('/assets/svg/word_icon.svg'),
  spreadsheet: getAssetPath('/assets/svg/excel_icon.svg'),
  presentation: getAssetPath('/assets/svg/ppt_icon.svg'),
  archive: getAssetPath('/assets/svg/file_icon.svg'),
  other: getAssetPath('/assets/svg/file_icon.svg'),
};

export function FileIcon({ type, className, size = 24 }: FileIconProps) {
  return (
    <Image
      src={iconMap[type]}
      alt={`${type} file icon`}
      width={size}
      height={size}
      className={cn('object-contain', className)}
    />
  );
}
