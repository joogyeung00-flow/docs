---
name: 화면설계서 오버레이 작성 가이드
description: FLOW-001 프로토타입 위에 어노테이션을 얹어 화면설계서를 만드는 도구의 사용·작성 규칙
---

# 화면설계서 오버레이

`prototype/FLOW-001-prototype-v3.html` 을 그대로 두고, 그 위에 번호 뱃지(①②③)와 우측 사이드 패널로 화면설계서 설명을 표시한다. 설명 데이터는 `annotations.json` 한 곳에서만 관리한다.

---

## 1. 구성

| 파일 | 역할 |
|---|---|
| `overlay.js` | 어노테이션 엔진 (토글 버튼·뱃지·패널 렌더, 화면 전환 감지) |
| `overlay.css` | 오버레이 전용 스타일 (모든 클래스 `spec-` prefix로 격리) |
| `annotations.js` | **어노테이션 SSOT.** `window.SPEC_ANNOTATIONS` 에 데이터 등록 |
| `README.md` | 본 가이드 |

프로토타입 측 변경: `</body>` 직전에 `<script src="../docs/screen-spec/overlay.js" defer></script>` 1줄.

---

## 2. 사용 방법

1. 브라우저로 `prototype/FLOW-001-prototype-v3.html` 열기
2. 우측 하단 `📋 설계서 모드` 버튼 클릭
3. 활성 화면의 어노테이션이 자동 표시됨
4. 화면 전환(`.screen.active` 변경) 시 자동 재렌더

캡처/공유용 자동 ON: `FLOW-001-prototype-v3.html?spec=on`

---

## 3. annotations.js 작성 규칙

### 3-1. 스키마

```js
window.SPEC_ANNOTATIONS = {
  screens: {
    "scr-XXX": {
      title: "화면 표시명",
      items: [
        {
          no: 1,
          selector: "CSS 셀렉터",
          title: "항목 제목 (한 줄)",
          desc: "설명 본문. 마크다운 링크 [text](url) 가능.",
          anchor: "top-right"
        }
      ]
    }
  }
};
```

### 3-2. 필드 정의

| 필드 | 필수 | 설명 |
|---|---|---|
| `no` | 필수 | 화면 내 번호. 1부터 순차. 중복 금지. |
| `selector` | 필수 | 대상 요소 CSS 셀렉터. `#scr-XXX` 로 시작하는 것을 권장. |
| `title` | 필수 | 패널 카드 제목. 한 줄, 30자 이내. |
| `desc` | 필수 | 설명 본문. 다른 문서 참조는 `[01-PRD §N](../01-PRD.md#anchor)` 형식. |
| `anchor` | 선택 | 뱃지 위치. `top-left`(기본) / `top-right` / `bottom-left` / `bottom-right` / `center` |

### 3-3. 셀렉터 작성 팁

Tailwind 클래스에 포함된 `:` 와 `/` 는 CSS에서 이스케이프(`\\:`, `\\/`)가 필요해 가독성이 나쁘다.

**권장: 속성 부분 일치 셀렉터로 이스케이프 회피**

```js
selector: "#scr-000 div[class*='bg-amber-50']"
```

vs. 비권장:

```js
selector: "#scr-000 .bg-amber-50\\/60"
```

가능하면 다음 우선순위로 선택한다:

1. ID 셀렉터 (`#mainChatInputPC`) — 가장 안정
2. `#scr-XXX` 스코프 + 속성 부분 일치 (`#scr-000 div[class*='grid-cols-2']`)
3. `#scr-XXX` 스코프 + 단일 클래스
4. 구조적 셀렉터 (`#scr-XXX > div:nth-child(2)`) — DOM 변경에 취약, 마지막 수단

### 3-4. 셀렉터가 여러 개를 매칭할 때

엔진은 `querySelector`(첫 매치)를 사용하되, **표시 중이지 않은(`display:none` 또는 width/height 0)** 첫 매치는 건너뛰고 다음 매치를 시도한다. 따라서 모바일/PC 반응형 분기에서 동일 selector가 중복돼도 화면에 보이는 쪽이 자동 선택된다.

### 3-5. 셀렉터를 못 찾으면

패널 카드는 `셀렉터 미발견` 빨간 태그와 함께 표시된다. 뱃지는 그려지지 않는다. 셀렉터를 수정하거나 항목을 삭제하라.

---

## 4. 팝업·시트 (popups)

`scr-` 접두사를 따르지 않는 시트/팝오버(예: `#pendingSheet`, `#charSheetOverlay`)는 별도 `popups` 키에 등록한다. 팝업이 열리면 패널 타이틀이 `<부모 화면> › <팝업 이름>` 브레드크럼으로 바뀌고, 패널 내용도 팝업의 items로 자동 교체된다. 팝업이 닫히면 부모 화면의 items로 복귀한다.

### 4-1. 스키마

```js
window.SPEC_ANNOTATIONS = {
  popups: {
    "pendingSheet": {
      host: "scr-100",                       // 부모 화면 id (문자열, 배열, 또는 "*")
      visibleWhen: "#pendingSheet.is-open",  // 열린 상태에서만 매치되는 셀렉터
      title: "오늘 예정된 리마인드",
      items: [ /* 일반 어노테이션 항목과 동일 */ ]
    }
  },
  screens: { /* ... */ }
};
```

### 4-2. 필드 설명

| 필드 | 설명 |
|---|---|
| `host` | 부모 화면 id. 단일 문자열, 배열(여러 화면 공용), 또는 `"*"` (모든 화면). |
| `visibleWhen` | 팝업이 **열려 있을 때만** 매치되는 CSS 셀렉터. 보통 root id + open 클래스 (예: `#pendingSheet.is-open`). |
| `title` | 패널 브레드크럼에 표시되는 팝업 이름. |
| `items` | 일반 화면 어노테이션과 동일 스키마. 셀렉터는 보통 `#팝업ID ...` 절대 경로 사용. |

### 4-3. visibleWhen 작성 팁

대부분의 팝업은 열림 상태를 클래스 또는 인라인 style로 표시한다:

- **클래스 토글**: `#pendingSheet.is-open` (가장 안정적, 우선 권장)
- **opacity 토글**: 셀렉터 단계에서는 표현 어려움 → root id만 두고 engine이 `opacity != 0` 도 함께 체크하므로 `#charSheetOverlay:not(.hidden)` 같이 결합

엔진은 `visibleWhen` 매치 + `getComputedStyle` 의 opacity/pointer-events/visibility 까지 추가 검증한다.

### 4-4. 동시 열림

여러 팝업이 동시에 열려 있으면(드물지만 모달 위 모달), `z-index` 가장 큰 것 우선.

---

## 5. 본 도구가 따르는 SSOT 규칙

상위 `CLAUDE.md` §1 SSOT 매핑을 그대로 따른다:

- `desc` 본문에 V1 항목 수, breakpoint 같은 핵심 숫자를 **재서술하지 않는다**. 링크 참조만.
- 같은 항목을 두 화면에 중복 등록하지 않는다. 공통 정책은 한 화면에서만 설명하고, 다른 화면은 같은 정책 문서를 링크로 참조.
- 변경이력 표현(`v3.4 신규`, `(추가)`)을 본문에 쓰지 않는다. 변경은 `docs/CHANGELOG.md`.

---

## 6. 개발 편의

브라우저 콘솔에서 다음 API 사용 가능:

```js
SpecOverlay.on()      // 모드 켜기
SpecOverlay.off()     // 끄기
SpecOverlay.reload()  // annotations.js 재로드 (편집 후 즉시 반영)
```

---

## 7. 동작 환경

- `file://` 프로토콜에서 그대로 작동한다 (annotations를 `<script>` 태그로 로드하므로 fetch CORS 제약 없음).
- 프로토타입 DOM이 크게 바뀌면 셀렉터가 깨질 수 있다. 그때마다 `annotations.js` 의 `selector` 만 갱신하면 된다.
- 활성 화면을 찾지 못한다는 에러가 나오면 시나리오 선택 모달이 띄워져 있는 상태일 수 있다. 모달을 닫고 메인 화면(`scr-000` 등)으로 진입한 뒤 다시 열면 된다.
