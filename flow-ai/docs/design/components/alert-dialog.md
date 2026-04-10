---
작성자: agent-designer
작성일: 2026-04-08
버전: 1.0.0
상태: draft
feature: DS-ALERT-DIALOG
---

# Alert Dialog 컴포넌트 스펙

## 개요

사용자의 확인이 반드시 필요한 파괴적 액션(삭제, 초기화 등)에 사용하는 경고 다이얼로그.
Figma `alter dialog` component_set 기반.

SimpleDialog / FormDialog와 다른 점:
- 배경 클릭으로 닫히지 않음 (dismiss 불가)
- 반드시 버튼으로만 닫힘
- 아이콘 강조 + 위험 색상 사용

---

## 레이아웃

```
┌─────────────────────────────────────┐
│  [경고 아이콘]                       │
│                                     │
│  제목 (h5: 18px/500)                │
│  설명 (sm-regular: 14px/400,        │
│        text-muted-foreground)        │
│                                     │
│              [취소]  [확인(위험)]   │
└─────────────────────────────────────┘
```

---

## 스펙

| 속성           | 값                          |
|---------------|-----------------------------|
| max-width      | 448px (`sm`)                |
| padding        | 32px                        |
| border-radius  | 12px (`2xl`)                |
| text-align     | 중앙 정렬                   |
| overlay        | `rgba(0,0,0,0.5)`, z-overlay(30) |
| z-index        | `modal` (40)                |
| animation(열기)| `scale-in 150ms spring`     |
| dismiss        | 불가 (배경 클릭 무시)        |

---

## 아이콘

| 타입      | 아이콘                | 색상                              | 배경                              |
|---------|---------------------|----------------------------------|----------------------------------|
| Danger   | `trash-2` / `alert-triangle` | `semantic.danger.icon` (#EF4444) | `semantic.danger.bg` (#FEF2F2) |
| Warning  | `alert-triangle`    | `semantic.warning.icon` (#F59E0B)| `semantic.warning.bg` (#FFFBEB) |
| Info     | `info`              | `semantic.info.icon` (#3B82F6)   | `semantic.info.bg` (#EFF6FF)    |

아이콘 컨테이너: `w-12 h-12 rounded-full`, 아이콘 크기: `w-6 h-6`

---

## 버튼

| 버튼    | Variant         | 위치        |
|-------|----------------|------------|
| 취소   | `outline`       | 왼쪽        |
| 확인   | `destructive`   | 오른쪽      |

버튼 정렬: `flex gap-3 justify-center` (중앙) 또는 `justify-end` (우측)
버튼 너비: `w-full sm:w-auto` (모바일 전체 너비)

---

## 사용 기준

| 상황                    | Alert Dialog | SimpleDialog |
|------------------------|:---:|:---:|
| 삭제 / 영구 제거        | ✓   |     |
| 초기화 / 데이터 손실    | ✓   |     |
| 로그아웃               | ✓   |     |
| 일반 확인 / 정보 안내   |     | ✓   |
| 폼 제출                |     | ✓   |

---

## 코드 예시

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">삭제</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <div className="mx-auto w-12 h-12 rounded-full bg-semantic-danger-bg
                      flex items-center justify-center mb-4">
        <Trash2 className="w-6 h-6 text-semantic-danger-icon" />
      </div>
      <AlertDialogTitle>정말 삭제하시겠어요?</AlertDialogTitle>
      <AlertDialogDescription>
        이 작업은 되돌릴 수 없습니다. 데이터가 영구적으로 삭제됩니다.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>취소</AlertDialogCancel>
      <AlertDialogAction className="bg-semantic-danger-bg-emphasis hover:bg-red-600">
        삭제
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```
