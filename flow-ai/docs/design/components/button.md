---
작성자: agent-designer
작성일: 2026-04-08
버전: 1.1.0
상태: draft
feature: DS-BUTTON
---

# Button 컴포넌트 스펙

## 개요

Flow AI에서 사용하는 모든 버튼의 시각 스펙입니다.
Figma에서 플랫폼별로 3종 컴포넌트가 분리되어 있습니다.

| Figma 컴포넌트    | 용도                        |
|-----------------|----------------------------|
| `button`         | 웹 기본 버튼 (공통)          |
| `PC-button`      | PC 전용 (더 큰 클릭 영역)    |
| `mobile-button`  | 모바일 전용 (터치 타겟 44px+) |
| `snb-button`     | 사이드 네비게이션 바 전용     |

---

## Variants

| Variant      | 배경색                             | 텍스트 색               | 테두리           |
|--------------|-----------------------------------|------------------------|-----------------|
| `default`    | `brand.500` (#5B40F8)             | `gray.white`           | 없음            |
| `secondary`  | `gray.100` (#F1F5F9)              | `gray.900` (#0F172A)   | 없음            |
| `outline`    | 투명                              | `gray.800` (#1E293B)   | `border` 1px    |
| `ghost`      | 투명                              | `gray.800`             | 없음            |
| `link`       | 투명                              | `semantic.link.default`| 없음 (underline)|
| `destructive`| `semantic.danger.bg-emphasis`     | `gray.white`           | 없음            |

---

## Sizes — PC (`button` / `PC-button`)

| Size  | height | padding-x | font-size | border-radius |
|-------|--------|-----------|-----------|---------------|
| `sm`  | 32px   | 12px      | 14px      | 6px (`md`)    |
| `md`  | 40px   | 16px      | 14px      | 6px (`md`)    |
| `lg`  | 48px   | 24px      | 16px      | 8px (`lg`)    |
| `icon`| 40px   | —         | —         | 6px (정사각형)|

## Sizes — Mobile (`mobile-button`)

터치 타겟 최소 44px 보장. 시각적 크기와 실제 클릭 영역을 분리합니다.

| Size  | height (시각) | 터치 타겟 | padding-x | font-size |
|-------|-------------|---------|-----------|-----------|
| `sm`  | 36px        | 44px    | 16px      | 14px      |
| `md`  | 44px        | 44px    | 20px      | 16px      |
| `lg`  | 52px        | 52px    | 24px      | 16px      |
| `icon`| 44px        | 44px    | —         | —         |

```tsx
// 모바일: 시각 크기 36px + 투명 패딩으로 터치 타겟 44px 확보
<button className="h-9 px-4 py-3 relative after:absolute after:inset-[-4px]" />
```

## SNB Button (`snb-button`)

사이드바 메뉴 아이템 버튼. 가로 전체 너비를 차지합니다.

| 속성          | 값                          |
|-------------|----------------------------|
| height       | 36px                       |
| padding-x    | 12px                       |
| padding-y    | 8px                        |
| border-radius| 6px (`md`)                 |
| width        | 100% (사이드바 너비)         |
| gap          | 8px (아이콘 + 텍스트)        |
| font-size    | 14px                       |
| font-weight  | 400 (기본), 500 (활성)      |

**SNB 버튼 상태:**
| 상태    | 배경                              | 텍스트           |
|--------|----------------------------------|-----------------|
| Default | 투명                             | `gray.600`      |
| Hover   | `flow-bg.300` (#EEECF9)          | `gray.800`      |
| Active  | `brand.50` (#F3F1FF)             | `brand.600`     |
| Selected| `brand.100` (#E9E5FF)            | `brand.700`     |

---

## 공통 States

### Hover
- `default`: 배경 → `brand.600` (#4C34D1), `transform: translateY(-1px)`
- `secondary` / `outline` / `ghost`: 배경 → `gray.100`
- `transition`: `colors 150ms ease-out, transform 150ms ease-out`

### Focus
- `outline: 2px solid ring` (`gray.500`)
- `outline-offset: 2px`

### Disabled
- `opacity: 0.4`
- `cursor: not-allowed`
- 호버 효과 없음

### Loading
- 텍스트 앞 spinner (`loader` from lucide, 16px, `animate-spin`)
- 버튼 비활성화 상태와 동일

---

## 아이콘 사용

```tsx
// 아이콘 + 텍스트
<Button>
  <Plus className="w-4 h-4" />
  추가하기
</Button>

// 아이콘만 (size="icon")
<Button size="icon" variant="ghost">
  <MoreHorizontal className="w-4 h-4" />
</Button>
```

- 아이콘 크기: size `sm` → 14px / `md`·`lg` → 16px
- 아이콘 + 텍스트 간격: `gap-2` (8px)

---

## 반응형 가이드

```tsx
// PC에서 md, 모바일에서 full-width lg
<Button className="md:w-auto w-full text-sm md:text-base h-11 md:h-10">
  저장
</Button>
```
