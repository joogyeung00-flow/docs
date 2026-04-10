---
작성자: agent-designer
작성일: 2026-04-08
버전: 1.0.0
상태: draft
feature: DS-TEXTAREA
---

# Textarea 컴포넌트 스펙

## 개요

멀티라인 텍스트 입력 컴포넌트. Figma `textarea` component_set 기반.
구현 파일: shadcn/ui `Textarea` 기반, `apps/front/src/components/ui/textarea.tsx`

---

## 기본 스펙

| 속성           | 값                                       |
|---------------|------------------------------------------|
| min-height     | 80px (기본 3줄)                           |
| padding        | 12px                                     |
| font-size      | 14px (`sm`)                              |
| line-height    | 24px                                     |
| border-radius  | 6px (`md`)                               |
| border         | 1px solid `theme.input` (#E2E8F0)        |
| background     | `theme.background` (#FFFFFF)             |
| resize         | vertical (기본) / none (채팅 입력창)      |

---

## States

| 상태      | border 색상                         | 기타                             |
|---------|------------------------------------|---------------------------------|
| Default  | `theme.input` (#E2E8F0)            | —                               |
| Hover    | `gray.400` (#94A3B8)               | `transition: border-color 150ms ease-out` |
| Focus    | `theme.ring` (#64748B), ring 2px   | `outline: none`                 |
| Disabled | `theme.input`                      | `opacity: 0.5`, `cursor: not-allowed`, `resize: none` |
| Error    | `semantic.danger.border` (#FECACA) | 하단 에러 메시지 표시            |

---

## Variants

### 기본 Textarea
일반 폼 입력용. resize 가능.

```tsx
<Textarea
  placeholder="내용을 입력하세요"
  className="min-h-[80px]"
/>
```

### 채팅 입력창 (Auto-resize)
Flow AI 채팅 인터페이스용. 내용에 따라 높이 자동 조절.

| 속성        | 값                          |
|-----------|----------------------------|
| min-height | 44px (1줄)                  |
| max-height | 200px (약 8줄, 이후 스크롤) |
| resize     | none                        |
| border     | 없음 (컨테이너가 border 담당)|

```tsx
<Textarea
  className="resize-none min-h-[44px] max-h-[200px] overflow-y-auto border-0 focus-visible:ring-0"
  rows={1}
  onInput={(e) => {
    e.currentTarget.style.height = 'auto';
    e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
  }}
/>
```

### 글자 수 카운터
| 속성            | 값                                          |
|---------------|---------------------------------------------|
| 위치            | 우측 하단                                   |
| font-size      | 12px (`xs`)                                 |
| 색상 (정상)     | `muted-foreground` (#64748B)               |
| 색상 (초과 임박)| `semantic.warning.text` (#A16207) — 90% 이상|
| 색상 (초과)     | `semantic.danger.text` (#B91C1C)            |
