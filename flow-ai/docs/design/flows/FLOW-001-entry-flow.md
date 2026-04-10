---
작성자: agent-designer
작성일: 2026-04-08
버전: 1.0
상태: draft
feature-id: FLOW-001
design-system: design-system/design-tokens/ 참조
참고: 플로우AI_모바일화면설계서.pdf (FA_M_MAIN_01)
---

# FLOW-001 AI 스마트 비서 — 메인 → 비서 진입 동선 설계

---

## 1. 진입 동선 개요

### 1-1. 현재 문제

기존 FLOW-001 프로토타입은 온보딩(SCR-001)에서 바로 시작합니다.
실제 서비스에서는 **Flow AI 메인 채팅 화면**이 앱의 홈이며,
사용자는 메인 화면의 진입점을 통해 AI 스마트 비서에 접근합니다.

### 1-2. 설계 목표

- Flow AI 메인 화면에서 AI 스마트 비서를 **자연스럽게 발견**할 수 있는 진입점 제공
- 첫 사용자(온보딩 미완료)와 기존 사용자(온보딩 완료)의 분기 처리
- PDF 화면설계서(FA_M_MAIN_01)의 Quick Action 패턴 준수

### 1-3. 전체 플로우

```
[메인 채팅 화면 (SCR-000) — 라이트 테마]
    │
    ├── Quick Action Pill: "AI 챗봇" 탭
    │   ├── 첫 사용자 → [온보딩 SCR-001] → ... → [브리핑 SCR-007]
    │   └── 기존 사용자 → [브리핑 SCR-007] (바로 진입)
    │
    ├── Quick Action Pill: "플로우 검색"
    ├── Quick Action Pill: "웹 검색"
    └── Quick Action Pill: "이미지 생성"
```

---

## 2. 메인 채팅 화면 (SCR-000)

### 2-1. 화면 목적

Flow AI의 홈 화면. 사용자가 AI와 대화하거나 Quick Action으로 주요 기능에 빠르게 접근하는 허브.

### 2-2. 레이아웃

> 디자인 소스: Figma `flowAI_스마트비서` (fileKey: kcddRFoFy89dbcPUanbTbY)

```
┌─────────────────────────────────────┐
│  Header (px:8, py:12)               │
│  ☰  flow AI⚡ 🛡️    🧑‍💻③       │
│  (햄버거)(로고)(프롬프트가드)(프로필) │
├─────────────────────────────────────┤
│                                     │
│  Welcome Area (좌측 정렬, px:24)    │
│         (mt: 64px)                  │
│                                     │
│  신주경님,안녕하세요.                 │
│  (text-lg, gray.900)                │
│  무엇을 도와드릴까요?                │
│  (text-2xl font-bold, gray.900)     │
│                                     │
│         (mt: 40px)                  │
│  Quick Actions (세로 필 리스트)      │
│                                     │
│  ┌─ 🟢 플로우 검색 ──┐              │
│  └────────────────────┘ (pill)      │
│  ┌─ 🌐 웹 검색 ──────┐              │
│  └────────────────────┘ (pill)      │
│  ┌─ 🖼 이미지 생성 ──┐              │
│  └────────────────────┘ (pill)      │
│  ┌─ 💬 AI 챗봇 ──────┐              │
│  └────────────────────┘ (pill)      │
│  (세로 리스트, gap:12px)             │
│                                     │
├─────────────────────────────────────┤
│  Input Bar (px:12, pb:12)           │
│  ┌────────────────────────────────┐ │
│  │ 업무부터 일상 질문까지,          │ │
│  │ 무엇이든 물어보세요.             │ │
│  │ ┌──┬──┬──┐      ┌──┬──┐       │ │
│  │ │＋│🌐│☰ │      │🧠▼│↑│       │ │
│  │ └──┴──┴──┘      └──┴──┘       │ │
│  └────────────────────────────────┘ │
│  보안 안내 텍스트 (text-xs, center) │
└─────────────────────────────────────┘
```

### 2-3. Quick Action 필(Pill) 스펙

| 속성 | 값 | 토큰 |
|------|-----|------|
| 배경 | `gray.white` (#FFFFFF) | colors.gray.white |
| 테두리 | `gray.200` (#E2E8F0) | colors.gray.200 |
| 반경 | full (9999px) | borderRadius.full |
| 패딩 | px:16, py:8 | spacing.4 / spacing.2 |
| 아이콘 크기 | 20×20px | - |
| 제목 | text-sm font-medium, `gray.900` | textStyles.body.sm-medium |
| hover | border `brand.300`, bg `brand.50` | - |
| 전환 | colors 150ms ease-out | motion.fadeIn |
| 배치 | 세로 리스트 (inline-flex), gap 12px | - |

### 2-4. Header 스펙

| 속성 | 값 | 토큰 |
|------|-----|------|
| 높이 | auto (py:12px) | componentDefaults.header.py |
| 배경 | `gray.white` (#FFFFFF) | colors.gray.white |
| 타이틀 | "flow AI⚡", text-lg font-bold, `gray.900` | heading 스타일 |
| 사이드바 아이콘 (☰) | 24×24px, `gray.600` | - |
| 프롬프트 가드 뱃지 | 24×24px, r:full, border `brand.400`, dot `brand.500` | - |
| 프로필 아바타 | 40×40px, r:full, 알림 뱃지(red.500, 숫자) | AvatarProfile 참조 |

### 2-5. Input Bar 스펙

| 속성 | 값 | 토큰 |
|------|-----|------|
| 컨테이너 배경 | `gray.50` (#F8FAFC) | colors.gray.50 |
| 컨테이너 테두리 | `gray.200` (#E2E8F0) | colors.gray.200 |
| 컨테이너 반경 | 16px | borderRadius.2xl |
| 플레이스홀더 | "업무부터 일상 질문까지, 무엇이든 물어보세요." | - |
| 좌측 버튼 | ＋(첨부), 🌐(웹검색), ☰(슬라이더) | 36×36px |
| 우측 버튼 | 🧠▼(모델선택), ↑(전송, brand.500) | 36×36px |
| 보안 안내 | text-xs, `gray.400`, center | - |

---

## 3. 진입점 인터랙션

### 3-1. 첫 사용자 (온보딩 미완료)

```
[메인 화면] → "AI 챗봇" 필 탭
    ↓ slideUp 전환 (250ms, spring)
[SCR-001: 온보딩 진입]
    ↓ 기존 온보딩 플로우
[SCR-002] → [SCR-003] → [SCR-004] → [SCR-005] → [SCR-006]
    ↓ 시작하기
[SCR-007: 브리핑 채팅 세션]
    ↓ 뒤로가기
[메인 화면] (돌아옴)
```

**판단 기준**: `localStorage`에 `flowai_onboarding_complete` 키가 없으면 첫 사용자

### 3-2. 기존 사용자 (온보딩 완료)

```
[메인 화면] → "AI 챗봇" 필 탭
    ↓ slideUp 전환 (250ms, spring)
[SCR-007: 브리핑 채팅 세션] (바로 진입)
    ↓ 뒤로가기
[메인 화면] (돌아옴)
```

**판단 기준**: `localStorage`에 `flowai_onboarding_complete = true` 존재

### 3-3. "나중에 설정할게요" 동선

```
[메인 화면] → "AI 챗봇" 필 탭
    ↓
[SCR-001] → "나중에 설정할게요" 탭
    ↓ 기본 아바타(플레인, ✨)로 자동 설정
[SCR-007: 브리핑] (온보딩 스킵, 바로 브리핑)
```

---

## 4. 다른 Quick Action 진입점

프로토타입에서는 메인 화면의 역할을 보여주기 위해 다른 Quick Action도 간단히 구현합니다.

### 4-1. 플로우 검색

```
[메인 화면] → "플로우 검색" 카드 탭
    ↓
[검색 화면] (심플 검색 UI, 프로토타입에서는 placeholder)
```

### 4-2. 웹 검색

```
[메인 화면] → "웹 검색" 카드 탭
    ↓
[웹 검색 채팅] (프로토타입에서는 "준비 중" 토스트)
```

### 4-3. 이미지 생성

```
[메인 화면] → "이미지 생성" 카드 탭
    ↓
[이미지 생성 채팅] (프로토타입에서는 "준비 중" 토스트)
```

---

## 5. 네비게이션 구조

### 5-1. 뒤로가기 동선

| 현재 화면 | 뒤로가기 | 방식 |
|----------|---------|------|
| SCR-000 (메인) | - | 홈이므로 뒤로가기 없음 |
| SCR-001 (온보딩 진입) | SCR-000 | ← 버튼 또는 뒤로 제스처 |
| SCR-002~006 (온보딩 단계) | 이전 단계 | ← 버튼 |
| SCR-007 (브리핑) | SCR-000 | ← 버튼 (메인으로 복귀) |
| SCR-010 (설정) | SCR-007 | ← 버튼 |

### 5-2. 전환 애니메이션

| 전환 | 애니메이션 | 토큰 |
|------|----------|------|
| 메인 → 온보딩/브리핑 | slideUp | 250ms, spring easing |
| 온보딩 단계 간 | slideUp | 250ms, spring easing |
| 브리핑 → 메인 (뒤로) | slideDown | 250ms, spring easing |
| 메인 → 사이드바 | slideRight | 250ms, ease-in-out |

---

## 6. 상태 관리 확장

### 6-1. AppState 확장

```javascript
const AppState = {
  // 기존 상태 유지
  currentScreen: 'main',  // 'main' 추가 (기존: 'onboarding')
  
  // 신규: 온보딩 완료 여부 (localStorage 연동)
  isOnboardingComplete: false,
  
  // 신규: 메인 화면 상태
  main: {
    showSidebar: false,
    toastMessage: null,
  },
  
  // 기존 상태들...
  onboarding: { ... },
  assistant: { ... },
  messages: [],
  settings: { ... },
};
```

### 6-2. localStorage 키

| 키 | 값 | 용도 |
|---|---|------|
| `flowai_onboarding_complete` | `"true"` / 없음 | 온보딩 완료 여부 |
| `flowai_assistant_name` | string | 비서 이름 |
| `flowai_assistant_emoji` | string | 비서 아바타 이모지 |
| `flowai_tone` | `"formal"` / `"casual"` / `"cute"` | 말투 설정 |

---

## 7. 참고 자료

- PDF 화면설계서: 플로우AI_모바일화면설계서.pdf (FA_M_MAIN_01)
- 기존 화면설계서: [FLOW-001-screens.md](../screens/FLOW-001-screens.md)
- 컴포넌트 스펙: [FLOW-001-components.md](../components/FLOW-001-components.md)
- 디자인 토큰: [FLOW-001-tokens.md](../tokens/FLOW-001-tokens.md)
- 기술 설계: [FLOW-001-tdd.md](../../dev/tdd/FLOW-001-tdd.md)
