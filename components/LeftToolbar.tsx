import React, { useState, useRef, useEffect } from "react";
import Icon from "./Icon";
import type { ShapeType } from "../types";

interface LeftToolbarProps {
  isPanModeActive: boolean;
  isTextModeActive: boolean;
  isShapeModeActive: boolean;
  onTogglePanMode: () => void;
  onToggleTextMode: () => void;
  onSetShapeToAdd: (shape: ShapeType) => void;
  onToggleOutlineModal: () => void;
  onToggleSocialPostModal: () => void;
  onToggleBrainstormModal: () => void;
  onToggleAiExportModal: () => void;
  onToggleKeywordAnalysisModal: () => void;
  onToggleChatAssistant: () => void;
  onGenerateTextDraft: () => void;
  onUpdateTextDraftWithConnections: () => void;
  canGenerateDraft: boolean;
  canUpdateDraft: boolean;
  isGeneratingAIContent: boolean;
  className?: string;
  selectedItemsCount?: number;
}

const LeftToolbar: React.FC<LeftToolbarProps> = ({
  isPanModeActive,
  isTextModeActive,
  isShapeModeActive,
  onTogglePanMode,
  onToggleTextMode,
  onSetShapeToAdd,
  onToggleOutlineModal,
  onToggleSocialPostModal,
  onToggleBrainstormModal,
  onToggleAiExportModal,
  onToggleKeywordAnalysisModal,
  onToggleChatAssistant,
  onGenerateTextDraft,
  onUpdateTextDraftWithConnections,
  canGenerateDraft,
  canUpdateDraft,
  isGeneratingAIContent,
  className,
  selectedItemsCount = 0,
}) => {
  const [isShapeDropdownOpen, setIsShapeDropdownOpen] = useState(false);
  const [isAiDropdownOpen, setIsAiDropdownOpen] = useState(false);
  const shapeDropdownRef = useRef<HTMLDivElement>(null);
  const aiDropdownRef = useRef<HTMLDivElement>(null);
  const shapeButtonRef = useRef<HTMLDivElement>(null);
  const aiButtonRef = useRef<HTMLDivElement>(null);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // 도형 버튼이나 드롭다운 외부를 클릭한 경우에만 닫기
      if (
        shapeDropdownRef.current &&
        !shapeDropdownRef.current.contains(target) &&
        shapeButtonRef.current &&
        !shapeButtonRef.current.contains(target)
      ) {
        setIsShapeDropdownOpen(false);
      }
      
      // AI 버튼이나 드롭다운 외부를 클릭한 경우에만 닫기
      if (
        aiDropdownRef.current &&
        !aiDropdownRef.current.contains(target) &&
        aiButtonRef.current &&
        !aiButtonRef.current.contains(target)
      ) {
        setIsAiDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 도형 드롭다운 토글 (다른 드롭다운 닫기)
  const handleShapeDropdownToggle = () => {
    const newState = !isShapeDropdownOpen;
    setIsAiDropdownOpen(false);
    setIsShapeDropdownOpen(newState);
  };

  // AI 드롭다운 토글 (다른 드롭다운 닫기)
  const handleAiDropdownToggle = () => {
    const newState = !isAiDropdownOpen;
    setIsShapeDropdownOpen(false);
    setIsAiDropdownOpen(newState);
  };

  const ToolbarButton: React.FC<{
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    tooltip: string;
    description?: string;
    hideTooltip?: boolean;
  }> = ({
    onClick,
    active = false,
    disabled = false,
    children,
    tooltip,
    description,
    hideTooltip = false,
  }) => (
    <div className="relative group">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`p-2.5 rounded-lg transition-colors duration-200 flex items-center justify-center ${
          disabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : active
            ? "bg-blue-500 text-white"
            : "bg-white text-gray-700 hover:bg-gray-100"
        }`}
      >
        {children}
      </button>
      {!hideTooltip && (
        <div className="absolute left-full ml-2 w-64 px-3 py-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          <div className="font-semibold mb-1">{tooltip}</div>
          {description && (
            <div className="text-gray-300 leading-relaxed">{description}</div>
          )}
        </div>
      )}
    </div>
  );

  const HorizontalButton: React.FC<{
    onClick: () => void;
    disabled?: boolean;
    children: React.ReactNode;
    tooltip: string;
    description?: string;
  }> = ({ onClick, disabled = false, children, tooltip, description }) => (
    <div className="relative group">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`p-2.5 rounded-lg transition-colors duration-200 flex items-center justify-center ${
          disabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white text-gray-700 hover:bg-blue-50 hover:border-blue-200"
        }`}
      >
        {children}
      </button>
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 px-2 py-1.5 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[60] whitespace-normal">
        <div className="font-semibold mb-0.5">{tooltip}</div>
        {description && (
          <div className="text-gray-300 text-[10px] leading-tight">
            {description}
          </div>
        )}
      </div>
    </div>
  );


  return (
    <div
      className={`fixed top-1/2 -translate-y-1/2 left-5 z-20 flex flex-col items-center gap-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 ${
        className || ""
      }`}
    >
      <ToolbarButton
        onClick={onToggleChatAssistant}
        tooltip="AI 챗 어시스턴트"
        description="대화형 AI로 캔버스 요소를 자동 생성하고 관리할 수 있습니다."
      >
        <Icon name="botMessageSquare" className="w-5 h-5 text-indigo-500" />
      </ToolbarButton>
      <div className="w-full h-px bg-gray-300 my-1"></div>
      <ToolbarButton
        onClick={onTogglePanMode}
        active={isPanModeActive}
        tooltip="이동 도구 (H)"
      >
        <Icon name="hand" className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={onToggleTextMode}
        active={isTextModeActive}
        tooltip="텍스트 추가 (T)"
      >
        <Icon name="text" className="w-5 h-5" />
      </ToolbarButton>

      {/* 도형 드롭다운 */}
      <div className="relative" ref={shapeButtonRef}>
        <ToolbarButton
          onClick={handleShapeDropdownToggle}
          active={isShapeModeActive}
          tooltip="도형 추가 (S)"
          hideTooltip={isShapeDropdownOpen}
        >
          <Icon name="square" className="w-5 h-5" />
        </ToolbarButton>
        {isShapeDropdownOpen && (
          <div 
            ref={shapeDropdownRef}
            className="absolute left-full top-0 ml-2 flex gap-1 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-1"
          >
            <HorizontalButton
              onClick={() => {
                onSetShapeToAdd("rectangle");
                setIsShapeDropdownOpen(false);
              }}
              tooltip="사각형"
            >
              <Icon name="square" className="w-5 h-5" />
            </HorizontalButton>
            <HorizontalButton
              onClick={() => {
                onSetShapeToAdd("ellipse");
                setIsShapeDropdownOpen(false);
              }}
              tooltip="타원"
            >
              <Icon name="ellipse" className="w-5 h-5" />
            </HorizontalButton>
            <HorizontalButton
              onClick={() => {
                onSetShapeToAdd("diamond");
                setIsShapeDropdownOpen(false);
              }}
              tooltip="다이아몬드"
            >
              <Icon name="diamond" className="w-5 h-5" />
            </HorizontalButton>
          </div>
        )}
      </div>

      <div className="w-full h-px bg-gray-300 my-1"></div>

      {/* AI 기능 드롭다운 - 모든 AI 기능 통합 */}
      <div className="relative" ref={aiButtonRef}>
        <ToolbarButton
          onClick={handleAiDropdownToggle}
          tooltip="AI 도구"
          description="AI 기능으로 콘텐츠를 생성하고 편집합니다."
          hideTooltip={isAiDropdownOpen}
        >
          <Icon name="sparkles" className="w-5 h-5 text-purple-500" />
        </ToolbarButton>
        {isAiDropdownOpen && (
          <div 
            ref={aiDropdownRef}
            className="absolute left-full top-0 ml-2 flex gap-1 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-1.5"
          >
            {/* 선택 항목 AI 기능 */}
            <HorizontalButton
              onClick={() => {
                onGenerateTextDraft();
                setIsAiDropdownOpen(false);
              }}
              disabled={!canGenerateDraft || isGeneratingAIContent}
              tooltip="AI 초안 생성"
              description="짧은 초안 작성 (200자 이내)"
            >
              <Icon name="sparkles" className="w-5 h-5 text-purple-500" />
            </HorizontalButton>
            <HorizontalButton
              onClick={() => {
                onUpdateTextDraftWithConnections();
                setIsAiDropdownOpen(false);
              }}
              disabled={!canUpdateDraft || isGeneratingAIContent}
              tooltip="연결 기반 업데이트"
              description="연결된 요소 참고하여 업데이트"
            >
              <Icon name="sparklesRefresh" className="w-5 h-5 text-cyan-500" />
            </HorizontalButton>

            <div className="w-px h-full bg-gray-200 mx-0.5"></div>

            {/* 새 콘텐츠 생성 */}
            <HorizontalButton
              onClick={() => {
                onToggleOutlineModal();
                setIsAiDropdownOpen(false);
              }}
              tooltip="AI 아웃라인 생성"
              description="구조화된 아웃라인을 생성"
            >
              <Icon name="list" className="w-5 h-5 text-blue-500" />
            </HorizontalButton>
            <HorizontalButton
              onClick={() => {
                onToggleSocialPostModal();
                setIsAiDropdownOpen(false);
              }}
              tooltip="AI 소셜 게시물"
              description="소셜 미디어 게시물 작성"
            >
              <Icon name="messageSquare" className="w-5 h-5 text-blue-500" />
            </HorizontalButton>
            <HorizontalButton
              onClick={() => {
                onToggleBrainstormModal();
                setIsAiDropdownOpen(false);
              }}
              tooltip="AI 브레인스토밍"
              description="아이디어를 마인드맵으로 생성"
            >
              <Icon name="lightbulb" className="w-5 h-5 text-yellow-500" />
            </HorizontalButton>

            <div className="w-px h-full bg-gray-200 mx-0.5"></div>

            {/* 분석 및 내보내기 */}
            <HorizontalButton
              onClick={() => {
                onToggleKeywordAnalysisModal();
                setIsAiDropdownOpen(false);
              }}
              tooltip="AI 키워드 분석"
              description="핵심 키워드 추출 및 분석"
            >
              <Icon name="lightbulb" className="w-5 h-5 text-purple-500" />
            </HorizontalButton>
            <HorizontalButton
              onClick={() => {
                onToggleAiExportModal();
                setIsAiDropdownOpen(false);
              }}
              tooltip="AI로 내보내기"
              description="마크다운으로 정리하여 내보내기"
            >
              <Icon name="export" className="w-5 h-5 text-green-500" />
            </HorizontalButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeftToolbar;
