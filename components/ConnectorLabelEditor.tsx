import React, { useState, useEffect, useRef } from "react";
import type { Point } from "../types";

interface ConnectorLabelEditorProps {
  id: string;
  initialValue: string;
  initialColor: string;
  initialFontSize: number;
  position: Point; // Now in screen coordinates
  angle: number;
  onEndEdit: (
    id: string,
    updates: { text: string; color: string; fontSize: number }
  ) => void;
  onCancel: () => void;
  style?: React.CSSProperties; // Add style prop
}

// 연결 업데이트 기능을 위한 제안 템플릿
const LABEL_SUGGESTIONS = [
  { category: "📝 텍스트 작업 - 기본", items: [
    "요약해줘",
    "확장해줘",
    "더 자세히 설명해줘",
    "간결하게 정리해줘",
  ]},
  { category: "📝 텍스트 작업 - 분량 조절", items: [
    "글자 수를 2배로 늘려줘",
    "글자 수를 절반으로 줄여줘",
    "3문단으로 확장해줘",
    "핵심 3줄로 요약해줘",
  ]},
  { category: "📝 텍스트 작업 - 스타일", items: [
    "전문적인 톤으로 바꿔줘",
    "친근한 말투로 바꿔줘",
    "블로그 스타일로 작성해줘",
    "공식 문서 형식으로 작성해줘",
  ]},
  { category: "🖼️ 이미지 선택 - 기본", items: [
    "어울리는 이미지 골라줘",
    "가장 적합한 이미지 1장 선택해줘",
    "대표 이미지 2장 찾아줘",
    "관련 이미지 3장 골라줘",
  ]},
  { category: "🖼️ 이미지 선택 - 구체적", items: [
    "제목에 어울리는 이미지 골라줘",
    "본문 내용과 매칭되는 이미지 2장 찾아줘",
    "분위기에 맞는 이미지 선택해줘",
    "색상이 조화로운 이미지 골라줘",
  ]},
  { category: "✨ 이미지 생성 - 기본", items: [
    "새로운 이미지 1장 만들어줘",
    "적절한 이미지 2장 생성해줘",
    "관련 이미지 3장 만들어줘",
  ]},
  { category: "✨ 이미지 생성 - 스타일 참고", items: [
    "이미지 참고해서 유사한 스타일로 3장 만들어줘",
    "같은 색감으로 새 이미지 2장 생성해줘",
    "비슷한 분위기의 이미지 만들어줘",
    "통일된 디자인으로 이미지 4장 만들어줘",
  ]},
  { category: "✨ 이미지 생성 - 위치 지정", items: [
    "이미지 만들어서 적절한 위치에 추가해줘",
    "본문 중간에 어울리는 이미지 2장 넣어줘",
    "각 섹션마다 이미지 1장씩 생성해줘",
  ]},
  { category: "🎨 복합 작업 - 요약 + 이미지", items: [
    "요약하고 대표 이미지 1장 선택해줘",
    "핵심만 남기고 관련 이미지 2장 골라줘",
    "간단히 정리하고 어울리는 이미지 만들어줘",
  ]},
  { category: "🎨 복합 작업 - 확장 + 이미지", items: [
    "확장하고 새 이미지 3장 만들어줘",
    "자세히 설명하고 적절한 이미지 2장 선택해줘",
    "글 늘리고 각 단락에 이미지 추가해줘",
  ]},
  { category: "🎨 복합 작업 - 리뉴얼", items: [
    "전문적으로 다시 쓰고 이미지 3장 생성해줘",
    "블로그 스타일로 바꾸고 어울리는 이미지 골라줘",
    "SNS 포스트로 변환하고 대표 이미지 1장 만들어줘",
  ]},
  { category: "💡 활용 팁", items: [
    "제목 추가하고 구조화해줘",
    "불릿 포인트로 정리해줘",
    "단계별로 나눠서 설명해줘",
    "Before/After 형식으로 작성해줘",
  ]},
];

const ConnectorLabelEditor: React.FC<ConnectorLabelEditorProps> = ({
  id,
  initialValue,
  initialColor,
  initialFontSize,
  position,
  angle,
  onEndEdit,
  onCancel,
  style,
}) => {
  const [text, setText] = useState(initialValue);
  const [color, setColor] = useState(initialColor);
  const [fontSize, setFontSize] = useState(initialFontSize);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        handleSave();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSave = () => {
    onEndEdit(id, { text, color, fontSize });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    }
    if (e.key === "Escape") {
      onCancel();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setText(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div
      ref={panelRef}
      className="fixed p-3 space-y-2 bg-white border-2 border-blue-500 rounded-lg shadow-xl z-50"
      style={{
        left: position.x,
        top: position.y,
        transform: `translate(-50%, calc(-100% - 20px))`,
        minWidth: "200px",
        maxWidth: "400px",
        ...style,
      }}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="예: 요약해줘 / 이미지 3장 만들어줘"
        />
        <button
          onClick={() => setShowSuggestions(!showSuggestions)}
          className="px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-md transition-colors"
          title="예제 보기"
        >
          💡
        </button>
      </div>

      {showSuggestions && (
        <div 
          className="max-h-64 overflow-y-auto border border-gray-200 rounded-md bg-gray-50 p-2 space-y-2"
          onWheel={(e) => e.stopPropagation()} // 캔버스 줌 방지
        >
          {LABEL_SUGGESTIONS.map((group) => (
            <div key={group.category}>
              <div className="text-xs font-semibold text-gray-600 mb-1">
                {group.category}
              </div>
              <div className="space-y-1">
                {group.items.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-2 py-1 text-xs bg-white hover:bg-blue-50 border border-gray-200 rounded transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ))}
          
          <div className="mt-3 pt-3 border-t border-gray-300">
            <div className="text-xs text-gray-500 space-y-1">
              <div className="font-semibold">💡 사용 가이드</div>
              <div>• <strong>텍스트만</strong> 수정: 이미지 키워드 제외</div>
              <div>• <strong>이미지 선택</strong>: "골라", "선택" 등 사용</div>
              <div>• <strong>이미지 생성</strong>: "만들어", "생성" 등 사용</div>
              <div>• 원하는 대로 자유롭게 조합 가능!</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="number"
          value={fontSize}
          onChange={(e) => setFontSize(parseInt(e.target.value, 10) || 14)}
          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-blue-500"
          min="8"
          max="72"
        />
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-8 h-8 p-1 bg-white border border-gray-300 rounded-md cursor-pointer"
        />
      </div>
    </div>
  );
};

export default ConnectorLabelEditor;
