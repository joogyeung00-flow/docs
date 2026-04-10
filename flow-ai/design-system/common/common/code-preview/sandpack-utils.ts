/**
 * Sandpack 코드 래핑 유틸리티
 *
 * LLM이 생성한 코드를 Sandpack에서 실행 가능한 형태로 변환합니다.
 */

/**
 * React 코드를 export default가 있는 형태로 래핑
 * Sandpack React 템플릿은 App.jsx/tsx를 import하여 렌더링하므로 export default 필수
 *
 * 주의: Sandpack의 index.js는 `import App from './App'`를 하므로,
 * 사용자 코드의 default export가 어떤 이름이든 App으로 import됨.
 * 따라서 `export default Calculator` 같은 코드도 정상 동작함.
 *
 * 단, `export default ComponentName` 형태가 파일 끝에 별도로 있는 경우
 * 해당 컴포넌트가 export 되도록 보장해야 함.
 */
export function wrapReactCode(code: string): string {
  // 이미 export default가 있으면 그대로 반환
  if (/export\s+default/.test(code)) {
    return code;
  }

  // PascalCase 컴포넌트 이름 찾기 (function, const, class)
  const componentMatch = code.match(/(?:function|const|class)\s+([A-Z][a-zA-Z0-9]*)/);
  if (componentMatch) {
    return code + `\nexport default ${componentMatch[1]};`;
  }

  // 컴포넌트를 찾지 못하면 코드 전체를 App 컴포넌트로 래핑
  // JSX가 있는지 확인
  if (/<[A-Z]/.test(code) || /<[a-z]+/.test(code)) {
    return `export default function App() {\n  return (\n    <>${code}</>\n  );\n}`;
  }

  // JSX도 없으면 그냥 반환 (실행 시 에러가 발생할 수 있음)
  return code;
}

/**
 * HTML 코드 래핑 (기본 DOCTYPE 추가)
 */
export function wrapHtmlCode(code: string): string {
  // 이미 <!DOCTYPE 또는 <html이 있으면 그대로
  if (/<!DOCTYPE|<html/i.test(code)) {
    return code;
  }

  // body 태그가 있으면 html로 래핑
  if (/<body/i.test(code)) {
    return `<!DOCTYPE html>\n<html>\n${code}\n</html>`;
  }

  // 그 외는 기본 HTML 구조로 래핑
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 1rem; }
  </style>
</head>
<body>
${code}
</body>
</html>`;
}

/**
 * JavaScript/TypeScript 코드 래핑 (console.log 출력을 화면에 표시)
 */
export function wrapJsCode(code: string): string {
  return `// Console output will be displayed in the preview
const output = document.getElementById('app');
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

function formatValue(val) {
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val, null, 2);
    } catch {
      return String(val);
    }
  }
  return String(val);
}

function appendOutput(type, args) {
  const line = document.createElement('div');
  line.style.fontFamily = 'monospace';
  line.style.whiteSpace = 'pre-wrap';
  line.style.marginBottom = '4px';
  line.style.padding = '4px 8px';
  line.style.borderRadius = '4px';

  if (type === 'error') {
    line.style.backgroundColor = '#fee2e2';
    line.style.color = '#dc2626';
  } else if (type === 'warn') {
    line.style.backgroundColor = '#fef3c7';
    line.style.color = '#d97706';
  } else {
    line.style.backgroundColor = '#f3f4f6';
    line.style.color = '#374151';
  }

  line.textContent = args.map(formatValue).join(' ');
  output.appendChild(line);
}

console.log = (...args) => {
  appendOutput('log', args);
  originalLog(...args);
};

console.error = (...args) => {
  appendOutput('error', args);
  originalError(...args);
};

console.warn = (...args) => {
  appendOutput('warn', args);
  originalWarn(...args);
};

// User code starts here
${code}
`;
}

/**
 * Vanilla 템플릿용 기본 HTML
 */
export function getVanillaHtml(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      padding: 1rem;
      margin: 0;
    }
    #app {
      max-height: 100vh;
      overflow-y: auto;
    }
  </style>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="./index.js"></script>
</body>
</html>`;
}

/**
 * Svelte 코드에서 TypeScript를 JavaScript로 변환
 *
 * Sandpack의 svelte 템플릿은 TypeScript를 지원하지 않습니다.
 * <script lang="ts">를 <script>로 변환하고, 타입 어노테이션을 제거합니다.
 *
 * 변환 대상:
 * 1. <script lang="ts"> → <script>
 * 2. 변수 타입 어노테이션: let x: string = "a" → let x = "a"
 * 3. 함수 파라미터 타입: function(a: string) → function(a)
 * 4. 함수 반환 타입: function(): string { → function() {
 * 5. 제네릭 타입: Array<string> → Array (복잡한 케이스는 유지)
 * 6. as 타입 단언: value as string → value
 * 7. 타입 import: import type { X } from ... → 제거
 */
export function wrapSvelteCode(code: string): string {
  // TypeScript가 아니면 그대로 반환
  if (!/<script[^>]*\slang=["']ts["'][^>]*>/.test(code)) {
    return code;
  }

  let result = code;

  // 1. <script lang="ts"> → <script>
  result = result.replace(/<script(\s+[^>]*)?\s+lang=["']ts["']([^>]*)>/g, '<script$1$2>');

  // 2. 타입 import 제거: import type { X } from 'y';
  result = result.replace(/^\s*import\s+type\s+\{[^}]*\}\s+from\s+['"][^'"]*['"];?\s*$/gm, '');

  // 3. 인라인 타입 import에서 type 키워드 제거: import { type X, Y } → import { Y }
  result = result.replace(/import\s*\{([^}]*)\}/g, (match, imports) => {
    const cleanedImports = imports
      .split(',')
      .map((imp: string) => imp.trim())
      .filter((imp: string) => !imp.startsWith('type '))
      .join(', ');
    return cleanedImports ? `import { ${cleanedImports} }` : '';
  });

  // 4. 변수 선언의 타입 어노테이션 제거
  // let x: string = "a" → let x = "a"
  // let x: string | null = null → let x = null
  // const x: Type = value → const x = value
  result = result.replace(/\b(let|const|var)\s+(\w+)\s*:\s*[^=;]+\s*=/g, '$1 $2 =');

  // 5. 타입만 있는 변수 선언 (초기값 없음)
  // let operator: string | null; → let operator;
  result = result.replace(/\b(let|const|var)\s+(\w+)\s*:\s*[^=;]+;/g, '$1 $2;');

  // 6. 함수 파라미터 타입 제거
  // function(a: string, b: number) → function(a, b)
  // (a: string) => → (a) =>
  result = result.replace(/\(([^)]*)\)/g, (match, params) => {
    if (!params.includes(':')) return match;

    const cleanedParams = params
      .split(',')
      .map((param: string) => {
        // 기본값이 있는 경우: a: string = "default" → a = "default"
        const defaultMatch = param.match(/^\s*(\w+)\s*:\s*[^=]+\s*(=.*)$/);
        if (defaultMatch) {
          return `${defaultMatch[1]} ${defaultMatch[2]}`;
        }
        // 기본값이 없는 경우: a: string → a
        return param.replace(/\s*:\s*[^,)=]+/, '');
      })
      .join(',');

    return `(${cleanedParams})`;
  });

  // 7. 함수 반환 타입 제거
  // function name(): string { → function name() {
  // (): string => { → () => {
  result = result.replace(/\)\s*:\s*[^{=>]+\s*(?=[{=>])/g, ') ');

  // 8. as 타입 단언 제거
  // value as string → value
  // (value as Type) → (value)
  result = result.replace(/\s+as\s+\w+(\[\])?/g, '');

  // 9. 제네릭 타입 파라미터 단순화 (복잡한 경우는 유지)
  // Array<string> → Array
  // Map<string, number> → Map
  result = result.replace(/\b(Array|Map|Set|Promise|Record)\s*<[^>]+>/g, '$1');

  // 10. 빈 import 문 제거
  result = result.replace(/^\s*import\s*\{\s*\}\s*from\s*['"][^'"]*['"];?\s*$/gm, '');

  // 11. 연속된 빈 줄 정리
  result = result.replace(/\n{3,}/g, '\n\n');

  return result;
}
