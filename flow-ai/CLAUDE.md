# Flow AI 프로젝트 - 멀티 에이전트 협업 환경

## 프로젝트 개요
Flow AI는 엔터프라이즈 AI 플랫폼으로, 협업 도구 Flow(플로우) 내에 탑재되는 AI 서비스입니다.

## 에이전트 팀 구성

이 프로젝트에는 3명의 전문 서브에이전트가 구성되어 있습니다:

| 에이전트 | 호출 방법 | 역할 |
|---------|----------|------|
| PM | `@agent-pm` | 기획, PRD, 요구사항 정의, 핸드오프 문서 |
| Designer | `@agent-designer` | 화면설계서, UX 플로우, 컴포넌트 스펙, Figma |
| Developer | `@agent-dev` | 코드 구현, 기술 설계, API 설계, 코드 리뷰 |

## 협업 워크플로우

### 기본 흐름
```
PM(기획) → Designer(설계) → Developer(구현)
    ↑____________________________________________↓ (피드백 루프)
```

### 핸드오프 규칙
1. PM → Designer: `docs/pm/handoff/` 에 디자인 요구사항 문서 생성
2. Designer → Developer: `docs/design/screens/` 에 화면설계서 생성
3. Developer → PM: `docs/dev/feedback/` 에 기획/디자인 피드백 기록

## 문서 구조
```
docs/
├── pm/
│   ├── prd/          # Product Requirements Documents
│   ├── specs/        # 기능 스펙 문서
│   ├── handoff/      # 핸드오프 문서
│   └── decisions/    # 의사결정 로그
├── design/
│   ├── screens/      # 화면설계서
│   ├── components/   # 컴포넌트 스펙
│   ├── flows/        # UX 플로우
│   └── tokens/       # 디자인 토큰
└── dev/
    ├── tdd/          # 기술 설계 문서
    ├── api/          # API 스펙
    ├── reviews/      # 코드 리뷰
    └── feedback/     # PM/디자인 피드백
```

## 공통 규칙
- 모든 문서는 **한국어**로 작성
- 문서 상단에 항상 메타데이터 포함: 작성자(에이전트), 작성일, 버전, 상태
- 에이전트 간 참조 시 상대 경로 사용
- 하나의 기능에 대한 문서는 동일한 feature ID로 추적 (e.g., `FLOW-001`)
