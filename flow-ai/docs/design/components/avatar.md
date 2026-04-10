---
작성자: agent-designer
작성일: 2026-04-08
버전: 1.0.0
상태: draft
feature: DS-AVATAR
---

# Avatar 컴포넌트 스펙

## 개요

사용자 및 AI 프로필 이미지 표현 컴포넌트 스펙입니다.
관련 파일:
- [AvatarProfile.tsx](../../../design-system/common/common/AvatarProfile.tsx)
- [UserAvatar.tsx](../../../design-system/common/common/UserAvatar.tsx)
- [flowai-avatar.tsx](../../../design-system/common/common/flowai-avatar.tsx)
- [UserProfile.tsx](../../../design-system/common/common/ui/UserProfile.tsx)

---

## Sizes

| Size  | 지름   | font-size (이니셜) |
|-------|--------|-------------------|
| `xs`  | 20px   | 10px              |
| `sm`  | 24px   | 12px              |
| `md`  | 32px   | 14px              |
| `lg`  | 40px   | 16px              |
| `xl`  | 48px   | 18px              |
| `2xl` | 64px   | 24px              |

---

## 공통 스펙

| 속성           | 값                            |
|---------------|-------------------------------|
| border-radius  | `full` (원형)                 |
| border         | 없음 (기본)                   |
| overflow       | hidden                        |
| fallback 배경  | `brand.100` (#E9E5FF)        |
| fallback 텍스트| `brand.600` (#4C34D1), 이니셜 |

---

## Variants

### UserAvatar
- 사용자 프로필 이미지 표시
- 이미지 없을 때: 이름 이니셜 (최대 2글자) 표시
- 온라인 상태 표시: 우측 하단 dot (`w-2.5 h-2.5`, `bg-semantic-success-bg-emphasis`, ring 흰색)

### FlowAI Avatar (AI 아바타)
- Flow AI 브랜드 아이콘 사용
- 배경: `brand.500` (#5B40F8) gradient
- 아이콘: 흰색 AI 심볼

### UserProfile (이름 + 아바타)
```
[Avatar]  이름 (sm-medium)
          이메일 또는 역할 (xs-regular, muted)
```

---

## Avatar Group (겹치기)
- 겹침 offset: `-8px` (음수 margin-left)
- 테두리: `2px solid white` (배경과 구분)
- 최대 표시: 3개 + `+N` 텍스트
