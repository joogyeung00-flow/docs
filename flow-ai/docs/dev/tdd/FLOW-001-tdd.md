---
작성자: agent-dev
작성일: 2026-04-08
버전: 1.1
상태: draft
feature-id: FLOW-001
design-system: design-system/design-tokens/ 참조
---

# 기술 설계 문서: AI 스마트 비서 프로토타입 (FLOW-001)

---

## 1. 개요

### 1-1. 목적

이 문서는 AI 스마트 비서 "플레인" 프로토타입을 바이브코딩으로 빠르게 구현하기 위한 기술 설계를 정의합니다. 실제 백엔드 연동 없이 더미 데이터 기반으로 동작하는 인터랙티브 프로토타입을 목표로 합니다.

### 1-2. 프로토타입 목표

- 핵심 UX 플로우 검증 (온보딩 → 브리핑 → 대화)
- 이해관계자 데모용 시각 자료 제공
- 실제 구현 시 참고 기준점 역할

---

## 2. 기술 스택 결정

### 2-1. 선택: 단일 HTML 파일 + CDN

| 항목 | 선택 | 이유 |
|------|------|------|
| 마크업 | HTML5 | 별도 빌드 없이 즉시 실행 |
| 스타일 | Tailwind CSS (CDN) | 빠른 UI 구성, 유틸리티 클래스 |
| 스크립트 | Vanilla JS (ES6+) | 의존성 없음, 빠른 프로토타이핑 |
| 폰트 | Pretendard (CDN) | 디자인 시스템 기본 폰트 (typography.json) |
| 아이콘 | Heroicons SVG 인라인 | 외부 의존성 최소화 |

### 2-2. 선택하지 않은 옵션

| 옵션 | 제외 이유 |
|------|----------|
| React/Next.js | 빌드 환경 설정 필요, 프로토타입 오버엔지니어링 |
| Vue.js | 위와 동일 |
| Figma 프로토타입 | 실제 인터랙션 구현 불가 |

---

## 3. 화면 상태 관리 구조

### 3-1. 앱 상태 (AppState)

```javascript
const AppState = {
  // 현재 화면
  currentScreen: 'onboarding', // 'onboarding' | 'briefing' | 'settings'
  
  // 온보딩 상태
  onboarding: {
    step: 1,              // 1: 이름설정, 2: 키워드선택, 3: 로딩, 4: 완료
    assistantName: '',    // 사용자가 입력한 비서 이름
    selectedMood: null,   // 선택된 분위기 키워드
    selectedStyle: null,  // 선택된 스타일 키워드
    isComplete: false,    // 온보딩 완료 여부
  },
  
  // AI 비서 정보
  assistant: {
    name: '플레인',
    avatarColor: '#5B40F8', // brand.500 (design-tokens/colors.json)
    avatarEmoji: '✨',
  },
  
  // 채팅 메시지 목록
  messages: [],
  
  // 설정
  settings: {
    tone: 'formal', // 'formal' | 'casual' | 'cute'
  }
};
```

### 3-2. 화면 전환 흐름

```
[온보딩 Step1 - 이름 설정]
    ↓ 다음 버튼
[온보딩 Step2 - 키워드 선택]
    ↓ 아바타 생성 버튼
[온보딩 Step3 - 로딩 (2초)]
    ↓ 자동 전환
[온보딩 Step4 - 완료 확인]
    ↓ 시작하기 버튼
[메인 브리핑 화면]
    ↕ 설정 아이콘
[설정 화면]
```

---

## 4. 컴포넌트 구조 설계

### 4-1. 화면 컴포넌트

```
App
├── OnboardingScreen
│   ├── Step1_NameInput         # 비서 이름 입력
│   ├── Step2_KeywordSelect     # 분위기/스타일 키워드 선택
│   ├── Step3_Loading           # 아바타 생성 중 로딩
│   └── Step4_Complete          # 완료 축하 + 인사말
├── BriefingScreen
│   ├── Header                  # 아바타 + 이름 + 날짜 + 설정 아이콘
│   ├── ChatContainer           # 스크롤 가능한 메시지 영역
│   │   ├── BriefingMessage     # AI 브리핑 메시지 버블
│   │   │   ├── ScheduleSection # 오늘의 일정 섹션
│   │   │   ├── TaskSection     # 마감 업무 섹션
│   │   │   ├── AbsenceSection  # 부재중 변화 섹션
│   │   │   └── AttentionSection# 확인 필요 섹션
│   │   ├── AIMessage           # AI 응답 버블 (내용 브리핑 결과)
│   │   └── UserMessage         # 사용자 메시지 버블
│   └── InputBar                # 메시지 입력창
└── SettingsScreen
    ├── NameEdit                # 비서 이름 변경
    ├── AvatarRegen             # 아바타 재생성
    └── ToneSelect              # 말투 선택
```

### 4-2. 주요 함수 목록

```javascript
// 화면 전환
function showScreen(screenName) {}
function nextOnboardingStep() {}

// 온보딩
function validateName(name) {}       // 이름 유효성 검사
function selectKeyword(category, value) {}  // 키워드 선택
function generateAvatar() {}         // 아바타 생성 (2초 로딩 시뮬레이션)

// 채팅
function addMessage(role, content, type) {}  // 메시지 추가
function sendUserMessage(text) {}            // 사용자 메시지 전송
function triggerBriefing(itemId) {}          // [내용 브리핑] 버튼 클릭
function getAIResponse(userMessage) {}       // AI 더미 응답 생성

// UI 유틸
function scrollToBottom() {}        // 채팅창 최하단 스크롤
function renderMessages() {}        // 메시지 목록 렌더링
function formatTime(date) {}        // 시간 포맷팅
```

---

## 5. 더미 데이터 스키마

### 5-1. 브리핑 데이터

```json
{
  "assistant": {
    "name": "플레인",
    "avatarEmoji": "✨",
    "avatarColors": ["#5B5BD6", "#8B5CF6"]
  },
  "briefing": {
    "date": "2026년 4월 8일 (수)",
    "schedules": [
      {
        "id": "sch-001",
        "time": "09:30",
        "title": "주간 팀 스탠드업",
        "location": "화상회의",
        "attendeeCount": 5
      },
      {
        "id": "sch-002",
        "time": "14:00",
        "title": "스프린트 리뷰",
        "location": "본사 3층 회의실",
        "attendeeCount": 8
      },
      {
        "id": "sch-003",
        "time": "16:30",
        "title": "1on1 - 김팀장",
        "location": "팀장실",
        "attendeeCount": 2
      }
    ],
    "tasks": [
      {
        "id": "task-001",
        "title": "Q2 마케팅 보고서 초안",
        "dueLabel": "오늘 마감",
        "priority": "urgent",
        "parentTask": null
      },
      {
        "id": "task-002",
        "title": "PRD 작성",
        "dueLabel": "오늘 마감",
        "priority": "high",
        "parentTask": "스마트비서 기획"
      },
      {
        "id": "task-003",
        "title": "디자인 리뷰 피드백",
        "dueLabel": "내일 마감",
        "priority": "normal",
        "parentTask": null
      }
    ],
    "absence": {
      "newTaskCount": 2,
      "statusChangeCount": 3,
      "mentionCount": 5
    },
    "attentionItems": [
      {
        "id": "att-001",
        "type": "comment",
        "title": "계약서 검토 요청에 미답변",
        "author": "박주임",
        "timeAgo": "2일 전"
      },
      {
        "id": "att-002",
        "type": "mention",
        "title": "Q2 기획안 리뷰 요청 멘션",
        "author": "이대리",
        "timeAgo": "어제"
      }
    ]
  }
}
```

### 5-2. 내용 브리핑 더미 응답

```javascript
const BRIEFING_RESPONSES = {
  'sch-001': '주간 팀 스탠드업은 매주 수요일 09:30에 진행되는 정기 회의예요. 오늘은 5명이 참석 예정이에요. Flow에서 이번 주 팀 업무 현황을 확인해보니 총 12건 중 7건이 진행 중이에요.',
  'sch-002': '스프린트 리뷰는 완료된 작업을 팀과 검토하는 자리예요. 본사 3층 회의실에서 8명이 참석해요. 이번 스프린트 업무 중 완료된 항목을 미리 정리해두면 좋을 것 같아요.',
  'task-001': 'Q2 마케팅 보고서 초안은 오늘이 마감이에요. 긴급 우선순위 업무예요. 관련 자료는 마케팅팀 채널에서 공유된 "Q2 데이터" 파일을 참고하세요.',
  'task-002': 'PRD 작성 업무는 "스마트비서 기획" 프로젝트의 하위 업무예요. 오늘 마감이니 서두르는 것이 좋겠어요. 현재 PRD 템플릿은 위키에서 확인하실 수 있어요.',
};
```

---

## 6. 향후 실제 API 연동 시 변경 포인트

| 현재 (프로토타입) | 실제 구현 시 |
|------------------|-------------|
| `DUMMY_DATA` 객체 | `GET /api/v1/briefing/today` API 호출 |
| `setTimeout` 2초 로딩 | 실제 이미지 생성 API (Stable Diffusion 등) |
| `BRIEFING_RESPONSES` 객체 | LLM API 호출 (Claude API) |
| `localStorage` 설정 저장 | 서버 사이드 사용자 설정 API |
| 하드코딩된 더미 메시지 | WebSocket 또는 SSE 기반 스트리밍 |

---

## 7. 비기능 요구사항

| 항목 | 스펙 |
|------|------|
| 기준 해상도 | 모바일 390px 기준, 데스크톱에서도 중앙 정렬 |
| 애니메이션 | CSS transition 200~300ms, 채팅 버블 fade-in |
| 폰트 | Pretendard (400, 500, 700) — design-system 기본 |
| 브라우저 | Chrome 최신 버전 기준 (프로토타입) |
| 접근성 | aria-label 필수 요소에 적용, 충분한 색상 대비 |
