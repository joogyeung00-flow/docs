---
작성자: agent-designer
작성일: 2026-04-08
버전: 1.0
상태: draft
feature-id: FLOW-001
design-system: design-system/design-tokens/ 및 design-system/common/ 참조
---

# FLOW-001 AI 스마트 비서 — 컴포넌트 스펙

---

## 1. 기존 디자인 시스템 컴포넌트 재사용

아래 컴포넌트는 `design-system/common/` 에 이미 존재하므로 그대로 재사용합니다.

| 컴포넌트 | 소스 경로 | 용도 |
|---------|----------|------|
| FlowAIAvatar | `common/flowai-avatar.tsx` | AI 비서 아바타 표시 |
| PriorityChip | `common/PriorityChip.tsx` | 업무 우선순위 배지 (URGENT/HIGH/NORMAL/LOW) |
| AvatarProfile | `common/AvatarProfile.tsx` | 프로필 아바타 |
| EmptyContent | `common/EmptyContent.tsx` | 빈 상태 표시 |
| FieldChip | `common/ui/FieldChip.tsx` | 키워드 선택 칩 |
| LabeledInput | `common/ui/LabeledInput.tsx` | 라벨 포함 입력 필드 |
| ActionCard | `common/ui/ActionCard.tsx` | 액션 카드 |

---

## 2. 신규 컴포넌트 정의

### 2-1. ChatBubble (채팅 버블)

AI 또는 사용자의 메시지를 표시하는 말풍선 컴포넌트.

**Props**
```typescript
interface ChatBubbleProps {
  role: 'ai' | 'user';
  children: React.ReactNode;
  showAvatar?: boolean;  // AI일 때만 표시
  timestamp?: string;
}
```

**스타일 (design-tokens 기반)**

| 속성 | AI 버블 | 사용자 버블 |
|------|---------|------------|
| 정렬 | 좌측 (flex-start) | 우측 (flex-end) |
| 배경 | `gray.50` (#F8FAFC) | `brand.500` (#5B40F8) |
| 텍스트 | `gray.900` (#0F172A) | `gray.white` (#FFFFFF) |
| 패딩 | px:12, py:8 | px:12, py:8 |
| 반경 | 6px (chatBubble.radius) | 6px |
| 최대 너비 | 80% | 80% |
| 아바타 | FlowAIAvatar (h-6, w-6) 좌측 | 없음 |
| 진입 애니메이션 | `fade-in` (150ms, ease-out) | `fade-in` (150ms, ease-out) |

---

### 2-2. BriefingSection (브리핑 섹션 카드)

브리핑의 4개 섹션을 표시하는 카드 컴포넌트.

**Props**
```typescript
interface BriefingSectionProps {
  icon: string;         // 이모지 아이콘
  title: string;        // 섹션 제목
  children: React.ReactNode;  // 항목 리스트
  emptyMessage?: string;      // 빈 상태 메시지
}
```

**스타일**

| 속성 | 값 | 토큰 |
|------|-----|------|
| 배경 | `gray.white` (#FFFFFF) | colors.gray.white |
| 패딩 | 24px | componentDefaults.card.p |
| 내부 간격 | 16px | componentDefaults.card.gap |
| 반경 | 8px | componentDefaults.card.radius → borderRadius.lg |
| 그림자 | shadow-sm | shadows.sm |
| 섹션 제목 | text-sm font-medium, `gray.500` | textStyles.body.sm-medium |
| 섹션 아이콘 | 이모지, mr:8px | - |

---

### 2-3. ScheduleItem (일정 항목)

**Props**
```typescript
interface ScheduleItemProps {
  time: string;
  title: string;
  location: string;
  attendeeCount: number;
  onBriefingClick: () => void;
}
```

**스타일**

| 속성 | 값 |
|------|-----|
| 시간 | text-sm font-medium, `brand.500` (#5B40F8) |
| 제목 | text-base font-medium, `gray.900` |
| 위치 · 참석자 | text-xs, `gray.400` |
| 구분선 | border-bottom `gray.100` |
| 패딩 | px:16, py:12 (componentDefaults.listItem) |

---

### 2-4. TaskItem (업무 항목)

**Props**
```typescript
interface TaskItemProps {
  title: string;
  dueLabel: string;
  priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
  parentTask?: string | null;
  onBriefingClick: () => void;
}
```

**스타일**

| 속성 | 값 |
|------|-----|
| 우선순위 배지 | `PriorityChip` 컴포넌트 그대로 사용 |
| 업무명 | text-base font-medium, `gray.900` |
| 상위업무 | text-xs, `gray.400`, "상위 > 하위" 포맷 |
| 마감 라벨 | text-xs, 오늘=`semantic.danger.text`, 내일=`semantic.warning.text` |
| 패딩 | px:16, py:12 |

---

### 2-5. AttentionItem (확인 필요 항목)

**Props**
```typescript
interface AttentionItemProps {
  type: 'comment' | 'mention';
  title: string;
  author: string;
  timeAgo: string;
  onBriefingClick: () => void;
}
```

**스타일**

| 속성 | 값 |
|------|-----|
| 아이콘 | comment: 📝, mention: 💬 |
| 제목 | text-sm font-medium, `gray.900` |
| 작성자 · 시간 | text-xs, `gray.400` |
| 패딩 | px:16, py:12 |

---

### 2-6. BriefingCTA (내용 브리핑 버튼)

**Props**
```typescript
interface BriefingCTAProps {
  label?: string;  // 기본값: "내용 브리핑"
  onClick: () => void;
  disabled?: boolean;
}
```

**스타일**

| 상태 | 배경 | 테두리 | 텍스트 |
|------|------|--------|--------|
| default | transparent | `brand.200` (#D6D0FF) | `brand.500` (#5B40F8) |
| hover | `brand.50` (#F3F1FF) | `brand.300` (#B8AAFF) | `brand.600` (#4C34D1) |
| disabled | transparent | `gray.200` | `gray.400` |

| 속성 | 값 |
|------|-----|
| 크기 | text-xs (12px), px:8, py:4 |
| 반경 | radius-md (6px) |
| 전환 | colors 150ms ease-out |

---

### 2-7. KeywordChip (키워드 선택 칩)

온보딩 아바타 키워드 선택에 사용.

**Props**
```typescript
interface KeywordChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}
```

**스타일**

| 상태 | 배경 | 테두리 | 텍스트 |
|------|------|--------|--------|
| unselected | `gray.white` | `gray.200` (#E2E8F0) | `gray.600` (#475569) |
| selected | `brand.50` (#F3F1FF) | `brand.400` (#947DFF) | `brand.600` (#4C34D1) |

| 속성 | 값 |
|------|-----|
| 크기 | text-sm (14px), px:16, py:8 |
| 반경 | radius-full (9999px) |
| 전환 | colors 150ms ease-out |

---

### 2-8. TypingIndicator (타이핑 인디케이터)

AI 응답 대기 중 표시.

**스타일**
- 3개 점 (`●`) 순차적 shimmer 애니메이션
- AI 버블과 동일한 배경/반경 (gray.50, r:6)
- 각 점 크기: 8×8px, `gray.300`
- 애니메이션: shimmer 1.5s ease-in-out infinite, 각 점 200ms 딜레이

---

### 2-9. StepIndicator (온보딩 스텝)

**Props**
```typescript
interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number;
}
```

**스타일**
- 활성 점: `brand.500` (#5B40F8), 8×8px, r:full
- 비활성 점: `gray.200` (#E2E8F0), 8×8px, r:full
- 간격: spacing-2 (8px)

---

## 3. 상태 정의 총괄

| 컴포넌트 | 상태 목록 |
|---------|----------|
| CTA 버튼 | default / hover / active / disabled |
| 키워드 칩 | unselected / selected |
| 입력 필드 | empty / focused / filled / error |
| 채팅 버블 | 진입 시 fade-in 150ms |
| 타이핑 인디케이터 | shimmer 무한 반복 |
| 아바타 로딩 | shimmer 무한 반복 |

---

## 4. 참고 자료

- 디자인 토큰: [design-tokens/](../../../design-system/design-tokens/)
- 기존 컴포넌트: [design-system/common/](../../../design-system/common/)
- 화면설계서: [FLOW-001-screens.md](../screens/FLOW-001-screens.md)
