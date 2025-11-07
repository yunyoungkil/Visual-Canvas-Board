# 디버깅 & 최적화 일지

프로젝트에서 발생한 에러, 버그, 최적화 과정을 기록합니다.  
문제 해결 방법을 상세히 문서화하여 향후 유사한 문제 발생 시 빠른 대응이 가능합니다.

---

## 2025-01-07

### ✅ 해결: 이미지 리사이징 후 캔버스 드래그 문제

**증상:**
- 이미지 리사이징 완료 후 캔버스를 클릭하면 드래그 상태가 지속됨
- 요소를 클릭하면 마우스를 따라다니는 현상 발생

**시도한 해결 방법:**
1. **이벤트 전파 차단**: `e.stopPropagation()` 추가 → 실패
2. **전역 플래그 방식**: `globalImageResizing` 변수로 상태 추적 → 부분적 개선, 완전 해결 안 됨
3. **이벤트 리스너 순서 조정**: mouseup 이벤트 cleanup 순서 변경 → 효과 없음

**근본 원인:**
- ResizableImage의 mouseup 이벤트가 완료된 후에도 캔버스의 드래그 상태(`draggingState`, `selectionBox` 등)가 리셋되지 않음
- 전역 플래그만으로는 이미 시작된 드래그 상태를 중단시킬 수 없음

**최종 해결 방법:**
```typescript
// 1. ResizableImage.tsx - mouseup 시 즉시 커스텀 이벤트 발송
const handleMouseUp = (upEvent: MouseEvent) => {
  // Remove event listeners first
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);

  // Immediately dispatch event (not in setTimeout)
  window.dispatchEvent(new CustomEvent('imageResizeComplete'));
  
  // Then update local state
  resizingRef.current = false;
  setIsResizing(false);
  
  // Clear global flag with minimal delay
  setTimeout(() => {
    globalImageResizing = false;
  }, 50);
};

// 2. useCanvasInteraction.ts - 이벤트 감지하여 모든 상태 리셋
useEffect(() => {
  const handleImageResizeComplete = () => {
    setDraggingState(null);
    setSelectionBox(null);
    setResizingState(null);
    setPanningState(null);
    setConnectingState(null);
  };
  window.addEventListener('imageResizeComplete', handleImageResizeComplete);
  return () => {
    window.removeEventListener('imageResizeComplete', handleImageResizeComplete);
  };
}, []);

// 3. handleMouseMove에서도 즉시 체크하여 드래그 중단
const handleMouseMove = useCallback((e: MouseEvent) => {
  if (isImageResizing()) {
    setDraggingState(null);
    setSelectionBox(null);
    // ... 모든 상태 리셋
    return;
  }
  // ... 기존 로직
}, []);
```

**적용:**
- `extensions/ResizableImage.tsx`: mouseup 즉시 이벤트 발송 (setTimeout 제거)
- `hooks/useCanvasInteraction.ts`: 
  - 커스텀 이벤트 리스너로 상태 리셋
  - handleMouseMove에서도 즉시 체크하여 드래그 중단

**효과:** 
- 이미지 리사이징 후 캔버스 드래그 상태가 완전히 리셋됨
- 요소가 마우스를 따라다니는 문제 완전 해결

**교훈:**
- 복잡한 상호작용이 있는 경우 커스텀 이벤트를 통한 명시적 상태 동기화가 효과적
- 전역 플래그만으로는 이미 시작된 상태를 제어하기 어려움

---

### ✅ 해결: 파일 업로드 이미지 문제

**증상:**
1. 파일로 추가한 이미지가 다른 곳 클릭시 사라짐
2. 이미지 정렬(align)이 적용되지 않음

**원인 분석:**
1. **이미지 사라짐**: `EditorToolbar.tsx`의 파일 업로드 핸들러에서 `editor.chain().focus()`를 호출하면서 선택이 해제되고 커서가 이동하여 이미지가 사라짐
2. **정렬 안됨**: `ResizableImage.tsx`의 NodeViewWrapper에서 `display: flex, justifyContent`를 사용했지만, block 레벨 정렬에는 `textAlign`이 더 적합함

**해결 방법:**

EditorToolbar.tsx 수정:
```typescript
// Before (문제):
editor.chain().focus().insertContentAt(...)  // focus()가 선택 해제
editor.chain().focus().setImage(...)

// After (해결):
editor.chain().insertContentAt(...)  // focus() 제거
editor.chain().setImage(...)
```

ResizableImage.tsx 수정:
```typescript
// Before (문제):
const alignmentStyle =
  align === "center"
    ? { display: "flex", justifyContent: "center" }
    : align === "right"
    ? { display: "flex", justifyContent: "flex-end" }
    : {};

// After (해결):
const containerStyle: React.CSSProperties = {
  pointerEvents: isResizing ? "none" : "auto",
};

if (align === "center") {
  containerStyle.textAlign = "center";
} else if (align === "right") {
  containerStyle.textAlign = "right";
} else {
  containerStyle.textAlign = "left";
}
```

TextSelectionToolbar.tsx 수정:
```typescript
// Before (문제):
editor.chain().focus().updateAttributes("image", { align }).run();
// focus()가 선택을 해제하여 updateAttributes가 작동하지 않음

// After (해결):
editor.chain().updateAttributes("image", { align }).run();
// focus() 제거하고 queueMicrotask 제거
```

**변경 파일:**
- `components/EditorToolbar.tsx`: 파일 업로드 및 URL 입력 시 `.focus()` 제거
- `extensions/ResizableImage.tsx`: `textAlign` 기반 정렬 스타일 적용
- `components/TextSelectionToolbar.tsx`: 이미지 정렬 변경 시 `.focus()` 제거

**교훈:**
- Tiptap에서 `.focus()`는 선택 상태를 변경하므로 이미지 삽입 직후 호출하면 안 됨
- Block 레벨 요소 정렬에는 `textAlign`이 `flexbox`보다 안정적
- **커스텀 커맨드의 타입 정의에 모든 필요한 속성을 포함해야 함**

---

### ✅ 해결: URL 이미지 정렬 문제 (최종)

**증상:**
- 파일 업로드 이미지는 정렬이 정상 작동
- URL로 추가한 이미지만 정렬 버튼 클릭해도 적용 안 됨
- 디버깅 로그 확인 결과 `updateAttributes`는 정상 호출되지만 시각적 변화 없음

**원인:**
1. **타입 정의 누락**: `ResizableImage.tsx`의 `setImage` 커맨드 타입에 `align` 속성이 빠져있음
2. **CSS 문제**: `textAlign`이 `inline-block`과 함께 사용할 때 제한적

**해결 방법:**

ResizableImage.tsx - setImage 커맨드 타입 수정:
```typescript
// Before (문제):
setImage: (options: {
  src: string;
  alt?: string;
  title?: string;
  width?: number;
}) => ...

// After (해결):
setImage: (options: {
  src: string;
  alt?: string;
  title?: string;
  width?: number;
  align?: "left" | "center" | "right";  // ✅ 추가
}) => ...
```

ResizableImage.tsx - CSS 스타일 개선:
```typescript
// Before (문제):
containerStyle.textAlign = "center"; // inline-block과 호환 문제

// After (해결):
containerStyle.display = "flex";
containerStyle.justifyContent = "center"; // flexbox로 확실한 정렬
```

**변경 파일:**
- `extensions/ResizableImage.tsx`: 
  - `setImage` 커맨드에 `align` 타입 추가
  - `textAlign` → `flexbox justifyContent`로 변경

**교훈:**
- **커스텀 Tiptap 커맨드를 만들 때 타입 정의가 실제 사용될 속성을 모두 포함해야 함**
- TypeScript의 `as any`는 타입 체크를 우회하므로 조심해서 사용
- 파일 업로드는 `insertContentAt`으로 직접 attrs 전달, URL은 `setImage` 커맨드 사용 - 두 방식의 차이 이해 필요

---

### 🐛 버그 #2: 파일 업로드 이미지 정렬 문제

**증상:**
- URL로 추가한 이미지: 정렬 버튼 정상 작동
- 파일로 추가한 이미지: 정렬 버튼 클릭 시 약간의 움직임만 있고 제대로 정렬되지 않음

**분석:**
- URL 이미지와 파일 업로드 이미지의 DOM 구조 또는 속성에 차이가 있을 가능성
- Tiptap `updateAttributes`가 base64 이미지에서 제대로 동작하지 않을 수 있음

**현재 상태:** 미해결
**다음 시도 방향:**
- 두 타입의 이미지 노드 속성 비교 (개발자 도구에서 확인)
- `setNodeSelection` 후 노드가 제대로 선택되는지 확인
- `updateAttributes({ align: 'center' })`가 base64 src에서도 동작하는지 테스트
- 필요 시 `setImage` 명령 직접 호출하여 재설정

**관련 파일:**
- `extensions/ResizableImage.tsx`
- `components/TextSelectionToolbar.tsx`
- `components/EditorToolbar.tsx`

---

## 2025-01-06

### ✅ 해결: AI Features API Key 에러

**증상:**
```
TypeError: Cannot read properties of undefined (reading 'openSelectKey')
```

**원인:**
- `window.aistudio` 객체가 일반 웹 환경에서 undefined
- 크롬 확장 프로그램 전용 API를 일반 웹에서 호출 시도

**해결 방법:**
```typescript
// Before
if (apiKeyError || !(await window.aistudio.hasSelectedApiKey())) {
    await window.aistudio.openSelectKey();
}

// After
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    throw new Error("GEMINI_API_KEY 환경변수가 설정되지 않았습니다.");
}
return new GoogleGenAI({ apiKey });
```

**적용:**
- 크롬 확장 프로그램 스토리지 로직 제거
- `.env.local` 환경변수 기반으로 단순화
- `GEMINI_API_KEY` 환경변수 사용

**관련 커밋:** feat: Gemini API 키 환경변수 기반 관리

---

### ✅ 해결: flushSync 경고

**증상:**
```
Warning: flushSync was called from inside a lifecycle method.
```

**원인:**
- React 렌더링 사이클 내부에서 `editor.commands.focus()` 및 `setNodeSelection()` 호출
- Tiptap의 동기적 상태 업데이트가 React 렌더링과 충돌

**해결 방법:**
```typescript
// Before
editor.commands.focus('end');
editor.chain().focus().setNodeSelection(pos).run();

// After
queueMicrotask(() => {
    editor.commands.focus('end');
});
queueMicrotask(() => {
    editor.chain().focus().setNodeSelection(pos).run();
});
```

**적용 위치:**
- `components/CanvasItemComponent.tsx`: 편집 모드 전환 시
- `extensions/ResizableImage.tsx`: 이미지 클릭 선택 시

**효과:** 모든 flushSync 경고 제거, 부드러운 렌더링

---

### ✅ 해결: 텍스트 에디터 위 휠 스크롤 시 캔버스 줌 발생

**증상:**
- 텍스트 편집 중 스크롤하려고 마우스 휠을 사용하면 캔버스가 줌됨

**원인:**
- 텍스트 에디터의 wheel 이벤트가 캔버스 레벨까지 전파됨

**해결 방법:**
```typescript
const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // Always prevent zoom in text editor areas
    if (isTextualItem) {
        e.stopPropagation();
        return;
    }
    // ... 기존 스크롤 가능 여부 체크
};
```

**적용:** `components/CanvasItemComponent.tsx`
**효과:** 텍스트 에디터에서 자연스러운 스크롤 경험 제공

---

### ✅ 해결: 투명도 조정 시 텍스트도 투명해지는 문제

**증상:**
- DetailsPanel에서 opacity 조정 시 배경과 텍스트 모두 투명해짐

**원인:**
- opacity가 아이템 전체 컨테이너에 적용됨

**해결 방법:**
```tsx
// 배경 레이어와 텍스트 레이어 분리
<div style={{ opacity: item.opacity ?? 1 }} className="absolute inset-0">
    {/* 배경만 여기 */}
</div>
<div className="relative z-10">
    {/* 텍스트는 투명도 영향 없음 */}
</div>
```

**적용:** `components/CanvasItemComponent.tsx`
**효과:** 배경만 투명하게 조정 가능

---

### ✅ 해결: 이미지 리사이징 줌 레벨 대응

**증상:**
- 캔버스 줌 레벨이 100%가 아닐 때 이미지 리사이징 시 마우스 포인터와 크기가 일치하지 않음

**원인:**
- 리사이징 계산에서 캔버스 scale을 고려하지 않음

**해결 방법:**
```typescript
// DOM transform matrix에서 scale 추출
const getCanvasScale = (): number => {
    let el = imgRef.current;
    while (el) {
        const transform = window.getComputedStyle(el).transform;
        if (transform && transform !== 'none') {
            const matrix = new DOMMatrixReadOnly(transform);
            return matrix.a; // scaleX
        }
        el = el.parentElement;
    }
    return 1;
};

// 리사이징 시 scale 적용
const canvasScale = getCanvasScale();
const scaledDelta = deltaX / canvasScale;
```

**적용:** `extensions/ResizableImage.tsx`
**효과:** 모든 줌 레벨에서 정확한 리사이징

---

## 최적화 패턴

### 🎯 패턴 #1: React 렌더링 사이클 외부 비동기 작업

**사용 시점:** 
- Tiptap 에디터 상태 변경 (focus, selection)
- 외부 라이브러리 동기 업데이트가 React와 충돌할 때

**방법:**
```typescript
queueMicrotask(() => {
    // React 렌더링 완료 후 실행될 작업
    editor.commands.focus();
});
```

**장점:** flushSync 경고 방지, 부드러운 렌더링

---

### 🎯 패턴 #2: 이벤트 전파 제어

**사용 시점:**
- 중첩된 인터랙티브 요소 (에디터 내 이미지, 캔버스 내 아이템)
- 부모 요소의 이벤트를 차단해야 할 때

**방법:**
```typescript
const handleEvent = (e: React.MouseEvent) => {
    e.stopPropagation(); // 부모로 전파 차단
    e.preventDefault();  // 기본 동작 차단
    // ... 로직
};
```

**주의사항:** 과도한 차단은 예상치 못한 동작 유발 가능

---

### 🎯 패턴 #3: 환경변수 기반 설정

**사용 시점:**
- API 키, 비밀 정보 관리
- 환경별 설정 (dev/prod)

**방법:**
```typescript
// .env.local
GEMINI_API_KEY=your_key_here

// 코드
const apiKey = process.env.GEMINI_API_KEY;
```

**장점:** 
- 보안 강화 (git에 커밋되지 않음)
- 환경별 독립적 설정

---

## 트러블슈팅 체크리스트

### 이벤트 관련 문제
- [ ] 이벤트 전파 순서 확인 (부모 → 자식 또는 반대)
- [ ] `stopPropagation()` 및 `preventDefault()` 위치 확인
- [ ] 이벤트 리스너 등록/제거 타이밍 확인
- [ ] passive 이벤트 리스너 옵션 확인

### React 렌더링 문제
- [ ] `queueMicrotask` 사용 여부 확인
- [ ] useEffect 의존성 배열 확인
- [ ] 불필요한 리렌더링 방지 (React.memo, useMemo, useCallback)
- [ ] 상태 업데이트 배치 처리 확인

### Tiptap 관련 문제
- [ ] 에디터 상태 동기화 확인
- [ ] Node 속성 업데이트 방식 확인 (updateAttributes vs setContent)
- [ ] NodeView 생명주기 확인
- [ ] 커스텀 확장 프로그램 명령어 등록 확인

### 환경 설정 문제
- [ ] `.env.local` 파일 존재 및 형식 확인
- [ ] 서버 재시작 여부 확인
- [ ] 환경변수 이름 오타 확인
- [ ] Vite 환경변수 prefix 확인 (VITE_ 불필요, process.env 직접 사용)

---

## 참고 링크

- [Tiptap 공식 문서](https://tiptap.dev/)
- [React 18 마이그레이션 가이드](https://react.dev/blog/2022/03/29/react-v18)
- [Gemini API 문서](https://ai.google.dev/docs)
