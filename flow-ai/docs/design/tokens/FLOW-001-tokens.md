---
작성자: agent-designer
작성일: 2026-04-08
버전: 1.0
상태: draft
feature-id: FLOW-001
design-system: design-system/design-tokens/ 참조
---

# FLOW-001 AI 스마트 비서 — 디자인 토큰 매핑 가이드

> 이 문서는 별도의 새 토큰을 정의하지 않습니다.
> 기존 `design-system/design-tokens/` 의 토큰을 FLOW-001 화면에 **어떻게 매핑**하는지를 정의합니다.

---

## 1. 컬러 매핑

### 1-1. 브랜드 컬러 (colors.json → brand)

| 용도 | 토큰 | 값 | Tailwind |
|------|------|-----|---------|
| 기본 CTA 버튼 배경 | `brand.500` | #5B40F8 | `bg-brand-500` |
| CTA hover | `brand.600` | #4C34D1 | `hover:bg-brand-600` |
| 사용자 채팅 버블 | `brand.500` | #5B40F8 | `bg-brand-500` |
| 선택된 칩 배경 | `brand.50` | #F3F1FF | `bg-brand-50` |
| 선택된 칩 테두리 | `brand.400` | #947DFF | `border-brand-400` |
| 선택된 칩 텍스트 | `brand.600` | #4C34D1 | `text-brand-600` |
| CTA 아웃라인 텍스트 | `brand.500` | #5B40F8 | `text-brand-500` |
| CTA 아웃라인 테두리 | `brand.200` | #D6D0FF | `border-brand-200` |
| 시간 강조 텍스트 | `brand.500` | #5B40F8 | `text-brand-500` |

### 1-2. 그레이 스케일 (colors.json → gray)

| 용도 | 토큰 | 값 | Tailwind |
|------|------|-----|---------|
| 페이지 배경 | `gray.white` | #FFFFFF | `bg-white` |
| AI 채팅 버블 배경 | `gray.50` | #F8FAFC | `bg-gray-50` |
| 카드 배경 | `gray.white` | #FFFFFF | `bg-white` |
| 기본 텍스트 | `gray.900` | #0F172A | `text-gray-900` |
| 보조 텍스트 | `gray.500` | #64748B | `text-gray-500` |
| 비활성 텍스트 | `gray.400` | #94A3B8 | `text-gray-400` |
| 테두리 | `gray.200` | #E2E8F0 | `border-gray-200` |
| 구분선 | `gray.100` | #F1F5F9 | `border-gray-100` |

### 1-3. 시멘틱 컬러 (colors.json → semantic)

| 용도 | 토큰 | 값 | Tailwind |
|------|------|-----|---------|
| 오늘 마감 라벨 | `semantic.danger.text` | #B91C1C | `text-semantic-danger-text` |
| 내일 마감 라벨 | `semantic.warning.text` | #A16207 | `text-semantic-warning-text` |
| 에러 메시지 | `semantic.danger.text` | #B91C1C | `text-semantic-danger-text` |
| 에러 배경 | `semantic.danger.bg` | #FEF2F2 | `bg-semantic-danger-bg` |
| 완료 상태 | `semantic.success.text` | #15803D | `text-semantic-success-text` |

### 1-4. 우선순위 컬러 (PriorityChip 준수)

| 레벨 | 배경 | 텍스트 | 테두리 |
|------|------|--------|--------|
| URGENT | bg-red-50 | text-red-600 | border-red-200 |
| HIGH | bg-orange-50 | text-orange-600 | border-orange-200 |
| NORMAL | bg-gray-100 | text-gray-600 | border-gray-300 |
| LOW | bg-blue-50 | text-blue-600 | border-blue-200 |

---

## 2. 타이포그래피 매핑 (typography.json)

### 2-1. 폰트 패밀리

```css
font-family: 'Pretendard', 'Roboto', 'FlowSansKR', 'Noto Sans KR', 
             ui-sans-serif, -apple-system, sans-serif;
```

Tailwind: `font-sans`

### 2-2. 텍스트 스타일 사용 맵

| 화면 요소 | 텍스트 스타일 | Tailwind 클래스 |
|----------|-------------|----------------|
| 온보딩 제목 | heading.h3 | `text-2xl font-bold` |
| 섹션 제목 | body.sm-medium | `text-sm font-medium` |
| 본문 텍스트 | body.base-regular | `text-base font-normal` |
| 보조 설명 | body.sm-regular | `text-sm font-normal` |
| 항목 제목 | body.base-medium | `text-base font-medium` |
| 메타 정보 (시간, 작성자) | caption.xs-regular | `text-xs font-normal` |
| CTA 라벨 | caption.xs-medium | `text-xs font-medium` |
| 입력 플레이스홀더 | body.sm-regular | `text-sm font-normal` |
| 에러 메시지 | caption.xs-regular | `text-xs font-normal` |

---

## 3. 스페이싱 매핑 (spacing.json)

### 3-1. 컴포넌트 기본값

| 컴포넌트 | px | py | gap | radius | 소스 |
|---------|-----|-----|-----|--------|------|
| 버튼 (CTA) | 16px | 8px | 8px | 6px (md) | componentDefaults.button |
| 카드 (브리핑 섹션) | 24px | 24px | 16px | 8px (lg) | componentDefaults.card |
| 입력 필드 | 12px | 8px | - | 6px (md) | componentDefaults.input |
| 리스트 항목 | 16px | 12px | 12px | - | componentDefaults.listItem |
| 채팅 버블 | 12px | 8px | 8px | 6px (md) | componentDefaults.chatBubble |
| 배지 (우선순위) | 8px | 4px | - | full | componentDefaults.badge |
| 헤더 | 24px | 16px | 16px | - | componentDefaults.header |

### 3-2. 주요 간격

| 용도 | 토큰 | 값 | Tailwind |
|------|------|-----|---------|
| 섹션 간 간격 | spacing.8 | 32px | `gap-8` |
| 카드 내 항목 간격 | spacing.4 | 16px | `gap-4` |
| 인라인 간격 | spacing.2 | 8px | `gap-2` |
| 텍스트-부제목 간격 | spacing.2 | 8px | `mt-2` |
| 상단/하단 여백 | spacing.8 | 32px | `py-8` |

---

## 4. 그림자 매핑 (shadows.json)

| 용도 | 토큰 | 값 |
|------|------|-----|
| 카드 | shadow-sm | `0 1px 2px 0 rgba(0,0,0,0.05)` |
| 아바타 (확인 화면) | shadow-lg | `0 4px 6px -4px rgba(0,0,0,0.1), 0 10px 15px -3px rgba(0,0,0,0.1)` |
| 입력 필드 포커스 | ring (brand.500 기반) | - |

---

## 5. 모션 매핑 (motion.json)

| 용도 | 애니메이션 | duration | easing |
|------|----------|----------|--------|
| 채팅 버블 진입 | fade-in | 150ms | ease-out |
| 화면 전환 | slide-up | 250ms | spring |
| 아바타 등장 | scale-in | 150ms | spring |
| 로딩 스켈레톤 | shimmer | 1.5s | ease-in-out, infinite |
| 버튼 hover | colors | 150ms | ease-out |
| 설정 패널 | slide-down | 250ms | spring |
| 모달 닫기 | fade-out + scale-out | 100ms | ease-in |

---

## 6. 반응형 브레이크포인트 (border.json → screens)

| 브레이크포인트 | 값 | 프로토타입 용도 |
|-------------|------|-------------|
| xs | 480px | 모바일 기준 (프로토타입 메인 타겟) |
| sm | 640px | 모바일 가로 |
| md | 768px | 태블릿 |
| lg | 1024px | 데스크톱 (중앙 정렬 max-width) |

---

## 7. 참고 자료

- 소스 토큰: [design-system/design-tokens/](../../../design-system/design-tokens/)
- Tailwind 설정: [design-system/tailwind.config.ts](../../../design-system/tailwind.config.ts)
- 화면설계서: [FLOW-001-screens.md](../screens/FLOW-001-screens.md)
- 컴포넌트 스펙: [FLOW-001-components.md](../components/FLOW-001-components.md)
