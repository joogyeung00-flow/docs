'use client';

import { useState, useRef } from 'react';
import { Image, X, Loader2 } from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useS3ImageUpload } from '../../../hooks/use-s3-image-upload';
import { useToast } from '../../../hooks/use-toast';
import { i18n } from '@flowai/i18n';

interface S3ImageUploadProps {
  currentImageUrl?: string;
  onImageChange: (imageUrl: string) => void;
  uploadType?: 'profile' | 'general';
  maxFileSize?: number; // MB 단위
  acceptedFileTypes?: string[];
  placeholderText?: string;
  helpText?: string;
}

export function S3ImageUpload({
  currentImageUrl,
  onImageChange,
  uploadType = 'general',
  maxFileSize = 5,
  acceptedFileTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
}: S3ImageUploadProps) {
  const { t } = useAppTranslation('common');
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, isUploading } = useS3ImageUpload();
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    // 파일 유효성 검사
    const isValidType = acceptedFileTypes.some((type) => {
      if (type === 'image/*') return file.type.startsWith('image/');
      return file.type === type;
    });

    if (!isValidType) {
      toast({
        title: t(i18n.common.s3_upload.toast_error_title),
        description: t(i18n.common.s3_upload.file_type_error),
        variant: 'destructive',
      });
      return;
    }

    if (file.size > maxFileSize * 1024 * 1024) {
      toast({
        title: t(i18n.common.s3_upload.toast_error_title),
        description: t(i18n.common.s3_upload.file_size_error, { max: String(maxFileSize) }),
        variant: 'destructive',
      });
      return;
    }

    try {
      // 미리보기 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // S3 업로드
      const uploadedUrl = await uploadImage(file, uploadType);
      onImageChange(uploadedUrl);

      toast({
        title: t(i18n.common.s3_upload.toast_success_title),
        description: t(i18n.common.s3_upload.success),
      });
    } catch (error) {
      toast({
        title: t(i18n.common.s3_upload.toast_error_title),
        description: t(i18n.common.s3_upload.failed),
        variant: 'destructive',
      });
      // 업로드 실패 시 미리보기 제거
      setPreviewUrl(currentImageUrl || null);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`flex items-center`}>
      {/* 프로필 이미지 컨테이너 */}
      <div className='relative'>
        <button
          type='button'
          onClick={handleClickUpload}
          disabled={isUploading}
          className={`relative flex ${previewUrl ? 'h-[60px] w-[60px]' : 'h-[60px] w-[60px] p-3'} items-center justify-center overflow-hidden rounded-full border-2 ${isUploading ? 'border-slate-500' : 'border-[#E2E8F0]'} bg-white transition-colors hover:bg-slate-200 disabled:bg-slate-300`}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={t(i18n.common.s3_upload.alt_profile)}
              width={'60px'}
              height={'60px'}
              className={`h-15 w-15 object-cover transition-opacity ${isUploading ? 'opacity-50' : 'opacity-100'}`}
            />
          ) : (
            <div className='flex h-[60px] w-[60px] items-center justify-center'>
              <Image className='text-slate-400' />
            </div>
          )}

          {/* 업로드 중 스피너 */}
          {isUploading && (
            <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-50'>
              <Loader2 className='h-8 w-8 animate-spin text-[#5B40F8]' />
            </div>
          )}
        </button>

        {/* 제거 버튼 */}
        {previewUrl && !isUploading && (
          <button
            type='button'
            onClick={handleRemoveImage}
            disabled={isUploading}
            className='absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-950 transition-colors hover:bg-slate-800 disabled:bg-slate-400'
          >
            <X className='h-3 w-3 text-white' />
          </button>
        )}
      </div>

      {/* 파일 입력 */}
      <input ref={fileInputRef} type='file' accept='image/*' onChange={handleFileInputChange} className='hidden' />
    </div>
  );
}
