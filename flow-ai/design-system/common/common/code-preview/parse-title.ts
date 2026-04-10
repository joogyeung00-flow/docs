/**
 * 코드에서 제목을 파싱합니다.
 * title > h1 > h2 > h3 > h4 순서로 추출합니다.
 */
export function parseTitleFromCode(code: string): string {
  // <title>...</title>
  const titleMatch = code.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) return titleMatch[1].trim();

  // <h1> ~ <h4> 순서로 탐색
  for (const level of [1, 2, 3, 4]) {
    const hMatch = code.match(new RegExp(`<h${level}[^>]*>([^<]+)<\\/h${level}>`, 'i'));
    if (hMatch) return hMatch[1].trim();
  }

  // JSX 내부 텍스트도 탐색 (예: <h1 className="...">제목</h1>)
  for (const level of [1, 2, 3, 4]) {
    const jsxMatch = code.match(new RegExp(`<h${level}[^>]*>\\s*(?:\\{[^}]*\\}\\s*)?([^<{]+)`, 'i'));
    if (jsxMatch) {
      const text = jsxMatch[1].trim();
      if (text) return text;
    }
  }

  return '미니앱';
}
