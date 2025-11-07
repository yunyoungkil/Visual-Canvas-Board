# 디버깅 & 최적화 일지

프로젝트에서 발생한 에러, 버그, 최적화 과정을 기록합니다.  
문제 해결 방법을 상세히 문서화하여 향후 유사한 문제 발생 시 빠른 대응이 가능합니다.

---

## 2025-01-07 (세션 2)

### ✅ 해결: 이미지 포커스 자동 해제

**증상:**

- 이미지 삽입 후 캔버스의 다른 곳을 클릭해도 이미지 선택(파란 테두리)이 유지됨
- 이미지 정렬 툴바가 계속 표시됨

**원인:**

- 캔버스 클릭 시 Tiptap 에디터의 선택 상태가 해제되지 않음
- `activeEditor`의 선택 상태가 독립적으로 관리되어 캔버스 이벤트와 동기화되지 않음

**해결 방법:**

useCanvasInteraction.ts - activeEditor 전달 및 선택 해제:

```typescript
// 1. 타입 정의에 activeEditor 추가
type CanvasStateAndActions = {
  // ... 기존 필드
  activeEditor?: any; // Tiptap Editor instance
};

// 2. handleCanvasMouseDown에서 에디터 선택 해제
const handleCanvasMouseDown = useCallback(
  (e: React.MouseEvent<HTMLDivElement>) => {
    // ... 기존 체크 로직

    // Clear Tiptap editor selection (e.g., selected images)
    if (activeEditor && !activeEditor.isDestroyed) {
      queueMicrotask(() => {
        try {
          activeEditor.commands.blur();
        } catch (e) {
          // Ignore errors if editor is being destroyed
        }
      });
    }

    // ... 기존 로직
  },
  [activeEditor /* ... */]
);
```

App.tsx - activeEditor 전달:

```typescript
const {
  /* ... */
} = useCanvasInteraction({
  ...canvasStateAndActions,
  selectedItemIds,
  setSelectedItemIds,
  activeEditor, // ✅ 추가
});
```

**변경 파일:**

- `hooks/useCanvasInteraction.ts`: activeEditor 파라미터 추가, blur() 호출
- `App.tsx`: useCanvasInteraction에 activeEditor 전달

**효과:**

- 캔버스 클릭 시 이미지 선택이 자동으로 해제됨
- 사용자 경험 개선

**교훈:**

- 여러 상태 관리 시스템(React state, Tiptap state)을 사용할 때는 명시적 동기화가 필요
- queueMicrotask + try-catch로 안전한 비동기 처리

---

### ✅ 해결: 텍스트 에디터 크기 조절 시 이미지 사라지는 문제

**증상:**

- 파일로 추가한 이미지가 포함된 텍스트 박스의 크기를 조절하면 이미지가 사라짐
- URL로 추가한 이미지도 동일한 문제 발생

**원인 분석:**

```typescript
// CanvasItemComponent.tsx - 문제가 있는 useEffect
useEffect(() => {
  if (!editor || !isTextualItem) return;

  const itemContent = (item as TextItem | ShapeItem).content || "";
  const editorContent = editor.getHTML();

  if (itemContent !== editorContent) {
    editor.commands.setContent(itemContent, false);
  }

  editor.setOptions({
    editorProps: {
      attributes: {
        style: `color: ${item.color}; font-size: ${item.fontSize}px;`,
      },
    },
  });
}, [editor, item, isTextualItem]); // ❌ item 전체가 의존성
```

**문제점:**

- `item` 객체 전체가 의존성 배열에 포함됨
- `item.width`, `item.height` 등 어떤 속성이 변경되어도 useEffect 실행
- `setContent(itemContent, false)`가 호출되어 현재 편집 중인 내용이 덮어씌워짐
- 이미지를 포함한 모든 변경사항이 손실됨

**해결 방법:**

CanvasItemComponent.tsx - useEffect 분리:

```typescript
// 1. Content 동기화 effect - content만 의존
useEffect(() => {
  if (!editor || !isTextualItem) return;

  const itemContent = (item as TextItem | ShapeItem).content || "";
  const editorContent = editor.getHTML();

  // Only update content if it actually differs
  // This prevents losing images when resizing the text box
  if (itemContent !== editorContent) {
    editor.commands.setContent(itemContent, false);
  }
}, [editor, isTextualItem, (item as TextItem | ShapeItem).content]);

// 2. Style 업데이트 effect - item 전체 의존 (style만 업데이트)
useEffect(() => {
  if (!editor || !isTextualItem) return;

  const textItem = item as TextItem | ShapeItem;
  editor.setOptions({
    editorProps: {
      attributes: {
        class: `max-w-none focus:outline-none w-full`,
        style: `color: ${textItem.color}; font-size: ${textItem.fontSize}px;`,
      },
    },
  });
}, [editor, isTextualItem, item]);
```

**핵심 개선:**

1. **Content 동기화**: `(item as TextItem | ShapeItem).content`만 의존하여 content 변경 시에만 실행
2. **Style 업데이트**: 별도 effect로 분리하여 스타일만 변경
3. **리사이징 시**: width, height 변경은 content에 영향 없음 → setContent 호출 안 됨

**변경 파일:**

- `components/CanvasItemComponent.tsx`: useEffect 2개로 분리, 의존성 최적화

**효과:**

- 텍스트 박스 크기 조절 시 이미지 보존
- 불필요한 content 재설정 방지
- 성능 개선 (불필요한 effect 실행 감소)

**교훈:**

- useEffect 의존성 배열에 객체 전체를 넣으면 모든 속성 변경에 반응함
- 관심사의 분리: content 동기화와 style 업데이트는 별도 effect로 관리
- 의존성 배열을 최대한 구체적으로 지정하여 불필요한 실행 방지

---

### ✅ 해결: 툴바 위치 줌 레벨 대응 및 이미지 정렬 툴바 위치 개선

**증상:**

1. 텍스트 에디터 툴바와 이미지 정렬 툴바의 위치가 줌 레벨에 따라 맞지 않음
2. 이미지 정렬 툴바가 이미지 하단에 표시됨 (상단 중앙이 더 직관적)

**원인:**

- 툴바 위치 계산이 이미 `getBoundingClientRect()`를 사용하여 실제로는 줌 레벨이 자동 반영됨
- 하지만 이미지 선택 시 툴바 위치가 업데이트되지 않음
- 이미지 정렬 툴바가 `top + 10px`로 이미지 안쪽에 표시됨

**해결 방법:**

ResizableImage.tsx - 이미지 선택 시 위치 전달:

```typescript
const handleImageClick = useCallback(
  (e: React.MouseEvent) => {
    if (resizingRef.current) return;

    e.preventDefault();
    e.stopPropagation();

    const pos = getPos();
    const img = imgRef.current;

    queueMicrotask(() => {
      editor.chain().focus().setNodeSelection(pos).run();

      // ✅ Update toolbar position to image top center
      if (img) {
        const rect = img.getBoundingClientRect();
        const customEvent = new CustomEvent("imageSelected", {
          detail: {
            top: rect.top,
            left: rect.left + rect.width / 2,
            width: rect.width,
            height: rect.height,
          },
        });
        window.dispatchEvent(customEvent);
      }
    });
  },
  [editor, getPos]
);
```

App.tsx - 이벤트 리스닝 및 위치 업데이트:

```typescript
// Listen for image selection events to update toolbar position
useEffect(() => {
  const handleImageSelected = (e: Event) => {
    const customEvent = e as CustomEvent;
    const { top, left } = customEvent.detail;

    if (tiptapToolbarState) {
      setTiptapToolbarState({
        ...tiptapToolbarState,
        top,
        left,
      });
    }
  };

  window.addEventListener("imageSelected", handleImageSelected);
  return () => window.removeEventListener("imageSelected", handleImageSelected);
}, [tiptapToolbarState]);
```

TextSelectionToolbar.tsx - 이미지 상단 중앙 위치:

```typescript
return (
  <div
    className="fixed bg-white border border-gray-200 rounded-md shadow-lg px-2 py-1 flex items-center gap-1 z-[100000]"
    style={{
      top: `${top - 35}px`, // ✅ 이미지 상단 바로 위
      left: `${left}px`,
      transform: "translateX(-50%)", // 중앙 정렬
    }}
    onMouseDown={(e) => e.preventDefault()}
  >
```

**변경 파일:**

- `extensions/ResizableImage.tsx`: imageSelected 커스텀 이벤트 발송
- `App.tsx`: 이벤트 리스너로 툴바 위치 실시간 업데이트
- `components/TextSelectionToolbar.tsx`: `top - 35px`로 이미지 상단에 표시

**효과:**

- 모든 줌 레벨(30%, 50%, 100%, 200% 등)에서 정확한 툴바 위치
- 이미지 정렬 툴바가 이미지 상단 중앙에 표시되어 직관적
- 이미지 선택 시 실시간으로 툴바 위치 갱신

**기술 세부사항:**

- `getBoundingClientRect()`: 뷰포트 기준 실제 화면 좌표 반환 (scale 자동 반영)
- 커스텀 이벤트: 컴포넌트 간 느슨한 결합으로 위치 정보 전달
- `transform: translateX(-50%)`: CSS로 중앙 정렬

**교훈:**

- `getBoundingClientRect()`는 모든 CSS transform(scale 포함)이 적용된 좌표를 반환
- 커스텀 이벤트로 독립적인 컴포넌트 간 데이터 전달 가능
- UI 피드백은 사용자 행동에 즉각 반응해야 함

---

### ✅ 해결: 텍스트 에디터 툴바와 이미지 정렬 툴바 겹침 문제

**증상:**

- 이미지를 선택하면 텍스트 에디터 툴바(EditorToolbar)와 이미지 정렬 툴바(ImageToolbar)가 동시에 표시됨
- 두 툴바가 겹쳐서 사용하기 불편함

**원인:**

- 두 툴바가 독립적으로 표시 조건을 확인함
- 이미지 선택 상태를 App.tsx에서 관리하지 않아 조건부 렌더링 불가능

**해결 방법:**

TextSelectionToolbar.tsx - 이미지 선택 상태 콜백:

```typescript
interface ImageToolbarProps {
  editor: Editor | null;
  top: number;
  left: number;
  onImageSelectionChange?: (isSelected: boolean) => void; // ✅ 추가
}

const ImageToolbar: React.FC<ImageToolbarProps> = ({
  editor,
  top,
  left,
  onImageSelectionChange, // ✅ 추가
}) => {
  // ...

  const updateSelection = () => {
    const { selection, doc } = editor.state;

    // Check if node selection (like image) is active
    const { node } = selection as any;
    if (node && node.type.name === "image") {
      setIsImageSelected(true);
      setCurrentAlign(node.attrs.align || "left");
      onImageSelectionChange?.(true); // ✅ 부모에게 알림
      return;
    }

    // ... 다른 체크들도 동일하게 onImageSelectionChange 호출

    const isActive = editor.isActive("image");
    setIsImageSelected(isActive);
    onImageSelectionChange?.(isActive); // ✅ 부모에게 알림

    if (!isActive) {
      setCurrentAlign("left");
    }
  };
};
```

App.tsx - 이미지 선택 상태 관리 및 조건부 렌더링:

```typescript
// 1. 상태 추가
const [isImageSelected, setIsImageSelected] = useState(false);

// 2. 조건부 렌더링
{
  tiptapToolbarState?.isVisible &&
    !isImageSelected && ( // ✅ 이미지 선택 시 숨김
      <EditorToolbar
        editor={activeEditor}
        top={tiptapToolbarState.top}
        left={tiptapToolbarState.left}
        style={{ zIndex: 1000 }}
      />
    );
}

{
  tiptapToolbarState && (
    <ImageToolbar
      editor={activeEditor}
      top={tiptapToolbarState.top}
      left={tiptapToolbarState.left}
      onImageSelectionChange={setIsImageSelected} // ✅ 콜백 전달
    />
  );
}
```

**변경 파일:**

- `components/TextSelectionToolbar.tsx`: `onImageSelectionChange` prop 추가, 상태 변경 시 콜백 호출
- `App.tsx`: `isImageSelected` 상태 추가, EditorToolbar 조건부 렌더링

**작동 방식:**

1. **텍스트 편집 시**: `isImageSelected = false` → EditorToolbar만 표시
2. **이미지 선택 시**: `isImageSelected = true` → EditorToolbar 숨김, ImageToolbar만 표시
3. **이미지 선택 해제 시**: `isImageSelected = false` → EditorToolbar 다시 표시

**효과:**

- 두 툴바가 겹치지 않음
- 상황에 맞는 적절한 툴바만 표시되어 UI 깔끔
- 사용자 혼란 감소

**교훈:**

- 여러 UI 요소가 조건부로 표시될 때는 상태를 상위에서 통합 관리
- 콜백 패턴으로 자식 컴포넌트의 상태를 부모로 전달
- 조건부 렌더링으로 상호 배타적인 UI 구현

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
  window.dispatchEvent(new CustomEvent("imageResizeComplete"));

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
  window.addEventListener("imageResizeComplete", handleImageResizeComplete);
  return () => {
    window.removeEventListener(
      "imageResizeComplete",
      handleImageResizeComplete
    );
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
editor.commands.focus("end");
editor.chain().focus().setNodeSelection(pos).run();

// After
queueMicrotask(() => {
  editor.commands.focus("end");
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
    if (transform && transform !== "none") {
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
  e.preventDefault(); // 기본 동작 차단
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
GEMINI_API_KEY = your_key_here;

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
- [ ] Vite 환경변수 prefix 확인 (VITE\_ 불필요, process.env 직접 사용)

---

## 참고 링크

- [Tiptap 공식 문서](https://tiptap.dev/)
- [React 18 마이그레이션 가이드](https://react.dev/blog/2022/03/29/react-v18)
- [Gemini API 문서](https://ai.google.dev/docs)
