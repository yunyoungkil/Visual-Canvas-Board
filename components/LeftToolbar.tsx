import React from "react";
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
  className?: string; // Add className prop
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
}) => {
  const ToolbarButton: React.FC<{
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    tooltip: string;
    description?: string;
  }> = ({
    onClick,
    active = false,
    disabled = false,
    children,
    tooltip,
    description,
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
      <div className="absolute left-full ml-2 w-64 px-3 py-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <div className="font-semibold mb-1">{tooltip}</div>
        {description && (
          <div className="text-gray-300 leading-relaxed">{description}</div>
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
      <ToolbarButton
        onClick={() => onSetShapeToAdd("rectangle")}
        active={isShapeModeActive}
        tooltip="도형 추가 (S)"
      >
        <Icon name="square" className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => onSetShapeToAdd("ellipse")}
        active={isShapeModeActive}
        tooltip="타원 추가"
      >
        <Icon name="ellipse" className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => onSetShapeToAdd("diamond")}
        active={isShapeModeActive}
        tooltip="다이아몬드 추가"
      >
        <Icon name="diamond" className="w-5 h-5" />
      </ToolbarButton>
      <div className="w-full h-px bg-gray-300 my-1"></div>

      {/* AI 초안 작성 기능 */}
      <ToolbarButton
        onClick={onGenerateTextDraft}
        disabled={!canGenerateDraft || isGeneratingAIContent}
        tooltip="AI 초안 생성"
        description="선택한 텍스트/도형에 AI가 짧은 초안(200자 이내)을 작성합니다. 빈 요소나 짧은 텍스트가 있을 때 사용하세요."
      >
        <Icon name="sparkles" className="w-5 h-5 text-purple-500" />
      </ToolbarButton>
      <ToolbarButton
        onClick={onUpdateTextDraftWithConnections}
        disabled={!canUpdateDraft || isGeneratingAIContent}
        tooltip="연결 기반 업데이트"
        description="선택한 요소와 연결된 다른 요소들의 내용을 참고하여 AI가 내용을 업데이트합니다. 연결선이 있을 때 유용합니다."
      >
        <Icon name="sparklesRefresh" className="w-5 h-5 text-cyan-500" />
      </ToolbarButton>

      <div className="w-full h-px bg-gray-300 my-1"></div>
      <ToolbarButton
        onClick={onToggleOutlineModal}
        tooltip="AI 아웃라인 생성"
        description="주제를 입력하면 AI가 구조화된 아웃라인을 생성하여 캔버스에 배치합니다."
      >
        <Icon name="list" className="w-5 h-5 text-blue-500" />
      </ToolbarButton>
      <ToolbarButton
        onClick={onToggleSocialPostModal}
        tooltip="AI 소셜 게시물 생성"
        description="주제와 플랫폼을 선택하면 AI가 최적화된 소셜 미디어 게시물을 작성합니다."
      >
        <Icon name="messageSquare" className="w-5 h-5 text-blue-500" />
      </ToolbarButton>
      <ToolbarButton
        onClick={onToggleBrainstormModal}
        tooltip="AI 아이디어 브레인스토밍"
        description="주제에 대한 다양한 아이디어를 AI가 생성하여 마인드맵 형태로 배치합니다."
      >
        <Icon name="lightbulb" className="w-5 h-5 text-yellow-500" />
      </ToolbarButton>
      <ToolbarButton
        onClick={onToggleKeywordAnalysisModal}
        tooltip="AI 키워드 분석"
        description="텍스트를 입력하면 AI가 핵심 키워드를 추출하고 분석 결과를 제공합니다."
      >
        <Icon name="lightbulb" className="w-5 h-5 text-purple-500" />
      </ToolbarButton>
      <div className="w-full h-px bg-gray-300 my-1"></div>
      <ToolbarButton
        onClick={onToggleAiExportModal}
        tooltip="AI로 내보내기"
        description="캔버스의 내용을 AI가 분석하여 마크다운 문서로 정리하고 내보냅니다."
      >
        <Icon name="export" className="w-5 h-5 text-green-500" />
      </ToolbarButton>
    </div>
  );
};

export default LeftToolbar;
