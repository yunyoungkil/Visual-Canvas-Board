

import React from 'react';
import Icon from './Icon';
import type { ShapeType } from '../types';

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
  className,
}) => {
  const ToolbarButton: React.FC<{
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    tooltip: string;
  }> = ({ onClick, active = false, children, tooltip }) => (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`p-2.5 rounded-lg transition-colors duration-200 flex items-center justify-center ${
          active ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
        }`}
      >
        {children}
      </button>
      <div className="absolute left-full ml-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {tooltip}
      </div>
    </div>
  );

  return (
    <div className={`fixed top-1/2 -translate-y-1/2 left-5 z-20 flex flex-col items-center gap-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 ${className || ''}`}>
      <ToolbarButton onClick={onToggleChatAssistant} tooltip="AI 챗 어시스턴트">
        <Icon name="botMessageSquare" className="w-5 h-5 text-indigo-500" />
      </ToolbarButton>
      <div className="w-full h-px bg-gray-300 my-1"></div>
      <ToolbarButton onClick={onTogglePanMode} active={isPanModeActive} tooltip="이동 도구 (H)">
        <Icon name="hand" className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={onToggleTextMode} active={isTextModeActive} tooltip="텍스트 추가 (T)">
        <Icon name="text" className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => onSetShapeToAdd('rectangle')} active={isShapeModeActive} tooltip="도형 추가 (S)">
        <Icon name="square" className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => onSetShapeToAdd('ellipse')} active={isShapeModeActive} tooltip="타원 추가">
        <Icon name="ellipse" className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => onSetShapeToAdd('diamond')} active={isShapeModeActive} tooltip="다이아몬드 추가">
        <Icon name="diamond" className="w-5 h-5" />
      </ToolbarButton>
      <div className="w-full h-px bg-gray-300 my-1"></div>
      <ToolbarButton onClick={onToggleOutlineModal} tooltip="AI 아웃라인 생성">
        <Icon name="list" className="w-5 h-5 text-blue-500" />
      </ToolbarButton>
      <ToolbarButton onClick={onToggleSocialPostModal} tooltip="AI 소셜 게시물 생성">
        <Icon name="messageSquare" className="w-5 h-5 text-blue-500" />
      </ToolbarButton>
      <ToolbarButton onClick={onToggleBrainstormModal} tooltip="AI 아이디어 브레인스토밍">
        <Icon name="lightbulb" className="w-5 h-5 text-yellow-500" />
      </ToolbarButton>
      <ToolbarButton onClick={onToggleKeywordAnalysisModal} tooltip="AI 키워드 분석">
        <Icon name="lightbulb" className="w-5 h-5 text-purple-500" />
      </ToolbarButton>
      <div className="w-full h-px bg-gray-300 my-1"></div>
      <ToolbarButton onClick={onToggleAiExportModal} tooltip="AI로 내보내기">
        <Icon name="export" className="w-5 h-5 text-green-500" />
      </ToolbarButton>
    </div>
  );
};

export default LeftToolbar;