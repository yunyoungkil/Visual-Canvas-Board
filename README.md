# 비주얼 캔버스 보드 (Visual Canvas Board)

## 소개

사용자가 이미지를 드래그 앤 드롭하고, 자유롭게 이동하며, 그룹화하고, 시각적 정리 및 마인드맵을 위해 이미지 간의 연결을 생성할 수 있는 대화형 캔버스 애플리케이션입니다. Gemini AI와의 통합을 통해 콘텐츠 기획, 초안 작성, 미디어 생성 등 창의적인 작업을 강력하게 지원합니다.

## 주요 기능

- **자유로운 캔버스:** 무한한 캔버스 공간에서 텍스트, 이미지, 도형을 자유롭게 배치, 크기 조절, 연결 및 그룹화할 수 있습니다.
- **리치 텍스트 에디터:** Tiptap 기반의 강력한 텍스트 편집 기능 (볼드, 이탤릭, 헤딩, 목록, 링크 등)
- **이미지 리사이징:** 드래그로 이미지 크기를 직관적으로 조절할 수 있는 인터랙티브 기능
- **AI 콘텐츠 생성:** 주제나 키워드만으로 블로그 포스트, 소셜 미디어 게시물, 아이디어 아웃라인 등을 생성합니다.
- **AI 콘텐츠 편집:** AI를 통해 기존 텍스트를 요약, 확장, 다듬기, 문체 변경 등을 수행합니다.
- **AI 미디어 생성:** 텍스트 프롬프트, 또는 캔버스 위의 콘텐츠를 기반으로 고품질 이미지와 동영상을 생성하고 편집합니다.
- **AI 기반 분석:** 캔버스 전체 내용을 분석하여 새로운 아이디어를 제안하거나, 키워드 분석을 통해 콘텐츠 전략 수립을 돕습니다.
- **AI 챗 어시스턴트:** 대화형 인터페이스를 통해 캔버스 작업을 자동화하고 질문에 대한 답변을 얻을 수 있습니다.

더 상세한 기능 목록은 `FEATURES.md` 파일을 참고해 주세요.

## 기술 스택

- **프론트엔드:** React 18.3.1, TypeScript 5.8.2, Tailwind CSS
- **빌드 도구:** Vite 6.2.0
- **텍스트 에디터:** Tiptap 2.10.3 (ProseMirror 기반)
- **AI:** Google Gemini API (`@google/genai` SDK)
- **데이터 저장:** Local Storage

## 최근 업데이트

### v2.2.0 (2025-01-08) - AI 응답 가독성 대폭 개선

- **마크다운 렌더링 품질 향상:** AI 생성 텍스트의 단락, 제목, 리스트, 인용문, 코드 블록 등 모든 요소에 적절한 여백 및 줄간격 추가
- **textToHtml 함수 최적화:** 마크다운 → HTML 변환 로직 개선, 폴백 처리 강화
- **CSS 스타일 시스템 개선:** Tiptap 에디터의 모든 요소에 일관된 스타일 적용
- **사용자 경험 향상:** AI 응답의 줄바꿈과 단락 구분이 명확하게 표시되어 읽기 편해짐

### v2.1.0 (2025-01-07) - 이미지 정렬 기능 추가

- 텍스트 에디터 내 이미지 왼쪽/중앙/오른쪽 정렬 기능
- URL 및 파일 업로드 방식 이미지 삽입 개선
- 텍스트 박스 리사이징 시 이미지 보존 문제 해결
- 툴바 위치 정확도 및 겹침 문제 해결

### v2.0.0 (2025-01-06) - React 18 + Tiptap 마이그레이션

- React 19에서 React 18.3.1로 다운그레이드하여 Tiptap 호환성 확보
- Tiptap 2.4.0에서 2.10.3으로 업그레이드
- 모든 의존성 충돌 해결 및 안정화
- 커스텀 이미지 리사이징 기능 구현 (8방향 드래그 핸들)
- flushSync 경고 해결 및 성능 개선

자세한 변경 사항은 `CHANGELOG.md`를 참고해주세요.

## 설치 및 실행 방법

### 1. 사전 요구사항

- **Node.js**: v18.0.0 이상 권장
- **npm**: v9.0.0 이상 또는 **yarn**: v1.22.0 이상
- **Gemini API 키**: [Google AI Studio](https://aistudio.google.com/apikey)에서 발급

### 2. 프로젝트 클론

```bash
git clone https://github.com/yunyoungkil/Visual-Canvas-Board.git
cd Visual-Canvas-Board
```

### 3. 의존성 설치

```bash
npm install
```

> **참고**: 이 프로젝트는 React 18.3.1과 Tiptap 2.10.3을 사용합니다. React 19는 Tiptap과 호환되지 않으므로 React 18을 사용해야 합니다.

### 4. 환경 변수 설정

프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 Gemini API 키를 설정합니다:

```bash
# .env.example 파일을 복사하여 .env 파일 생성
cp .env.example .env
```

`.env` 파일을 열고 API 키를 입력합니다:

```env
GEMINI_API_KEY=your_actual_api_key_here
```

> **API 키 발급 방법**:
>
> 1. [Google AI Studio](https://aistudio.google.com/apikey)에 접속
> 2. Google 계정으로 로그인
> 3. "Create API Key" 버튼 클릭
> 4. 생성된 API 키를 복사하여 `.env` 파일에 붙여넣기

> **중요**: `.env` 파일은 Git에 커밋되지 않습니다. API 키는 절대 공개 저장소에 업로드하지 마세요.

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3002` 로 접속하면 애플리케이션이 실행됩니다.

### 6. 프로덕션 빌드

```bash
npm run build
npm run preview
```

## API 관리

### API 클라이언트 구조

프로젝트는 체계적인 API 관리를 위해 전용 유틸리티 파일을 제공합니다:

#### `utils/apiClient.ts`

Gemini API와의 통신을 관리하는 핵심 파일입니다.

**주요 기능:**

1. **API 키 검증**

   ```typescript
   import { validateApiKey, hasApiKey } from "./utils/apiClient";

   // API 키 존재 여부 확인
   const exists = hasApiKey();

   // API 키 유효성 검증
   const result = await validateApiKey();
   if (!result.isValid) {
     console.error(result.error?.message);
   }
   ```

2. **클라이언트 생성**

   ```typescript
   import { createGeminiClient } from "./utils/apiClient";

   // Gemini AI 클라이언트 인스턴스 생성
   const client = await createGeminiClient();
   ```

3. **에러 처리**

   ```typescript
   import { withApiErrorHandling, parseApiError } from "./utils/apiClient";

   // API 호출을 래핑하여 자동 에러 처리
   const result = await withApiErrorHandling(
     async () => {
       // API 호출 로직
     },
     (error) => {
       console.error("API 에러:", error.message);
     }
   );
   ```

4. **모델 상수**

   ```typescript
   import { GEMINI_MODELS } from "./utils/apiClient";

   // 사용 가능한 모델:
   // - GEMINI_MODELS.FLASH: 빠른 텍스트 생성 (gemini-2.5-flash)
   // - GEMINI_MODELS.PRO: 고품질 텍스트 생성 (gemini-2.5-pro)
   // - GEMINI_MODELS.IMAGEN: 이미지 생성 (imagen-4.0-generate-001)
   // - GEMINI_MODELS.VEO: 비디오 생성 (veo-3.1-fast-generate-preview)
   // - GEMINI_MODELS.FLASH_IMAGE: 멀티모달 (gemini-2.5-flash-image)

   const model = client.getGenerativeModel({
     model: GEMINI_MODELS.FLASH,
   });
   ```

5. **API 설정 상수**

   ```typescript
   import { API_CONFIG } from "./utils/apiClient";

   // 생성 온도 설정
   // - API_CONFIG.TEMPERATURE.CONSERVATIVE (0.4): 일관적인 결과
   // - API_CONFIG.TEMPERATURE.BALANCED (0.7): 균형잡힌 결과
   // - API_CONFIG.TEMPERATURE.CREATIVE (1.0): 창의적인 결과

   // 최대 토큰 수
   // - API_CONFIG.MAX_TOKENS.SHORT (512)
   // - API_CONFIG.MAX_TOKENS.MEDIUM (2048)
   // - API_CONFIG.MAX_TOKENS.LONG (8192)
   ```

### API 에러 타입

API 호출 중 발생할 수 있는 에러 타입:

- **NOT_FOUND**: API 키가 설정되지 않음
- **INVALID**: API 키가 유효하지 않거나 찾을 수 없음
- **BILLING_REQUIRED**: 결제 설정이 필요한 API (예: Imagen)
- **UNKNOWN**: 알 수 없는 에러

### 환경 변수 파일

- **`.env`**: 실제 API 키를 저장하는 파일 (Git에 커밋되지 않음)
- **`.env.example`**: API 키 입력 템플릿 (Git에 포함됨)

### API 사용 예제

```typescript
import {
  createGeminiClient,
  GEMINI_MODELS,
  API_CONFIG,
  withApiErrorHandling,
} from "./utils/apiClient";

async function generateContent(prompt: string) {
  return await withApiErrorHandling(
    async () => {
      const client = await createGeminiClient();
      const model = client.getGenerativeModel({
        model: GEMINI_MODELS.FLASH,
      });

      const result = await model.generateContent({
        contents: [{ parts: [{ text: prompt }], role: "user" }],
        generationConfig: {
          temperature: API_CONFIG.TEMPERATURE.BALANCED,
          maxOutputTokens: API_CONFIG.MAX_TOKENS.MEDIUM,
        },
      });

      return result.response.text();
    },
    (error) => {
      console.error("콘텐츠 생성 실패:", error.message);
    }
  );
}
```

## 프로젝트 구조

```
Visual-Canvas-Board/
├── components/          # React 컴포넌트
│   ├── AiChatAssistant.tsx
│   ├── CanvasItemComponent.tsx
│   ├── DetailsPanel.tsx
│   └── ...
├── extensions/          # Tiptap 커스텀 확장
│   ├── ResizableImage.tsx
│   └── SelectableHorizontalRule.tsx
├── hooks/               # 커스텀 React 훅
│   ├── useAIFeatures.ts
│   ├── useCanvasInteraction.ts
│   └── useCanvasState.ts
├── utils/               # 유틸리티 함수
│   └── apiClient.ts     # API 관리 (NEW)
├── App.tsx              # 메인 애플리케이션
├── types.ts             # TypeScript 타입 정의
├── constants.ts         # 상수 정의
├── vite.config.ts       # Vite 빌드 설정
├── .env                 # 환경 변수 (Git 미포함)
└── .env.example         # 환경 변수 템플릿
```

## 트러블슈팅

### API 키 관련 문제

**문제**: "GEMINI_API_KEY 환경변수가 설정되지 않았습니다" 오류 발생

**해결 방법**:

1. 프로젝트 루트에 `.env` 파일이 있는지 확인
2. `.env` 파일에 `GEMINI_API_KEY=your_key_here` 형식으로 API 키 입력
3. 개발 서버를 재시작 (`Ctrl+C` 후 `npm run dev`)

---

**문제**: "API 키가 유효하지 않거나 찾을 수 없습니다" 오류 발생

**해결 방법**:

1. [Google AI Studio](https://aistudio.google.com/apikey)에서 새로운 API 키 생성
2. API 키가 올바르게 복사되었는지 확인 (공백이나 줄바꿈이 없어야 함)
3. API 키는 일반적으로 'AI'로 시작합니다

---

**문제**: "Imagen API는 현재 결제가 설정된 사용자만 이용할 수 있습니다" 오류 발생

**해결 방법**:

1. Google Cloud Console에서 결제 계정 설정
2. 또는 이미지 생성 기능 대신 텍스트 생성 기능만 사용

### React/Tiptap 관련 문제

**문제**: "flushSync" 경고 발생

**해결 방법**:

- 이미 해결된 문제입니다. 최신 버전을 사용하고 있는지 확인하세요.
- `ResizableImage.tsx`에서 `queueMicrotask()`를 사용하여 해결됨

---

**문제**: Tiptap 에디터가 작동하지 않음

**해결 방법**:

1. React 버전이 18.3.1인지 확인: `npm list react`
2. Tiptap 버전이 2.10.3인지 확인: `npm list @tiptap/react`
3. `package-lock.json` 삭제 후 재설치:
   ```bash
   rm package-lock.json
   rm -rf node_modules
   npm install
   ```

### 빌드 관련 문제

**문제**: 빌드 시 TypeScript 오류 발생

**해결 방법**:

```bash
# TypeScript 캐시 삭제
rm -rf node_modules/.vite
npm run build
```

## 기여하기

기여를 환영합니다! 다음 단계를 따라주세요:

1. 이 저장소를 포크합니다
2. 새로운 브랜치를 생성합니다 (`git checkout -b feature/AmazingFeature`)
3. 변경 사항을 커밋합니다 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/AmazingFeature`)
5. Pull Request를 생성합니다

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 문서

- **FEATURES.md**: 전체 기능 목록
- **ARCHITECTURE.md**: 아키텍처 설명
- **CHANGELOG.md**: 변경 이력
- **MIGRATION_TO_REACT18_TIPTAP.md**: React 18 + Tiptap 마이그레이션 가이드
- **RECOMMENDATIONS.md**: 개선 권장사항

## 연락처

프로젝트 관련 문의: [GitHub Issues](https://github.com/yunyoungkil/Visual-Canvas-Board/issues)

---

**Visual Canvas Board** - AI 기반 창의적 콘텐츠 기획 도구
