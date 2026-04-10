---
작성자: agent-designer
작성일: 2026-04-08
버전: 1.0.0
상태: draft
feature: DS-TOAST
---

# Toast (Sonner) 컴포넌트 스펙

## 개요

시스템 피드백 알림 컴포넌트 스펙입니다.
라이브러리: `sonner`
구현 파일: [sonner-toaster.tsx](../../../design-system/common/common/sonner-toaster.tsx)

---

## 위치 및 레이어

| 속성      | 값                   |
|---------|---------------------|
| 위치     | 우측 하단 (기본)      |
| z-index  | `toast` (60)         |
| gap      | 8px (토스트 간격)    |

---

## 공통 스펙

| 속성           | 값                         |
|---------------|---------------------------|
| padding        | 16px                      |
| gap (내부)     | 12px                      |
| border-radius  | 6px (`md`)                |
| min-width      | 320px                     |
| max-width      | 480px                     |
| box-shadow     | `lg`                      |
| animation (진입)| `slide-up 250ms spring`  |
| animation (퇴장)| `fade-out 100ms ease-in` |
| 자동 닫힘     | 4000ms (기본)              |

---

## Variants

| 타입      | 배경                                  | 텍스트                             | 아이콘                              |
|---------|--------------------------------------|-----------------------------------|-------------------------------------|
| Default  | `gray.800` (#1E293B)                 | `gray.white`                      | -                                   |
| Success  | `semantic.success.bg` (#F0FDF4)      | `semantic.success.text` (#15803D) | `check-circle` (success.icon)       |
| Error    | `semantic.danger.bg` (#FEF2F2)       | `semantic.danger.text` (#B91C1C)  | `x-circle` (danger.icon)            |
| Warning  | `semantic.warning.bg` (#FFFBEB)      | `semantic.warning.text` (#A16207) | `alert-triangle` (warning.icon)     |
| Info     | `semantic.info.bg` (#EFF6FF)         | `semantic.info.text` (#1D4ED8)    | `info` (info.icon)                  |
| Loading  | `gray.800`                           | `gray.white`                      | `loader` (animate-spin)             |

---

## 구조

```
┌──────────────────────────────────────┐
│  [아이콘]  제목 (sm-medium)          │
│            설명 (xs-regular, 선택)   │
│                          [액션 버튼] │
└──────────────────────────────────────┘
```

- 제목: `text-sm font-medium`
- 설명: `text-xs opacity-90`
- 닫기 버튼: 우측 상단, `X` 아이콘 12px
