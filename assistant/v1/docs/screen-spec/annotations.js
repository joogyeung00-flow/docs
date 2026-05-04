/* ============================================================
 * FLOW-001 화면설계서 어노테이션 SSOT
 *
 * 데이터 형식만 정의. 렌더링 엔진은 overlay.js.
 * 작성 규칙은 README.md 참조.
 *
 * 스키마:
 *   window.SPEC_ANNOTATIONS = {
 *     screens: {
 *       "scr-XXX": {
 *         title: "화면 표시명",
 *         items: [
 *           { no, selector, title, desc, anchor }
 *         ]
 *       }
 *     }
 *   }
 *
 * anchor 옵션: top-left(기본) / top-right / bottom-left / bottom-right / center
 * desc 안에서 마크다운 링크 [text](url) 사용 가능.
 * ============================================================ */
window.SPEC_ANNOTATIONS = {

  // ════════════════════════════════════════════════════════════
  // popups — 화면 위에 일시적으로 떠 있는 시트/팝오버 (scr- 접두사 없음)
  //
  // 스키마:
  //   "<popupId>": {
  //     host: "scr-XXX" | ["scr-A","scr-B"] | "*",
  //     visibleWhen: "CSS 셀렉터 (열린 상태에서만 매치)",
  //     title: "팝업 표시명",
  //     items: [...]
  //   }
  //
  // 팝업이 열리면 패널 타이틀이 "<부모 화면> › <팝업>" 브레드크럼으로 변경되고,
  // 패널 내용이 해당 팝업의 items로 교체된다. 팝업이 닫히면 자동 복귀.
  // ════════════════════════════════════════════════════════════
  popups: {

    "pendingSheet": {
      host: "scr-100",
      visibleWhen: "#pendingSheet.is-open",
      title: "오늘 예정된 리마인드",
      items: [
        {
          no: 1,
          selector: "#pendingSheetTitle",
          title: "시트 타이틀",
          desc: "'오늘 예정된 리마인드 · N건'. N=0 이면 빈 상태 메시지로 본문이 대체됨.",
          anchor: "top-right"
        },
        {
          no: 2,
          selector: "#pendingSheetBody",
          title: "리마인드 카드 리스트",
          desc: "오늘 발송 예정된 리마인드 카드(시각·타입·제목·서브타이틀·해제 버튼). 데이터: `_getActivePendingReminders()`. PC: 중앙 팝업 / 모바일: 바텀시트.",
          anchor: "top-right"
        },
        {
          no: 3,
          selector: "#pendingSheetBody div.border button[onclick*='confirmPendingSkip']",
          title: "오늘 해제 버튼",
          desc: "한 번 확인 후 오늘 1회만 발송 차단(스누즈/시간 변경 없음). 정책은 [01-PRD §5-2-A](../01-PRD.md) 참조. 내일부터 정상 발송 재개.",
          anchor: "top-right"
        },
        {
          no: 4,
          selector: "#pendingSheet button[onclick='closePendingRemindersSheet()']",
          title: "닫기",
          desc: "오버레이 클릭 또는 X 버튼. 닫히면 [scr-100](#scr-100) 인디케이터의 N건 카운트가 갱신됨.",
          anchor: "bottom-right"
        }
      ]
    }

  },

  screens: {

    // ════════════════════════════════════════════════════════════
    // scr-scenario — 시나리오 선택 모달 (앱 진입 시 자동 노출)
    // ════════════════════════════════════════════════════════════
    "scr-scenario": {
      title: "시나리오 선택 모달",
      items: [
        {
          no: 1,
          selector: "#scr-scenario h3",
          title: "모달 헤더",
          desc: "프로토타입 시뮬레이션 진입점. 실제 제품에는 존재하지 않는 데모 전용 UI.",
          anchor: "top-right"
        },
        {
          no: 2,
          selector: "#scr-scenario button[onclick*=\"startScenario('invite')\"]",
          title: "비서 미설정 사용자 시나리오",
          desc: "푸시 알림 → 온보딩 → AI 비서 홈 흐름. 미설정 신규 사용자 유입 경로 확인용.",
          anchor: "top-right"
        },
        {
          no: 3,
          selector: "#scr-scenario button[onclick*=\"startScenario('morning')\"]",
          title: "오전 출근 시나리오 (AM 8:50)",
          desc: "푸시 → 업무 준비 채팅. 시나리오 시계가 8:50으로 고정되어 [scr-100](#scr-100) 카드의 sortMin 필터링이 적용됨.",
          anchor: "top-right"
        },
        {
          no: 4,
          selector: "#scr-scenario button[onclick*=\"startScenario('afternoon')\"]",
          title: "일정 준비 시나리오 (AM 10:30)",
          desc: "일정 30분 전 푸시 → 일정 준비 채팅. 일정 시작 시각 도달 시 카드는 자동 시의성 만료(stale).",
          anchor: "top-right"
        },
        {
          no: 5,
          selector: "#scr-scenario button[onclick*=\"startScenario('evening')\"]",
          title: "퇴근 전 시나리오 (PM 5:30)",
          desc: "푸시 → 업무 정리 채팅. 시나리오 시계가 17:30. 모든 새 알림 카드가 노출됨.",
          anchor: "top-right"
        },
        {
          no: 6,
          selector: "#scr-scenario button[onclick*=\"startScenario('sidebar')\"]",
          title: "사이드바 진입",
          desc: "푸시 없이 앱 내 메뉴 클릭으로 AI 비서 홈 진입. nowMin = Infinity로 모든 카드 노출.",
          anchor: "top-right"
        },
        {
          no: 7,
          selector: "#scr-scenario button[onclick*='resetAllState']",
          title: "데이터 초기화",
          desc: "localStorage 전체 삭제 후 온보딩부터 재시작. localStorage 스키마는 [03-data-spec §5-1](../03-data-spec.md) 참조.",
          anchor: "top-right"
        }
      ]
    },

    // ════════════════════════════════════════════════════════════
    // scr-phone — 모바일 홈 화면 시뮬레이션 (시나리오 morning/afternoon/evening 진입 시)
    // ════════════════════════════════════════════════════════════
    "scr-phone": {
      title: "모바일 홈 시뮬레이션 (푸시 알림)",
      items: [
        {
          no: 1,
          selector: "#phoneClock",
          title: "시계 / 날짜",
          desc: "선택한 시나리오의 시각을 큰 폰트로 표시. `#phoneDate` 와 함께 잠금화면 분위기 연출.",
          anchor: "top-right"
        },
        {
          no: 2,
          selector: "#phonePush",
          title: "푸시 알림",
          desc: "잠금화면 위에서 슬라이드 인. 탭 시 `phonePushTap()` → 온보딩 시작 또는 [scr-100](#scr-100) 진입. 알림 채널·문구 정책은 [01-PRD §6](../01-PRD.md#6-알림-채널-정책) 참조.",
          anchor: "bottom-right"
        },
        {
          no: 3,
          selector: "#phonePushTitle",
          title: "푸시 제목",
          desc: "시나리오별로 동적 변경. 업무 준비 / 일정 준비 / 업무 정리 / 비서 설정 유도 문구가 분기됨.",
          anchor: "top-right"
        },
        {
          no: 4,
          selector: "#scr-phone .grid",
          title: "앱 아이콘 그리드 (배경)",
          desc: "잠금화면 분위기용 더미 아이콘. opacity 40으로 흐리게 표시. 인터랙션 없음.",
          anchor: "top-right"
        },
        {
          no: 5,
          selector: "#scr-phone button[onclick*='openScenarioModal']",
          title: "시뮬레이션 종료",
          desc: "시나리오 모달로 복귀하는 데모 전용 버튼. 실제 제품에는 존재하지 않음.",
          anchor: "bottom-left"
        }
      ]
    },

    // ════════════════════════════════════════════════════════════
    // scr-000 — 메인 홈 (대시보드)
    // ════════════════════════════════════════════════════════════
    "scr-000": {
      title: "메인 홈 (대시보드)",
      items: [
        {
          no: 1,
          selector: "#scr-000 button[class*='border-brand-200']",
          title: "프롬프트 가드 (PC)",
          desc: "기업 정책 기반 프롬프트 필터링 활성 상태 표시. 정책 상세는 [01-PRD §6](../01-PRD.md#6-알림-채널-정책) 참조.",
          anchor: "top-right"
        },
        {
          no: 2,
          selector: "#scr-000 div[class*='bg-amber-50']",
          title: "공지 배너",
          desc: "운영팀 공지 1건 노출. 클릭 시 공지 상세로 이동. 데이터 소스·갱신 주기는 [03-data-spec §5-2](../03-data-spec.md) 참조.",
          anchor: "top-right"
        },
        {
          no: 3,
          selector: "#scr-000 h1[class*='text-[32px]']",
          title: "인사말 영역",
          desc: "사용자 이름 + 고정 문구. 모바일은 동일 영역의 `<h2>` 사용.",
          anchor: "top-right"
        },
        {
          no: 4,
          selector: "#scr-000 div[class*='flex-wrap']",
          title: "빠른 액션 4종",
          desc: "플로우 검색 / 웹 검색 / 이미지 만들기 / AI 챗봇. V1 스코프는 [01-PRD §4](../01-PRD.md#4-기능-범위) 참조.",
          anchor: "top-right"
        },
        {
          no: 5,
          selector: "#mainChatInputPC",
          title: "메인 입력 박스 (PC)",
          desc: "최대 4,000자. Enter 전송 / Shift+Enter 줄바꿈. 모바일 입력은 `#mainChatInput` 참조.",
          anchor: "top-left"
        },
        {
          no: 6,
          selector: "#scr-000 div[class*='grid-cols-2']",
          title: "즐겨찾기 그리드",
          desc: "사용자 즐겨찾기 챗봇/플레이북 카드. 4xl: 4열 / lg: 2열. localStorage 스키마는 [03-data-spec §5-1](../03-data-spec.md) 참조.",
          anchor: "top-right"
        }
      ]
    },

    // ════════════════════════════════════════════════════════════
    // scr-onboard — 온보딩 모달 (3-step)
    // ════════════════════════════════════════════════════════════
    "scr-onboard": {
      title: "온보딩 (AI 비서 맞춤 설정)",
      items: [
        {
          no: 1,
          selector: "#onboardIntro h1",
          title: "Intro: AI 비서 소개",
          desc: "최초 진입 시 노출되는 가치 제안 화면. '설정 시작하기' 클릭 시 `#onboardStepsWrap`로 전환되며 인트로는 숨김.",
          anchor: "top-right"
        },
        {
          no: 2,
          selector: "#stepDot1",
          title: "스텝 인디케이터 (1/3)",
          desc: "캐릭터 → 스타일 → 리마인드 3단계. 각 dot 클릭으로 직접 이동(`goToStep1/2/3`). 현재 단계명은 `#stepName`.",
          anchor: "top-right"
        },
        {
          no: 3,
          selector: "#onboardStep1",
          title: "Step 1: 캐릭터 선택",
          desc: "기본 3종(플로키/펭귀니/거북이) + 사용자 설정. 선택 시 `selectCharacter()` → `state.character` 저장. 사용자 설정은 [scr-custom-character 모달]로 분기.",
          anchor: "top-right"
        },
        {
          no: 4,
          selector: "#onboardStep2",
          title: "Step 2: 비서 스타일 선택",
          desc: "성격(personality) 옵션을 `#personalityList`에 JS로 렌더. 선택 시 `state.personality` 저장. 응답 톤·문체에 영향.",
          anchor: "top-right"
        },
        {
          no: 5,
          selector: "#onboardStep3",
          title: "Step 3: 리마인드 설정",
          desc: "업무 준비 / 일정 준비 / 업무 정리 3종 토글. 기본값 모두 ON. 시간·요일·항목 세부 조정은 [scr-reminder-settings](#scr-reminder-settings)에서.",
          anchor: "top-right"
        },
        {
          no: 6,
          selector: "#onboardStep1 button[onclick='skipOnboarding()']",
          title: "기본값으로 설정",
          desc: "온보딩 스킵. 캐릭터=플로키, 스타일=기본, 리마인드 모두 ON으로 저장 후 [scr-100](#scr-100) 진입.",
          anchor: "bottom-right"
        },
        {
          no: 7,
          selector: "#onboardStep3 button[onclick='completeOnboarding()']",
          title: "온보딩 완료",
          desc: "선택 결과 localStorage 저장 후 [scr-100](#scr-100) 진입. 이후 진입 시 온보딩은 건너뜀.",
          anchor: "top-right"
        }
      ]
    },

    // ════════════════════════════════════════════════════════════
    // scr-100 — AI 비서 홈
    // ════════════════════════════════════════════════════════════
    "scr-100": {
      title: "AI 비서 홈",
      items: [
        {
          no: 1,
          selector: "#pcHomeHeaderName",
          title: "페이지 헤더 (PC)",
          desc: "고정 타이틀 'AI 비서' + 부제. 모바일은 `#homeHeaderName`. 화면 진입 시 항상 동일 문구.",
          anchor: "top-right"
        },
        {
          no: 2,
          selector: "#scr-100 button[onclick*='openSettingsFromHome']",
          title: "비서 설정 진입",
          desc: "클릭 시 [scr-settings](#scr-settings)로 이동. 모바일은 톱니 아이콘, PC는 큰 보라 버튼.",
          anchor: "top-right"
        },
        {
          no: 3,
          selector: "#scr-100 [data-home-section='pending'] h2",
          title: "AI 비서 히어로",
          desc: "선택한 캐릭터 아바타 + '당신의 AI 비서, [이름]이에요!' 문구. 캐릭터·이름은 온보딩에서 결정.",
          anchor: "top-right"
        },
        {
          no: 4,
          selector: "#scr-100 [data-home-section='pending'] h2 + p",
          title: "컨텍스트 인사말",
          desc: "시간대·요일에 따라 문구 변경(오전/오후/저녁·평일/주말). 인사말 분기 정책은 커밋 `0584c4f` 기준.",
          anchor: "top-right"
        },
        {
          no: 5,
          selector: "#scr-100 [data-home-section='pending'] div.mt-3",
          title: "오늘 예정 리마인드 인디케이터",
          desc: "📬 칩. 미처리 N건 노출 시 클릭하면 바텀시트(모바일)/중앙 팝업(PC)으로 펼침. 0건이면 비활성 회색 칩 '모두 도착'.",
          anchor: "top-right"
        },
        {
          no: 6,
          selector: "#scr-100 [data-home-section='pending'] div[class*='space-y-3']",
          title: "새 알림 카드 리스트",
          desc: "오늘 발생한 리마인드 카드(생성중 / 완료 / 실패 3상태). 정렬: sortMin 내림차순. 새 알림이 없으면 '새로운 알림이 없어요' 빈 상태로 대체.",
          anchor: "top-right"
        },
        {
          no: 7,
          selector: "#scr-100 [data-home-section='past']",
          title: "지난 대화 섹션",
          desc: "확인 완료/시의성 만료 카드 + 고정 히스토리. 클릭 시 채팅방([scr-110](#scr-110))으로 이동.",
          anchor: "top-right"
        }
      ]
    },

    // ════════════════════════════════════════════════════════════
    // scr-110 — 채팅방 (리마인드 리포트 / 자유 대화)
    // ════════════════════════════════════════════════════════════
    "scr-110": {
      title: "채팅방",
      items: [
        {
          no: 1,
          selector: "#scr-110 .js-chat-title",
          title: "채팅 타이틀",
          desc: "채팅방 제목(예: '엑셀 급여 관리 요약'). 리마인드 카드에서 진입한 경우 해당 카드 제목, 자유 대화는 첫 메시지 요약.",
          anchor: "top-right"
        },
        {
          no: 2,
          selector: "#scr-110 button[class*='border-brand-200']",
          title: "프롬프트 가드 (PC)",
          desc: "[scr-000 §1](#scr-000) 참조. 채팅방에서도 동일하게 활성 상태 표시.",
          anchor: "top-right"
        },
        {
          no: 3,
          selector: "#scr-110 button[onclick*='showToast(\\'공유'][onclick*='복사']",
          title: "공유 버튼",
          desc: "채팅방 링크 복사. 권한·만료 정책은 [01-PRD §4](../01-PRD.md#4-기능-범위) 참조.",
          anchor: "top-right"
        },
        {
          no: 4,
          selector: "#chatDetailArea",
          title: "메시지 리스트",
          desc: "AI 응답·사용자 메시지가 시간순 누적. JS에서 동적 렌더(`renderChatDetail`). 메시지 스키마는 [03-data-spec §3](../03-data-spec.md) 참조.",
          anchor: "top-right"
        },
        {
          no: 5,
          selector: "#chatDetailInputPC",
          title: "채팅 입력 (PC)",
          desc: "최대 4,000자. Enter 전송 / Shift+Enter 줄바꿈. 모바일은 `#chatDetailInput`.",
          anchor: "top-left"
        }
      ]
    },

    // ════════════════════════════════════════════════════════════
    // scr-settings — 비서 설정 (3 섹션)
    // ════════════════════════════════════════════════════════════
    "scr-settings": {
      title: "비서 설정",
      items: [
        {
          no: 1,
          selector: "#scr-settings button[onclick*='openCharacterSheet']",
          title: "AI 캐릭터 선택",
          desc: "현재 캐릭터 카드. 클릭 시 캐릭터 시트(`#charSheetOverlay`)로 캐릭터 변경. 새 커스텀 캐릭터는 시트 내부에서 생성.",
          anchor: "top-right"
        },
        {
          no: 2,
          selector: "#settingsPersonalityList",
          title: "비서 스타일",
          desc: "성격(personality) 옵션 리스트(JS 렌더). 선택 시 `state.personality` 갱신. 응답 톤·표현에 적용.",
          anchor: "top-right"
        },
        {
          no: 3,
          selector: "#scr-settings section:nth-of-type(2) > div > div:nth-of-type(1)",
          title: "리마인드 카드: 업무 준비",
          desc: "토글 ON/OFF + 요약 표시(예: '오전 8:00 · 평일'). 카드 본문 클릭 → [scr-reminder-settings](#scr-reminder-settings) 모달 (`openReminderSettings('morning')`).",
          anchor: "top-right"
        },
        {
          no: 4,
          selector: "#scr-settings section:nth-of-type(2) > div > div:nth-of-type(2)",
          title: "리마인드 카드: 일정 준비",
          desc: "사전 알림 시점(10/30/60/180분 전 단일 선택) + 캘린더 범위 + 참석 여부. 세부는 [scr-reminder-settings](#scr-reminder-settings) §schedules.",
          anchor: "top-right"
        },
        {
          no: 5,
          selector: "#scr-settings section:nth-of-type(2) > div > div:nth-of-type(3)",
          title: "리마인드 카드: 업무 정리",
          desc: "퇴근 전 일·내일 일정 요약. 기본 오후 6:00 평일.",
          anchor: "top-right"
        },
        {
          no: 6,
          selector: "#custom-list-manage",
          title: "사용자 추가 리마인드 리스트",
          desc: "사용자가 [scr-custom-reminder](#scr-custom-reminder)에서 추가한 맞춤 리마인드. 기본 3개 카드와 동일 스타일로 인라인 노출.",
          anchor: "top-right"
        },
        {
          no: 7,
          selector: "#scr-settings button[onclick*='openAddCustomReminder']",
          title: "리마인드 추가 진입",
          desc: "PC: 헤더 우측 pill / 모바일: 리스트 하단 점선 카드. 클릭 시 [scr-custom-reminder](#scr-custom-reminder) 모달 진입.",
          anchor: "top-right"
        },
        {
          no: 8,
          selector: "#scr-settings button[onclick*=\"toggleNotifChannel('push'\"]",
          title: "모바일 푸시 알림 토글",
          desc: "OFF 시 모든 푸시 차단(리마인드 자체는 생성됨). 채널 정책은 [01-PRD §6](../01-PRD.md#6-알림-채널-정책) 참조.",
          anchor: "top-right"
        },
        {
          no: 9,
          selector: "#scr-settings button[onclick*=\"toggleReminder('dnd'\"]",
          title: "방해금지 모드",
          desc: "ON 시 푸시 차단 + 리마인드는 생성·홈에서 확인 가능. 시간 설정 토글은 #dndTimeSettings (DND ON 일 때만 노출).",
          anchor: "top-right"
        },
        {
          no: 10,
          selector: "#dndTimeSettings",
          title: "방해금지 시간 설정",
          desc: "항상 적용 / 시간 설정 2종. 시간 설정: 시작·종료 + 적용 요일(매일/평일/주말 프리셋). DND OFF 상태에서는 숨김.",
          anchor: "top-right"
        }
      ]
    },

    // ════════════════════════════════════════════════════════════
    // scr-custom-reminder — 맞춤 리마인드 만들기/편집 모달
    // ════════════════════════════════════════════════════════════
    "scr-custom-reminder": {
      title: "맞춤 리마인드 만들기",
      items: [
        {
          no: 1,
          selector: "#cbScreenTitle",
          title: "모달 헤더",
          desc: "신규 생성 시 '맞춤 리마인드 만들기', 편집 시 '맞춤 리마인드 편집'으로 변경. 진입 함수: `openAddCustomReminder(itemId)` (null=신규).",
          anchor: "top-right"
        },
        {
          no: 2,
          selector: "#cbTitleInput",
          title: "리마인드 제목",
          desc: "필수. 최대 30자. AI 비서 홈 카드 타이틀과 [scr-110](#scr-110) 채팅방 제목으로 사용.",
          anchor: "top-right"
        },
        {
          no: 3,
          selector: "#cbPromptInput",
          title: "프롬프트",
          desc: "필수. 최대 280자. 매 리마인드 시점에 LLM에 전달되는 지시문. 첨부 파일 + 플레이북스 적용 가능.",
          anchor: "top-right"
        },
        {
          no: 4,
          selector: "#cbPromptInput + #cbAttachmentList ~ div button[onclick*='openPlaybooks']",
          title: "플레이북스 호출",
          desc: "[scr-playbooks](#scr-playbooks) 진입. 템플릿 선택 시 프롬프트에 자동 삽입.",
          anchor: "top-right"
        },
        {
          no: 5,
          selector: "#scr-custom-reminder div[class*='bg-gray-50']",
          title: "고급 옵션",
          desc: "도구(자유대화/플로우 검색/웹 검색/이미지) 다중 선택 + 모델 선택 + 고급 답변 토글. 도구별 LLM 계약은 [04-llm-api-spec §7](../04-llm-api-spec.md) 참조.",
          anchor: "top-right"
        },
        {
          no: 6,
          selector: "#cbFlowProjectsRow",
          title: "플로우 검색 대상 프로젝트",
          desc: "도구에 '플로우 검색' ON일 때만 표시. 클릭 시 [scr-project-picker](#scr-project-picker) 진입.",
          anchor: "top-right"
        },
        {
          no: 7,
          selector: "#cbStandaloneTime",
          title: "리마인드 시간",
          desc: "단독 리마인드 발송 시각(HH:MM). 사용자 추가 리마인드는 standalone 고정.",
          anchor: "top-right"
        },
        {
          no: 8,
          selector: "#scr-custom-reminder div.grid.grid-cols-7",
          title: "받을 요일",
          desc: "일~토 다중 선택 + 매일/평일/주말 프리셋. 최소 1개 이상 선택 필요(검증은 저장 시).",
          anchor: "top-right"
        },
        {
          no: 9,
          selector: "#cbStep2SaveBtn",
          title: "저장 버튼",
          desc: "필수 항목(제목·프롬프트·요일) 충족 시 활성화. 저장 시 [scr-settings](#scr-settings)의 사용자 추가 리마인드 리스트에 카드 추가.",
          anchor: "top-right"
        },
        {
          no: 10,
          selector: "#cbDeleteBtn",
          title: "삭제 버튼 (편집 모드)",
          desc: "신규 생성 시 숨김. 편집 모드에서만 노출. 클릭 시 확인 다이얼로그 후 localStorage에서 항목 제거.",
          anchor: "bottom-right"
        }
      ]
    },

    // ════════════════════════════════════════════════════════════
    // scr-playbooks — 플레이북스 (추천 프롬프트 모음)
    // ════════════════════════════════════════════════════════════
    "scr-playbooks": {
      title: "플레이북스",
      items: [
        {
          no: 1,
          selector: "#pbCategoryTabs",
          title: "카테고리 필터 탭",
          desc: "전체/뉴스/리포트/일정 등 카테고리 탭(JS 렌더). 선택 시 `#pbCardList` 필터링.",
          anchor: "top-right"
        },
        {
          no: 2,
          selector: "#pbCardList",
          title: "프롬프트 카드 리스트",
          desc: "추천 프롬프트 템플릿 카드. 클릭 시 [scr-custom-reminder](#scr-custom-reminder)의 프롬프트 입력에 자동 삽입 후 모달 닫힘.",
          anchor: "top-right"
        },
        {
          no: 3,
          selector: "#scr-playbooks button[onclick='closePlaybooks()']",
          title: "닫기 (← 뒤로)",
          desc: "[scr-custom-reminder](#scr-custom-reminder)로 복귀. 진입 경로 외 다른 화면에서는 호출되지 않음.",
          anchor: "bottom-right"
        }
      ]
    },

    // ════════════════════════════════════════════════════════════
    // scr-reminder-settings — 리마인드 설정 모달 (morning/schedules/wrapup 공용)
    // ════════════════════════════════════════════════════════════
    "scr-reminder-settings": {
      title: "리마인드 설정 (업무 준비/일정 준비/업무 정리 공용)",
      items: [
        {
          no: 1,
          selector: "#reminderSettingsTitle",
          title: "모달 헤더",
          desc: "진입 시 카드 종류에 따라 '업무 준비 설정' / '일정 준비 설정' / '업무 정리 설정' 으로 변경. 진입: `openReminderSettings(kind)`.",
          anchor: "top-right"
        },
        {
          no: 2,
          selector: "#bsm-section-morning",
          title: "업무 준비 섹션",
          desc: "시간 + 요일 + 항목(오늘 일정 / 담당 마감 / 요청 마감 / 퇴근 후 변화) 4개 서브 토글. 각 항목 우측 화살표 클릭 시 [scr-item-settings](#scr-item-settings).",
          anchor: "top-right"
        },
        {
          no: 3,
          selector: "#bsm-section-schedules",
          title: "일정 준비 섹션",
          desc: "사전 알림 시점(10/30/60/180분 전 단일) + 캘린더 범위(다중 선택) + 참석 여부(전체/참석만). 정책은 [03-data-spec §3](../03-data-spec.md) 참조.",
          anchor: "top-right"
        },
        {
          no: 4,
          selector: "#bsm-section-wrapup",
          title: "업무 정리 섹션",
          desc: "시간 + 요일 + 항목(오늘 참석 일정 / 오늘 업무 현황 / 내일 일정 미리보기) 3개 서브 토글.",
          anchor: "top-right"
        },
        {
          no: 5,
          selector: "#bsm-morning-time, #bsm-wrapup-time",
          title: "리마인드 시간",
          desc: "HH:MM. 데이터 수집은 발송 30분 전부터 시작(`#reminderCollectHint` 안내).",
          anchor: "top-right"
        },
        {
          no: 6,
          selector: "#bsm-section-morning div.grid.grid-cols-7, #bsm-section-wrapup div.grid.grid-cols-7",
          title: "리마인드 요일",
          desc: "일~토 다중 선택 + 매일/평일/주말 프리셋 + 공휴일 알림 받기 체크박스.",
          anchor: "top-right"
        },
        {
          no: 7,
          selector: "#morning-items-panel, #wrapup-items-panel",
          title: "리마인드 항목 (서브 토글)",
          desc: "각 서브 항목별 ON/OFF + 우측 필터(태그) 영역. 필터는 [scr-item-settings](#scr-item-settings)에서 편집.",
          anchor: "top-right"
        },
        {
          no: 8,
          selector: "#schedules-lead-chips",
          title: "사전 알림 시점 (일정 준비)",
          desc: "단일 선택. 일정 시작 시각 기준 N분 전. 변경 시 [scr-100](#scr-100)의 sortMin 재계산.",
          anchor: "top-right"
        }
      ]
    },

    // ════════════════════════════════════════════════════════════
    // scr-item-settings — 항목별 세부 설정 모달 (필터·범위)
    // ════════════════════════════════════════════════════════════
    "scr-item-settings": {
      title: "항목 상세 설정",
      items: [
        {
          no: 1,
          selector: "#itemSettingsTitle",
          title: "모달 헤더",
          desc: "선택한 (kind, subItem) 조합에 따라 동적 변경(예: '오늘 일정', '내가 담당자인 마감 업무'). 진입: `openItemSettingsSheet(kind, subItem)`.",
          anchor: "top-right"
        },
        {
          no: 2,
          selector: "#scr-item-settings button[onclick='resetItemSettings()']",
          title: "초기화",
          desc: "현재 항목의 필터를 항목별 기본값으로 복원. 저장 전까지는 메모리상 변경만 반영.",
          anchor: "top-right"
        },
        {
          no: 3,
          selector: "#itemSettingsFields",
          title: "필터·옵션 필드",
          desc: "JS에서 항목별 스키마에 따라 동적 렌더(체크박스/라디오/드롭다운). 필드 정의는 [03-data-spec §3](../03-data-spec.md) 참조.",
          anchor: "top-right"
        },
        {
          no: 4,
          selector: "#scr-item-settings button[onclick='saveItemSettings()']",
          title: "저장",
          desc: "필터를 [scr-reminder-settings](#scr-reminder-settings)의 항목 행 태그로 반영하고 모달 닫음. 저장 안 하면 변경 폐기.",
          anchor: "top-right"
        }
      ]
    },

    // ════════════════════════════════════════════════════════════
    // scr-project-picker — 플로우 프로젝트 선택 (2컬럼 모달)
    // ════════════════════════════════════════════════════════════
    "scr-project-picker": {
      title: "플로우 프로젝트 선택",
      items: [
        {
          no: 1,
          selector: "#projectPickerTitle",
          title: "모달 헤더",
          desc: "진입 컨텍스트에 따라 '캘린더 범위 선택' / '프로젝트 선택' 등으로 변경. 진입 함수: `openProjectPicker(opts)`.",
          anchor: "top-right"
        },
        {
          no: 2,
          selector: "#projectPickerTabs",
          title: "탭 (프로젝트 / 폴더)",
          desc: "프로젝트 평면 리스트 vs 폴더 트리. 폴더 탭은 현재 토스트만 표시(`toastPickerFolders`)되는 placeholder.",
          anchor: "top-right"
        },
        {
          no: 3,
          selector: "#projectPickerSearch",
          title: "프로젝트 검색",
          desc: "이름 부분 일치. 입력 시 `renderProjectPickerList()` 즉시 호출.",
          anchor: "top-right"
        },
        {
          no: 4,
          selector: "#projectPickerList",
          title: "프로젝트 리스트",
          desc: "체크박스 다중 선택. 선택 즉시 우측 요약 패널과 카운트에 반영.",
          anchor: "top-right"
        },
        {
          no: 5,
          selector: "#projectPickerSelected",
          title: "선택 요약 (PC 전용)",
          desc: "선택된 프로젝트 칩 리스트. 칩의 X 클릭으로 개별 해제. 모바일은 카운트만 푸터에 표시(`#projectPickerCountMobile`).",
          anchor: "top-right"
        },
        {
          no: 6,
          selector: "#scr-project-picker button[onclick='confirmProjectPicker()']",
          title: "확인",
          desc: "선택 결과를 호출자(예: [scr-custom-reminder](#scr-custom-reminder)의 프로젝트 행)에 콜백으로 전달.",
          anchor: "top-right"
        }
      ]
    }

  }
};
