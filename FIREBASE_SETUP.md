# Firebase 설정 가이드

## Firebase Realtime Database 보안 규칙 설정

Firebase Console에서 다음 보안 규칙을 설정해야 합니다:

### 1. Firebase Console 접속
https://console.firebase.google.com/

### 2. 프로젝트 선택
- content-pilot-7eb03 프로젝트 선택

### 3. Realtime Database 보안 규칙 설정
- 왼쪽 메뉴에서 "Realtime Database" 선택
- "규칙" 탭 클릭
- **⚠️ 중요: 기존 규칙을 유지하면서 canvases 경로만 추가**

**올바른 설정 (다른 프로그램과 공유하는 경우):**
```json
{
  "rules": {
    ".read": "now < 1767241200000",
    ".write": "now < 1767241200000",
    "canvases": {
      ".read": true,
      ".write": true,
      "$canvasId": {
        ".validate": "newData.hasChildren(['title', 'category', 'items', 'connectors', 'createdAt', 'updatedAt'])"
      }
    }
  }
}
```

**설명:**
- **루트 레벨 타임스탬프 제한**: 다른 프로그램을 위한 기본 보안 (2026년 1월 1일까지)
- **canvases 경로**: 이 Visual Canvas Board 전용 경로로 항상 접근 허용
- Firebase는 **더 구체적인 경로의 규칙이 우선**하므로 `canvases` 경로는 시간 제한 없이 접근 가능

**❌ 잘못된 설정 (canvases 경로 없음):**
```json
{
  "rules": {
    ".read": "now < 1767241200000",
    ".write": "now < 1767241200000"
    // canvases 경로가 없어서 Visual Canvas Board가 작동 안 함
  }
}
```

**✅ 올바른 설정 (위의 규칙 사용):**
```json
{
  "rules": {
    ".read": "now < 1767241200000",
    ".write": "now < 1767241200000",
    "canvases": {  // ← 이 부분 추가!
      ".read": true,
      ".write": true
    }
  }
}
```

**Firebase 보안 규칙 우선순위:**
Firebase는 **하위 경로의 규칙이 상위 경로보다 우선**합니다.
- 루트(`/`): 타임스탬프 제한 (다른 프로그램용)
- `canvases/`: 항상 허용 (Visual Canvas Board 전용)
- 두 규칙이 충돌하지 않고 각자의 경로에서 독립적으로 작동

### 4. "게시" 버튼 클릭

## 테스트 방법

1. 브라우저에서 `http://localhost:3004/saved` 접속
2. "🧪 테스트 저장" 버튼 클릭
3. 콘솔 로그 확인:
   - ✅ Firebase 저장 완료!
   - 📦 저장된 캔버스: 1 개
4. 페이지에 테스트 캔버스 카드가 표시되는지 확인

## 보안 규칙 설명

- **읽기 권한 (`.read: true`)**: 모든 사용자가 캔버스 목록을 볼 수 있음
- **쓰기 권한 (`.write: true`)**: 모든 사용자가 캔버스를 저장/수정/삭제할 수 있음
- **유효성 검사**: 필수 필드(title, category, items, connectors, createdAt, updatedAt) 확인

## 프로덕션 환경 권장 사항

실제 배포 시에는 다음과 같이 인증을 추가하는 것을 권장합니다:

```json
{
  "rules": {
    "canvases": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$canvasId": {
        ".validate": "newData.hasChildren(['title', 'category', 'items', 'connectors', 'createdAt', 'updatedAt'])"
      }
    }
  }
}
```

이렇게 하면 인증된 사용자만 데이터를 읽고 쓸 수 있습니다.

## 디버깅

콘솔에서 다음 로그를 확인하세요:

- `🔥 Firebase 연결 시작...`
- `📍 Database URL: https://...`
- `📂 참조 경로: ...`
- `📊 Firebase 데이터 수신: true/false`

데이터 수신이 false이면 보안 규칙을 확인하세요.
