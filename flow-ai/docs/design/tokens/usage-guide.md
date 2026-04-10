---
작성자: agent-designer
작성일: 2026-04-08
버전: 1.0.0
상태: active
---

# 디자인 토큰 사용 가이드

## 토큰 파일 구조

```
design-system/design-tokens/
├── colors.json      # 색상 (brand, gray, theme, semantic, project, chart)
├── typography.json  # 폰트, 텍스트 스타일, 폰트 사이즈
├── spacing.json     # 간격, border-radius, 컴포넌트 기본값
├── shadows.json     # 그림자
├── icons.json       # 아이콘 설정 (lucide-react 기반)
├── motion.json      # 애니메이션, transition, easing ← NEW
├── z-index.json     # 레이어링 스케일 ← NEW
└── border.json      # border width, opacity, breakpoints ← NEW
```

Tailwind 연결: `design-system/tailwind.config.ts`

---

## 색상 사용 방법

### Tailwind 클래스로 사용

```tsx
// 브랜드 색상
<div className="bg-brand-500 text-white" />        // 주요 액션

// Semantic 색상
<div className="bg-semantic-success-bg text-semantic-success-text" />

// 회색
<p className="text-gray-500" />
```

### CSS 변수로 사용 (shadcn/ui 방식)

```css
/* globals.css */
:root {
  --primary: 251 40 248;        /* brand.500 HSL */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --border: 214.3 31.8% 91.4%;
  --ring: 215 20.2% 65.1%;
}
```

---

## Z-index 사용 방법

```tsx
// Tailwind 클래스
<div className="z-modal" />     // z-index: 40
<div className="z-tooltip" />   // z-index: 70
<div className="z-dropdown" />  // z-index: 10
```

레이어 충돌 시 반드시 `z-index.json` 값만 사용하세요.

---

## Motion 사용 방법

```tsx
// Tailwind animation 클래스
<div className="animate-fade-in" />
<div className="animate-slide-up" />
<div className="animate-scale-in" />

// Tailwind transition 클래스
<button className="transition-colors duration-normal ease-out" />
//                                 ↑ 150ms             ↑ cubic-bezier(0,0,0.2,1)
```

### 컴포넌트별 권장 설정

| 컴포넌트    | duration   | easing      |
|-----------|-----------|-------------|
| 버튼 호버   | `fast` (100ms) | `ease-out` |
| 모달 열기  | `normal` (150ms) | `spring` |
| 모달 닫기  | `fast` (100ms) | `ease-in` |
| 드롭다운   | `normal` (150ms) | `ease-out` |
| 사이드바   | `slow` (250ms) | `ease-in-out` |
| 토스트     | `normal` (150ms) | `spring` |

---

## Breakpoint 사용 방법

```tsx
// Tailwind 반응형 prefix
<div className="hidden md:block" />          // 768px 이상에서 표시
<div className="w-full lg:w-[320px]" />      // 1024px 이상에서 고정폭
<div className="flex-col sm:flex-row" />     // 640px 이상에서 가로 정렬
```

| prefix | 최소 너비 |
|--------|---------|
| `xs:`  | 480px   |
| `sm:`  | 640px   |
| `md:`  | 768px   |
| `lg:`  | 1024px  |
| `xl:`  | 1280px  |
| `2xl:` | 1536px  |

---

## Opacity 사용 방법

```tsx
<button disabled className="opacity-40 cursor-not-allowed" />  // disabled
<p className="opacity-70" />                                    // muted text
<div className="bg-black/50" />                                 // overlay dim
```
