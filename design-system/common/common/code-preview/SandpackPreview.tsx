'use client';

import { memo, useMemo } from 'react';
import {
  SandpackProvider,
  SandpackPreview as SandpackPreviewPane,
  SandpackLayout,
  type SandpackPredefinedTemplate,
} from '@codesandbox/sandpack-react';
import { dracula, githubLight } from '@codesandbox/sandpack-themes';
import { isReactCode } from './utils';
import { wrapReactCode, wrapHtmlCode, wrapJsCode, wrapSvelteCode, getVanillaHtml } from './sandpack-utils';

interface SandpackPreviewProps {
  code: string;
  language: string;
  isDark?: boolean;
}

interface SandpackConfig {
  template: SandpackPredefinedTemplate;
  files: Record<string, string>;
  entry: string;
  customSetup?: {
    dependencies?: Record<string, string>;
  };
}

type ConfigBuilder = (code: string) => SandpackConfig;

/**
 * 언어별 Sandpack 설정 빌더 맵
 */
const LANGUAGE_CONFIG_MAP: Record<string, ConfigBuilder> = {
  // React (JSX)
  jsx: (code) => ({
    template: 'react',
    files: { '/App.js': wrapReactCode(code) },
    entry: '/App.js',
  }),
  react: (code) => ({
    template: 'react',
    files: { '/App.js': wrapReactCode(code) },
    entry: '/App.js',
  }),

  // React (TSX)
  tsx: (code) => ({
    template: 'react-ts',
    files: { '/App.tsx': wrapReactCode(code) },
    entry: '/App.tsx',
  }),

  // HTML
  html: (code) => ({
    template: 'static',
    files: { '/index.html': wrapHtmlCode(code) },
    entry: '/index.html',
  }),

  // JavaScript
  javascript: (code) => ({
    template: 'vanilla',
    files: {
      '/index.js': wrapJsCode(code),
      '/index.html': getVanillaHtml(),
    },
    entry: '/index.js',
  }),
  js: (code) => ({
    template: 'vanilla',
    files: {
      '/index.js': wrapJsCode(code),
      '/index.html': getVanillaHtml(),
    },
    entry: '/index.js',
  }),

  // TypeScript
  typescript: (code) => ({
    template: 'vanilla-ts',
    files: {
      '/index.ts': wrapJsCode(code),
      '/index.html': getVanillaHtml(),
    },
    entry: '/index.ts',
  }),
  ts: (code) => ({
    template: 'vanilla-ts',
    files: {
      '/index.ts': wrapJsCode(code),
      '/index.html': getVanillaHtml(),
    },
    entry: '/index.ts',
  }),

  // Vue (TypeScript 감지하여 vue-ts 템플릿 사용)
  vue: (code) => {
    // <script lang="ts"> 또는 <script setup lang="ts"> 패턴 감지
    const isTypeScript = /<script[^>]*\slang=["']ts["'][^>]*>/.test(code);
    return {
      template: isTypeScript ? 'vue-ts' : 'vue',
      files: { '/src/App.vue': code },
      entry: '/src/App.vue',
    };
  },

  // Svelte (TypeScript → JavaScript 변환 필요)
  // Sandpack의 Svelte 템플릿은 반응성 버그가 있어 Svelte 3.55.0 명시 필요
  // https://github.com/codesandbox/sandpack/issues/246
  svelte: (code) => ({
    template: 'svelte',
    files: { '/App.svelte': wrapSvelteCode(code) },
    entry: '/App.svelte',
    customSetup: {
      dependencies: {
        svelte: '^3.55.0',
      },
    },
  }),
};

/**
 * 기본 config (vanilla JavaScript)
 */
const getDefaultConfig = (code: string): SandpackConfig => ({
  template: 'vanilla',
  files: {
    '/index.js': wrapJsCode(code),
    '/index.html': getVanillaHtml(),
  },
  entry: '/index.js',
});

/**
 * 언어와 코드에 따른 Sandpack 설정 반환
 */
function getSandpackConfig(language: string, code: string): SandpackConfig {
  const lang = language.toLowerCase();

  // 언어가 맵에 있으면 해당 빌더 사용
  const builder = LANGUAGE_CONFIG_MAP[lang];
  if (builder) {
    return builder(code);
  }

  // 언어 명시 없이 React 코드 패턴 감지
  if (isReactCode(code)) {
    return LANGUAGE_CONFIG_MAP.jsx(code);
  }

  // 기본: vanilla
  return getDefaultConfig(code);
}

export const SandpackPreview = memo(function SandpackPreview({ code, language, isDark = true }: SandpackPreviewProps) {
  const config = useMemo(() => getSandpackConfig(language, code), [code, language]);

  return (
    <div className='sandpack-full-height h-full w-full'>
      <SandpackProvider
        template={config.template}
        files={config.files}
        theme={isDark ? dracula : githubLight}
        customSetup={config.customSetup}
        options={{
          activeFile: config.entry,
          recompileMode: 'delayed',
          recompileDelay: 500,
        }}
      >
        <SandpackLayout
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            border: 'none',
            borderRadius: 0,
          }}
        >
          <SandpackPreviewPane
            showOpenInCodeSandbox={false}
            showRefreshButton={false}
            style={{
              height: '100%',
              flex: 1,
              minHeight: 0,
            }}
          />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
});
