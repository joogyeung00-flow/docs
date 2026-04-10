/**
 * @file utils/index.ts
 * @description Markdown 유틸리티 통합 export
 */

export {
  escapeHtml,
  slugify,
  isCompleteUrl,
  isCompleteLinkText,
  parseAttributes,
  parseBalancedLink,
  truncateTitle,
  extractTextFromChildren,
  normalizeChildrenToString,
  type BalancedLinkResult,
} from './common';
export * from './markdown-styles';
export { unifiedPreprocess } from './unified-preprocessor';
export { FS_TYPE_LABELS } from './reference-labels';
export { FILE_EXTENSION_LABELS, getFileExtensionLabel } from '@flowai/shared';
