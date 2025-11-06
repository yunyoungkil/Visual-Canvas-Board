# 개발 추천 사항 (Technical Recommendations)

이 문서는 프로젝트의 장기적인 건강성과 확장성을 위해 고려해볼 만한 기술적인 아이디어나 리팩토링 제안을 기록하는 '기술 백로그'입니다.

## 1. 상태 관리 라이브러리 도입

- **현재 상태:** 모든 주요 상태가 `App.tsx` 컴포넌트 내에서 `useState`와 `useRef`로 관리되고 있습니다.
- **문제점:** 애플리케이션의 복잡도가 증가함에 따라 `App.tsx`가 비대해지고, 상태 로직이 여러 곳에 흩어져 추적이 어려워질 수 있습니다. 또한, 상태를 하위 컴포넌트로 전달하기 위한 props drilling이 깊어질 수 있습니다.
- **추천:** **Zustand** 또는 **Redux Toolkit**과 같은 경량 상태 관리 라이브러리 도입을 고려해 보세요. 상태 로직을 컴포넌트로부터 분리하여 코드의 모듈성과 테스트 용이성을 높일 수 있습니다.

## 2. `App.tsx` 로직 분리 (커스텀 훅 활용)

- **현재 상태:** `App.tsx`에 캔버스 조작, 아이템 관리, AI 기능 호출 등 대부분의 로직이 집중되어 있습니다.
- **문제점:** 파일이 너무 길고, 단일 책임 원칙에 위배될 수 있습니다. 관련된 로직을 찾고 수정하기가 점점 어려워집니다.
- **추천:** 관련된 로직들을 별도의 커스텀 훅(custom hook)으로 분리하는 리팩토링을 진행하세요. 예를 들면 다음과 같습니다:
    - `useCanvasState.ts`: `items`, `connectors`, `history` 등 핵심 상태와 `commitState`, `undo`, `redo` 로직 포함
    - `useCanvasInteraction.ts`: `handleMouseDown`, `handleMouseMove`, `handleMouseUp` 등 사용자의 직접적인 캔버스 조작 로직 포함
    - `useAIFeatures.ts`: `handleGenerateImage`, `handleGenerateOutline` 등 모든 Gemini API 호출 및 관련 상태 관리 로직 포함

## 3. 비디오 아이템 타입 및 컴포넌트 추가

- **현재 상태:** `veo`를 통해 생성된 비디오는 임시 썸네일 `ImageItem`으로 캔버스에 추가됩니다. 실제 비디오 데이터는 직접적으로 활용되지 않습니다.
- **문제점:** 사용자가 생성된 비디오를 캔버스 내에서 직접 확인하거나 상호작용할 수 없습니다.
- **추천:**
    - `types.ts`에 `VideoItem` 타입을 새로 정의하세요. (`src` 대신 `videoUrl`, `thumbnailUrl` 등의 속성 포함)
    - `VideoItemComponent.tsx`를 새로 생성하여, 비디오 재생 컨트롤(재생/정지, 음소거)을 포함한 UI를 구현하세요.
    - `CanvasItem` 유니온 타입에 `VideoItem`을 추가하고, `CanvasItemComponent`에서 타입을 분기하여 렌더링하도록 수정하세요.
