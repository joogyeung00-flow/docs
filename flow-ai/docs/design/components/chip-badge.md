---
작성자: agent-designer
작성일: 2026-04-08
버전: 1.0.0
상태: draft
feature: DS-CHIP
---

# Chip / Badge 컴포넌트 스펙

## 개요

상태, 카테고리, 속성 표현에 사용되는 칩/배지 컴포넌트 스펙입니다.
관련 파일:
- [PriorityChip.tsx](../../../design-system/common/common/PriorityChip.tsx)
- [InfoChip.tsx](../../../design-system/common/common/ui/InfoChip.tsx)
- [FieldChip.tsx](../../../design-system/common/common/ui/FieldChip.tsx)
- [LimitedAccessChip.tsx](../../../design-system/common/common/ui/LimitedAccessChip.tsx)
- [RecommendBadge.tsx](../../../design-system/common/common/ui/RecommendBadge.tsx)

---

## 공통 스펙

| 속성           | 값                    |
|---------------|-----------------------|
| padding-x     | 8px                   |
| padding-y     | 4px                   |
| border-radius | `full` (9999px)       |
| font-size     | 12px (`xs`)           |
| font-weight   | 500 (medium)          |
| gap           | 4px (아이콘 + 텍스트) |

---

## Semantic Variants

| 타입      | 배경                            | 텍스트                          | 테두리                             |
|---------|--------------------------------|--------------------------------|-----------------------------------|
| Success  | `semantic.success.bg` (#F0FDF4)| `semantic.success.text` (#15803D)| `semantic.success.border` (#BBF7D0) |
| Danger   | `semantic.danger.bg` (#FEF2F2) | `semantic.danger.text` (#B91C1C) | `semantic.danger.border` (#FECACA)  |
| Warning  | `semantic.warning.bg` (#FFFBEB)| `semantic.warning.text` (#A16207)| `semantic.warning.border` (#FDE68A) |
| Info     | `semantic.info.bg` (#EFF6FF)   | `semantic.info.text` (#1D4ED8)   | `semantic.info.border` (#BFDBFE)    |
| Neutral  | `semantic.neutral.bg` (#F3F4F6)| `semantic.neutral.text` (#475569)| `semantic.neutral.border` (#B9C1CA) |
| Brand    | `brand.50` (#F3F1FF)           | `brand.600` (#4C34D1)            | `brand.200` (#D6D0FF)               |

---

## Priority Chip (우선순위)

| 우선순위  | 색상              | 아이콘      |
|---------|-------------------|------------|
| 높음     | `semantic.danger` | `arrow-up` |
| 중간     | `semantic.warning`| `minus`    |
| 낮음     | `semantic.info`   | `arrow-down`|
| 없음     | `semantic.neutral`| -          |

---

## States

- **Default**: 위 테이블 기준
- **Removable**: 오른쪽에 `X` 아이콘 (12px), 클릭 시 삭제
- **Disabled**: `opacity: 0.4`
