# Flow AI Design System

---

## 1. Context & Goals

Flow AI는 대시보드 기반 웹 애플리케이션으로,  
AI 대화, 업무 생성, 챗봇 실행을 하나의 경험으로 제공한다.

### Goals
- UI 일관성 확보
- 빠른 구현
- 접근성 기본 적용
- AI 기반 UI 생성 최적화

---

## 2. Design Principles

- Consistency over customization (must)
- Implementation-first (must)
- Accessibility by default (must)
- AI-readable structure (must)

---

## 3. Design Tokens

모든 토큰은 [design-tokens/](design-system/design-tokens/) 디렉토리의 JSON 파일에 **정의만** 이루어집니다. 본 섹션은 참조용입니다.

### 3.1 토큰 구조

| 파일 | 목적 | Tailwind 연결 |
|---|---|---|
| [typography.json](design-system/design-tokens/typography.json) | 폰트 패밀리, 크기, 라인 높이, 가중치 | ✅ `fontSize`, `fontFamily` |
| [colors.json](design-system/design-tokens/colors.json) | 브랜드, 시맨틱, 그레이스케일 색상 | ✅ `colors` (brand, semantic) |
| [spacing.json](design-system/design-tokens/spacing.json) | 마진, 패딩, 간격 (4px 기본 단위) | ✅ `spacing`, `borderRadius` |
| [shadows.json](design-system/design-tokens/shadows.json) | 엘리베이션 그림자 | ✅ `boxShadow` |
| [motion.json](design-system/design-tokens/motion.json) | 애니메이션 지속 시간 | ✅ `transitionDuration` |
| [z-index.json](design-system/design-tokens/z-index.json) | 레이어 순서 | ✅ `zIndex` |
| [border.json](design-system/design-tokens/border.json) | 보더 스타일 | ✅ `borderWidth` |
| [radix-colors.json](design-system/design-tokens/radix-colors.json) | Radix Colors 풀 스케일 (1-12) | ✅ `colors.radix` |

### 3.2 구현 연결

토큰 → Tailwind CSS 연결은 [tailwind.config.ts](design-system/tailwind.config.ts)에서 이루어집니다.

```typescript
// tailwind.config.ts
import colors from "./design-tokens/colors.json";
import typography from "./design-tokens/typography.json";
// ... 모든 토큰 import
```

프로젝트의 tailwind.config.ts에서 이 파일을 extend하거나 직접 참조합니다.

### 3.3 사용 규칙

- ❌ hex 값을 직접 사용하지 마십시오 (예: `#5B40F8`)
- ✅ Tailwind 클래스로 토큰을 적용하세요 (예: `bg-brand-500`)
- ✅ 새 색상이 필요하면 colors.json에 추가 후 Tailwind 재생성
- ❌ 디자인 문서에 토큰 값을 재선언하지 마십시오

---

## 4. Accessibility
WCAG 2.2 AA must
Keyboard interaction must
Focus-visible must
Contrast ratio must
5. Global Interaction States
states:
- default
- hover
- focus-visible
- active
- disabled
- loading
- error
6. System Architecture
AI System
 ├── Chat System
 ├── Work Manager System
 ├── Chatbot System
 └── Sidebar System
7. Chat System
7.1 Layout
header
message-list
input-area
7.2 Message
variants:
- user
- ai
- system
- error
7.3 Rules
Streaming 지원 must
Auto scroll 조건부 must
Long text wrap must
7.4 Input
Enter → 전송 must
Shift + Enter → 줄바꿈 must
7.5 Media Generation
image-message:
  preview
  prompt
  actions
Rules
이미지 카드 형태 must
regenerate 제공 should
grid layout 지원 must
8. Work Manager System
8.1 Home
템플릿 / 액션 선택 UI
명확한 입력 가이드 제공 must
8.2 Conversation Mode
message + structured-preview
Rules
preview 반드시 존재 must
confirm 없이 생성 금지 must
8.3 Workspace Mode
table / list / action-bar
Rules
editable cell must
confirm CTA must
overflow 대응 must
9. Chatbot System
9.1 Bot Directory
assistant-card:
  avatar
  name
  description
Rules
카드 전체 클릭 가능 must
search/filter 지원 should
9.2 Bot Chat
Layout
header (bot info)
message-list
input
Rules
bot 역할 항상 노출 must
추천 prompt 제공 should
목적 기반 입력 유도 must
10. Sidebar System
10.1 Layout
global-navigation
context-list
utility
10.2 Rules
selected 상태 유지 must
전체 클릭 영역 must
모바일 drawer 전환 must
11. AI-specific UX Rules
streaming UI must
결과 → 행동 연결 must
동일 입력 → 동일 구조 유지 should
단계적 정보 노출 should
12. Anti-patterns
hex 직접 사용 ❌
상태 없는 컴포넌트 ❌
focus 숨김 ❌
preview 없는 생성 ❌
action 없는 결과 ❌
13. QA Checklist
 token 사용 여부
 상태 정의 완료
 keyboard 접근 가능
 contrast 기준 충족
 responsive 대응
 edge case 정의