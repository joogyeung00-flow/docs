---
작성자: agent-designer
작성일: 2026-04-08
버전: 1.0.0
상태: draft
feature: DS-INPUT
---

# Input 컴포넌트 스펙

## 개요

텍스트 입력 필드의 시각 스펙 및 상태 정의입니다.
구현 파일: shadcn/ui `Input` 기반, `apps/front/src/components/ui/input.tsx`

---

## 기본 스펙

| 속성            | 값                        |
|----------------|--------------------------|
| height          | 40px (`md`), 32px (`sm`) |
| padding-x       | 12px                     |
| padding-y       | 8px                      |
| font-size       | 14px (`sm`)              |
| border-radius   | 6px (`md`)               |
| border          | 1px solid `theme.input` (#E2E8F0) |
| background      | `theme.background` (#FFFFFF) |
| color           | `theme.foreground` (#020617) |

---

## States

| 상태        | border 색상                        | 기타                           |
|------------|-----------------------------------|-------------------------------|
| Default    | `theme.input` (#E2E8F0)           | -                             |
| Hover      | `gray.400` (#94A3B8)              | `transition: border-color 150ms ease-out` |
| Focus      | `theme.ring` (#64748B), ring 2px  | `outline: none`               |
| Disabled   | `theme.input`                     | `opacity: 0.5`, `cursor: not-allowed` |
| Error      | `semantic.danger.border` (#FECACA)| 하단에 에러 메시지 표시         |
| Success    | `semantic.success.border` (#BBF7D0)| -                            |

---

## 구성 요소

### LabeledInput (확장 컴포넌트)
파일: [design-system/common/common/ui/LabeledInput.tsx](../../../design-system/common/common/ui/LabeledInput.tsx)

```tsx
interface LabeledInputProps {
  label: string;        // 라벨 텍스트
  error?: string;       // 에러 메시지
  hint?: string;        // 도움말 텍스트
  required?: boolean;   // 필수 여부
}
```

**라벨**: `text-sm font-medium text-foreground`, `mb-2`
**에러 메시지**: `text-xs text-semantic-danger-text`, `mt-1`
**힌트**: `text-xs text-muted-foreground`, `mt-1`

---

## 아이콘 + Input 조합

```tsx
// 왼쪽 아이콘
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
  <Input className="pl-9" placeholder="검색..." />
</div>
```

아이콘 크기: `w-4 h-4` (16px)
아이콘 색상: `text-muted-foreground` (#64748B)
