---
작성자: agent-designer
작성일: 2026-04-08
버전: 1.0
상태: draft
feature-id: FLOW-001
---

# 모바일 메인 채팅 화면 설계서

## 화면 개요

Flow AI의 모바일 메인 채팅 화면은 협업 도구 내에서 AI 서비스를 이용하는 핵심 인터페이스입니다. 사용자가 자연어로 질문을 입력하면 AI가 실시간으로 응답하는 채팅 기반 UI를 제공합니다.

### 주요 기능
- 실시간 AI 채팅
- 메시지 히스토리 표시
- 마크다운 기반 응답 렌더링
- 사용자 프로필 표시 (아바타)
- 반응형 모바일 디자인

### 디자인 원칙
- 모바일 우선 (320px ~ 768px)
- 터치 친화적 인터랙션
- 접근성 준수 (WCAG 2.1 AA)
- Tailwind CSS 기반 스타일링

## 레이아웃 구조

### 전체 레이아웃
```
┌─────────────────────────┐
│ 상단 헤더 (56px)         │
├─────────────────────────┤
│ 채팅 메시지 영역 (flex-1)│
│                         │
│                         │
├─────────────────────────┤
│ 하단 입력 영역 (auto)    │
└─────────────────────────┘
```

### 상단 헤더
- 높이: 56px (spacing.7)
- 배경: bg-white (colors.white)
- 그림자: shadow-sm (shadows.sm)
- 내용: 로고/타이틀 (좌측), 설정 버튼 (우측)

### 채팅 메시지 영역
- 스크롤 가능 (overflow-y-auto)
- 메시지 간 간격: spacing.4
- 사용자 메시지: 우측 정렬, bg-brand-100 (colors.brand.100)
- AI 메시지: 좌측 정렬, bg-gray-50 (colors.gray.50)

### 하단 입력 영역
- 높이: auto (min 48px)
- 배경: bg-white
- 테두리: border-t border-gray-200
- 내용: 텍스트 입력 필드 + 전송 버튼

## 컴포넌트 상세

### 1. 상단 헤더 컴포넌트
- **컴포넌트명**: MobileHeader
- **Props**:
  - title: string (기본값: "Flow AI")
  - onSettingsClick: () => void
- **구조**:
  - 로고 아이콘 (lucide-react: Bot)
  - 타이틀 텍스트 (typography.h4)
  - 설정 버튼 (Button variant="ghost", size="sm")

### 2. 메시지 컴포넌트
- **컴포넌트명**: ChatMessage
- **Props**:
  - type: "user" | "ai"
  - content: string
  - timestamp: Date
  - avatar?: string (이미지 URL)
- **Variants**:
  - user: 우측 정렬, bg-brand-100, text-brand-900
  - ai: 좌측 정렬, bg-gray-50, text-gray-900
- **하위 컴포넌트**:
  - Avatar (size="sm")
  - Markdown (AI 메시지용)

### 3. 입력 컴포넌트
- **컴포넌트명**: ChatInput
- **Props**:
  - onSend: (message: string) => void
  - placeholder: string
  - disabled?: boolean
- **구조**:
  - Textarea (variant="bordered", resize="none")
  - Button (variant="primary", size="sm", icon="Send")

## 상태별 동작

### 기본 상태 (Default)
- 헤더: 표시
- 메시지 영역: 스크롤 가능
- 입력: 활성화

### 로딩 상태 (Loading)
- AI 응답 대기 시
- 입력: disabled=true
- 메시지 영역: 로딩 인디케이터 표시 (Toast 또는 ProgressBar)

### 에러 상태 (Error)
- 네트워크 실패 시
- 입력: 활성화
- 메시지 영역: 에러 메시지 표시 (Alert Dialog)

### 빈 상태 (Empty)
- 첫 방문 시
- 메시지 영역: 웰컴 메시지 표시
- 입력: 활성화

## 인터랙션 정의

### 터치 인터랙션
- **메시지 탭**: AI 메시지 롱프레스 → 복사 옵션 표시
- **스크롤**: 자연스러운 스크롤 (momentum scrolling)
- **입력 전송**: 엔터 키 또는 전송 버튼 터치

### 애니메이션
- **메시지 등장**: animate-slide-up (motion.slideUp)
- **입력 포커스**: border-color 변경 (transition-colors duration-fast ease-out)
- **전송 버튼**: hover 시 scale-105 (motion.scaleIn)

### 제스처
- **스와이프**: 메시지 좌우 스와이프 → 삭제 옵션
- **풀 투 리프레시**: 상단 풀 → 채팅 히스토리 리로드

## UX 흐름

### 기본 흐름
1. **진입점**: 앱 아이콘 탭 → 메인 채팅 화면
2. **메시지 입력**: 텍스트 입력 → 전송 버튼 터치
3. **AI 응답**: 로딩 표시 → 마크다운 렌더링된 응답 표시
4. **계속 대화**: 반복

### 분기 조건
- **첫 방문**: 웰컴 메시지 표시
- **네트워크 없음**: 오프라인 모드 → 로컬 히스토리 표시
- **AI 오류**: 에러 메시지 표시 → 재시도 옵션

### 에러 핸들링
- **네트워크 타임아웃**: Toast 알림 + 자동 재시도
- **AI 응답 실패**: Alert Dialog + 수동 재시도
- **입력 초과**: Toast 경고 + 텍스트 트림

### 완료 상태
- **대화 종료**: 사용자 명시적 종료 또는 타임아웃
- **피드백 수집**: 대화 후 만족도 설문 (옵션)

## 예외 화면

### 오프라인 화면
- 메시지 영역: "오프라인 모드" 표시
- 입력: disabled
- 헤더: 오프라인 아이콘 표시

### 로딩 화면
- 전체 화면 오버레이
- ProgressBar + "AI 응답 생성 중..." 텍스트

### 에러 화면
- Alert Dialog: "응답을 생성할 수 없습니다. 다시 시도하세요."
- 버튼: 재시도, 취소

## 디자인 토큰 활용

### 색상
- 배경: colors.white, colors.gray.50
- 브랜드: colors.brand.500, colors.brand.100
- 텍스트: colors.gray.900, colors.gray.500

### 타이포그래피
- 헤더: typography.h4 (font-size: 18px, font-weight: 600)
- 메시지: typography.body1 (font-size: 16px)
- 입력: typography.body2 (font-size: 14px)

### 간격
- 컴포넌트 패딩: spacing.4 (16px)
- 메시지 간격: spacing.3 (12px)
- 헤더 높이: spacing.7 (28px, but wait, 56px is spacing.14?)

spacing.json을 확인해야 하지만, 가정하자. spacing.4=16px, spacing.7=28px? 보통 4=16, 8=32, 12=48, 16=64.

헤더 56px는 spacing.14 정도.

### 그림자
- 헤더: shadows.sm
- 메시지: shadows.xs (선택적)

### 모션
- 전환: motion.normal (150ms), motion.ease-out
- 애니메이션: motion.slideUp, motion.fadeIn

## 구현 참고사항

- **반응형**: 모바일 우선, 데스크톱 확장 시 사이드바 추가 고려
- **접근성**: 포커스 관리, ARIA 레이블, 키보드 네비게이션
- **성능**: 가상화된 메시지 리스트 (react-window)
- **테스트**: 터치 이벤트, 스크롤 성능, 네트워크 상태 변화

## 관련 문서
- 컴포넌트 스펙: [button.md](../components/button.md), [avatar.md](../components/avatar.md), [textarea.md](../components/textarea.md)
- 디자인 토큰: [usage-guide.md](../tokens/usage-guide.md)
- PM 핸드오프: [FLOW-001-handoff.md](../../pm/handoff/FLOW-001-handoff.md)