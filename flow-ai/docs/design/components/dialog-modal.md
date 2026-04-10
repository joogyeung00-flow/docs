---
작성자: agent-designer
작성일: 2026-04-08
버전: 1.0.0
상태: draft
feature: DS-DIALOG
---

# Dialog / Modal 컴포넌트 스펙

## 개요

팝업 대화창의 시각 스펙입니다.
관련 파일:
- [SimpleDialog.tsx](../../../design-system/common/common/ui/SimpleDialog.tsx)
- [FormDialog.tsx](../../../design-system/common/common/ui/FormDialog.tsx)
- [CompletionDialog.tsx](../../../design-system/common/common/ui/CompletionDialog.tsx)
- [FlexibleDialog/](../../../design-system/common/common/ui/FlexibleDialog/)
- [StatDetailModal.tsx](../../../design-system/common/common/ui/StatDetailModal.tsx)
- [SmartEditorModal.tsx](../../../design-system/common/common/ui/SmartEditorModal.tsx)
- [admin-usage-limit-dialog.tsx](../../../design-system/common/common/admin-usage-limit-dialog.tsx)

---

## 레이어링

| 레이어       | z-index    |
|-------------|-----------|
| Overlay(Dim) | `overlay` (30) |
| Modal 본체   | `modal` (40)   |

---

## 오버레이 (Dim)

| 속성       | 값                             |
|-----------|-------------------------------|
| background | `rgba(0, 0, 0, 0.5)` (50%)   |
| position   | fixed, inset-0                |
| animation  | `fade-in 150ms ease-out`      |

---

## Modal 본체

| 속성           | 값                           |
|---------------|------------------------------|
| background     | `theme.background` (#FFFFFF) |
| border-radius  | 12px (`2xl`)                 |
| padding        | 32px                         |
| gap (내부)     | 24px                         |
| max-width       | `sm`: 448px / `md`: 560px / `lg`: 720px / `xl`: 960px |
| box-shadow     | `2xl`                        |
| animation      | `scale-in 150ms spring`      |

---

## 구조

```
┌─ Header ─────────────────────────────────┐
│  제목 (h4: 20px/500)    [X 닫기 버튼]   │
├──────────────────────────────────────────┤
│  Description (sm-regular: 14px/400)      │
│  text-muted-foreground                   │
├──────────────────────────────────────────┤
│  Content (자유 영역)                     │
├──────────────────────────────────────────┤
│  Footer                [취소] [확인]    │
└──────────────────────────────────────────┘
```

### Header
- 제목: `text-xl font-medium` (h4)
- 설명: `text-sm text-muted-foreground`, `mt-1`
- 닫기 버튼: `size="icon"` variant `ghost`, 오른쪽 상단

### Footer
- 버튼 정렬: 우측 정렬 (`flex justify-end gap-2`)
- 취소: `variant="outline"`
- 확인/제출: `variant="default"`
- 파괴적 액션: `variant="destructive"`

---

## BottomSheet (모바일)

파일: [FlowBottomSheet.tsx](../../../design-system/common/common/ui/FlowBottomSheet.tsx)

| 속성           | 값                           |
|---------------|------------------------------|
| position       | fixed, bottom-0, left-0, right-0 |
| border-radius  | 상단 16px만 적용 (`2xl`)      |
| padding        | 24px                         |
| animation      | `slide-up 250ms spring`      |
| drag handle    | 상단 중앙, `w-10 h-1 rounded-full bg-gray-300` |
