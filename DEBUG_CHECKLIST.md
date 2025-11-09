# 연결 업데이트 디버깅 체크리스트

## 1단계: 버튼 활성화 확인

- [ ] 초안 텍스트 항목 **하나만** 선택했는가?
- [ ] 연결선이 그려져 있는가?
- [ ] 왼쪽 툴바의 AI 버튼(✨) 클릭
- [ ] "연결 기반 업데이트" 버튼이 **활성화**(컬러)되어 있는가?

## 2단계: 연결 상태 확인

브라우저 개발자 도구(F12) → Console 탭에서:

```javascript
// 콘솔에 직접 입력하여 확인
const selectedItem = document.querySelector('[data-selected="true"]');
console.log("선택된 항목:", selectedItem);
```

## 3단계: 연결 업데이트 실행 후 로그 확인

### 기대되는 로그 순서:

1. **그룹 연결 감지**

```
[그룹 연결 감지] groupId: xxx, N개 항목
```

2. **그룹 이미지 수집**

```
[그룹 발견] N개 이미지 수집 시작
[그룹 이미지 수집] 인덱스 0: xxx
[그룹 이미지 수집] 인덱스 1: xxx
```

3. **연결 정보 요약**

```
[연결 수집] 총 1개 항목, N개 이미지
[연결 정보] [...]
```

4. **키워드 분석**

```
[연결 업데이트] 이미지 개수: N, 선택 키워드: true, 생성 키워드: false
```

5. **AI 응답**

```
[연결 업데이트] AI 응답 (처음 200자): ...
[연결 업데이트] JSON 파싱 결과: 성공
[연결 업데이트] selectedImages: N
```

## 4단계: 문제별 해결 방법

### Case 1: 버튼이 비활성화됨

- **원인**: 연결선이 제대로 그려지지 않음
- **해결**:
  1. 초안 텍스트 항목 선택
  2. 연결 핸들(작은 원)을 그룹 박스의 파란색 테두리로 드래그
  3. 라벨 입력: "가장 어울리는 이미지를 찾아서 넣어줘"

### Case 2: 이미지 개수: 0

- **원인**: 그룹 연결이 감지되지 않음
- **로그 확인**: `[그룹 연결 감지]` 로그가 있는가?
- **해결**:
  - 그룹 박스 자체에 연결했는지 확인
  - 그룹 내 개별 항목이 아닌 **그룹 테두리**에 연결

### Case 3: 선택 키워드: false

- **원인**: 연결 라벨이 없거나 키워드가 없음
- **해결**:
  - 연결선 더블클릭
  - "골라", "선택", "찾아", "어울리는" 등의 키워드 포함

### Case 4: JSON 파싱 실패

- **원인**: AI가 마크다운으로 응답
- **확인**: AI 응답 내용 확인
- **해결**: 이미지가 없거나 라벨이 명확하지 않음

## 5단계: 수동 디버깅

콘솔에 다음 코드를 붙여넣어 상태 확인:

```javascript
// 현재 상태 출력
const state = {
  selectedItemIds: window.__CANVAS_STATE?.selectedItemIds,
  items: window.__CANVAS_STATE?.items,
  connectors: window.__CANVAS_STATE?.connectors,
};

console.log("=== 캔버스 상태 ===");
console.log("선택된 항목 ID:", state.selectedItemIds);

if (state.selectedItemIds?.length === 1) {
  const selectedItem = state.items?.find(
    (i) => i.id === state.selectedItemIds[0]
  );
  console.log("선택된 항목:", selectedItem);

  const connections = state.connectors?.filter(
    (c) => c.fromId === selectedItem?.id || c.toId === selectedItem?.id
  );
  console.log("연결선:", connections);

  connections?.forEach((conn) => {
    const connectedId =
      conn.fromId === selectedItem.id ? conn.toId : conn.fromId;
    const connectedItem = state.items?.find((i) => i.id === connectedId);
    const groupItems = state.items?.filter((i) => i.groupId === connectedId);

    console.log("연결된 ID:", connectedId);
    console.log("연결된 항목:", connectedItem);
    console.log("그룹 항목들:", groupItems);
    console.log("라벨:", conn.label);
  });
}
```

## 6단계: 결과 보고

위 체크리스트를 따라 확인 후, 다음 정보를 제공해주세요:

1. **어느 단계에서 문제가 발생했는가?**
2. **콘솔 로그 전체 복사**
3. **스크린샷** (연결 상태, 버튼 상태)
