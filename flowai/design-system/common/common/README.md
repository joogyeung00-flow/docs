# Common Components

공통으로 재사용 가능한 UI 컴포넌트들을 모아둔 디자인 시스템입니다.

## 📍 경로 규칙

모든 공통 컴포넌트는 반드시 `apps/front/src/components/common/` 경로에 위치해야 합니다.

## 📁 컴포넌트 목록

### FeatureTooltip

기능 설명을 위한 통일된 툴팁 컴포넌트입니다. 보안마스킹, 고급답변 모드 등 다양한 기능 설명에 사용됩니다.

#### Props

```typescript
interface FeatureTooltipProps {
  children: ReactNode;           // 툴팁이 표시될 트리거 요소
  title: string;                 // 툴팁 제목 (예: "보안 마스킹", "고급 답변 모드")
  description: string;           // 기능 설명
  enabled?: boolean;             // 기능 활성화 여부 (켜짐/꺼짐 표시용)
  showStatusInTitle?: boolean;   // 제목에 켜짐/꺼짐 상태를 표시할지 여부 (기본: true)
}
```

#### 사용 예시

**1. 기본 사용법 (켜짐/꺼짐 상태 표시)**

```tsx
import { FeatureTooltip } from '@/components/common/FeatureTooltip';

<FeatureTooltip
  title='보안 마스킹'
  description='민감 정보가 그대로 노출되지 않도록\n자동으로 가려줍니다.'
  enabled={isEnabled}
>
  <Button>보안 마스킹</Button>
</FeatureTooltip>
```

**2. 상태 표시 없이 사용**

```tsx
<FeatureTooltip
  title='고급 답변 모드'
  description='복잡한 질문에 더 깊이 생각하여\n정확하고 상세한 답변을 제공합니다.'
  showStatusInTitle={false}
>
  <Button>고급 답변</Button>
</FeatureTooltip>
```

**3. enabled 없이 사용 (단순 설명 툴팁)**

```tsx
<FeatureTooltip
  title='웹 검색'
  description='최신 정보를 검색하여\n더 정확한 답변을 제공합니다.'
>
  <Button>웹 검색</Button>
</FeatureTooltip>
```

#### 특징

- **반응형 위치 조정**: 화면 밖으로 나가지 않도록 자동 조정
- **모바일 지원**:
  - 데스크톱: 호버 시 표시
  - 모바일: 클릭 시 3초간 표시 후 자동 닫기
- **다크 배경**: 가독성 좋은 다크 배경 (`#0b0e18`)
- **화살표 표시**: 트리거 요소 중앙에 정확히 위치
- **상태 표시**:
  - 켜짐: 보라색 강조 (`text-primary font-bold`)
  - 꺼짐: 회색 (`font-medium text-gray-400`)

#### 디자인 스펙

```css
/* 툴팁 배경 */
background: #24124d
border-radius: 8px
padding: 12px 16px
box-shadow: lg

/* 타이틀 (켜짐) */
color: primary (보라색)
font-weight: bold

/* 타이틀 (꺼짐) */
color: gray-400
font-weight: medium

/* 설명 텍스트 */
color: white/90
font-size: 14px
line-height: relaxed
text-shadow: 0 3px 3px rgba(0, 0, 0, 0.3)

/* 화살표 */
width: 12px
height: 6px
fill: #24124d
```

---

### ActionCard

액션 가능한 카드 컴포넌트입니다. 클릭 가능한 카드 UI를 제공합니다.

#### Props

```typescript
interface ActionCardProps {
  icon?: ReactNode;              // 아이콘
  title: string;                 // 제목
  description?: string;          // 설명
  onClick?: () => void;          // 클릭 핸들러
  className?: string;            // 추가 스타일
}
```

#### 사용 예시

```tsx
import { ActionCard } from '@/components/common/ActionCard';
import { FileText } from 'lucide-react';

<ActionCard
  icon={<FileText className="w-5 h-5" />}
  title="문서 작성"
  description="새로운 문서를 작성합니다"
  onClick={() => console.log('clicked')}
/>
```

---

### BrowseCard

파일 탐색 카드 컴포넌트입니다. 파일 업로드 또는 선택 UI를 제공합니다.

#### 특징

- 파일 드래그 앤 드롭 지원
- 클릭하여 파일 선택
- 시각적 피드백 제공

---

## 🎨 디자인 시스템

### 색상 팔레트

```css
/* Primary */
--primary: 보라색 (브랜드 컬러)

/* Foreground */
--foreground: 기본 텍스트 색상

/* Border */
--border: 기본 테두리 색상

/* Background */
--background: 기본 배경색
--flow-bg05: 호버 배경색
```

### 타이포그래피

```css
/* 제목 */
font-size: 14px
font-weight: 600 (semibold)
line-height: 20px

/* 본문 */
font-size: 14px
font-weight: 400 (normal)
line-height: 24px (relaxed)

/* 설명 */
font-size: 14px
font-weight: 400 (normal)
opacity: 0.9
```

### 간격

4px 단위 사용:
- `gap-1`: 4px
- `gap-2`: 8px
- `gap-3`: 12px
- `gap-4`: 16px

### 애니메이션

```css
/* 호버 효과 */
transition: opacity, transform, background-color
duration: 150ms
easing: ease-out

/* 호버 시 */
transform: translateY(-1px)
opacity: 0.8

/* 클릭 시 */
transform: translateY(0)
scale: 0.99
```

---

## 📝 베스트 프랙티스

### 1. Import 패턴

```tsx
// ✅ Good: Named import
import { FeatureTooltip } from '@/components/common/FeatureTooltip';
import { ActionCard } from '@/components/common/ActionCard';

// ❌ Bad: 전체 import
import * as Common from '@/components/common';
```

### 2. 컴포넌트 조합

여러 컴포넌트를 조합하여 사용하는 예시:

```tsx
import { FeatureTooltip } from '@/components/common/FeatureTooltip';
import { ActionCard } from '@/components/common/ActionCard';

<FeatureTooltip
  title="새 문서 작성"
  description="새로운 문서를 작성하여 프로젝트에 추가합니다."
>
  <ActionCard
    icon={<FileText />}
    title="문서 작성"
    onClick={handleCreateDocument}
  />
</FeatureTooltip>
```

### 3. 접근성

- 모든 인터랙티브 요소에 적절한 `aria-*` 속성 추가
- 키보드 네비게이션 지원
- 시각적 피드백 제공

---

## 🤝 기여하기

새로운 공통 컴포넌트 추가 시:

1. `/components/common/` 디렉토리에 컴포넌트 파일 생성
2. TypeScript Props 인터페이스 정의
3. JSDoc 주석으로 문서화
4. 이 README에 사용 예시 추가
5. 디자인 시스템 스펙 준수

### 컴포넌트 작성 가이드라인

```tsx
'use client';

import { type ReactNode } from 'react';

interface MyComponentProps {
  /** 컴포넌트 제목 */
  title: string;
  /** 선택적 설명 */
  description?: string;
  /** 자식 요소 */
  children?: ReactNode;
}

/**
 * MyComponent 설명
 *
 * @param title - 제목
 * @param description - 설명 (선택)
 * @param children - 자식 요소 (선택)
 */
export const MyComponent = ({
  title,
  description,
  children
}: MyComponentProps) => {
  return (
    <div>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
      {children}
    </div>
  );
};
```

---

## 📚 관련 문서

- [Dashboard Components](../dashboard/README.md)
- [UI Components](../ui/README.md)
