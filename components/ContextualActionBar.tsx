import React from "react";
import Icon from "./Icon";
import type { CanvasItem } from "../types";

interface ContextualActionBarProps {
  selectedItemIds: string[];
  selectedItems: CanvasItem[];
  selectedConnectorId: string | null;
  isGridSnapActive: boolean;
  isSuggestingGroups: boolean;
  isGeneratingGroupDraft: boolean;
  onGroup: () => void;
  onUngroup: () => void;
  onDelete: () => void;
  onToggleGridSnap: () => void;
  onSuggestGroups: () => void;
  onGenerateGroupDraft: () => void;
  onBringForward: () => void;
  onBringToFront: () => void;
  onSendBackward: () => void;
  onSendToBack: () => void;
  isDetailsPanelVisible: boolean;
  onToggleDetailsPanel: () => void;
  className?: string; // Add className prop
}

const ContextualActionBar: React.FC<ContextualActionBarProps> = ({
  selectedItemIds,
  selectedItems,
  selectedConnectorId,
  isGridSnapActive,
  isSuggestingGroups,
  isGeneratingGroupDraft,
  onGroup,
  onUngroup,
  onDelete,
  onToggleGridSnap,
  onSuggestGroups,
  onGenerateGroupDraft,
  onBringForward,
  onBringToFront,
  onSendBackward,
  onSendToBack,
  isDetailsPanelVisible,
  onToggleDetailsPanel,
  className,
}) => {
  const selectionCount = selectedItemIds.length;
  if (selectionCount === 0 && !selectedConnectorId) return null;

  const canGroup = selectionCount > 1;
  const canUngroup = selectedItems.some((item) => item.groupId);
  const isItemSelected = selectionCount > 0;
  const allInSameGroup =
    isItemSelected &&
    selectedItems.length > 0 &&
    !!selectedItems[0]?.groupId &&
    selectedItems.every((item) => item.groupId === selectedItems[0].groupId);
  const canShowDetailsButton =
    selectedItemIds.length === 1 || !!selectedConnectorId;

  const Button: React.FC<{
    onClick: () => void;
    disabled?: boolean;
    active?: boolean;
    children: React.ReactNode;
    tooltip: string;
    loading?: boolean;
  }> = ({
    onClick,
    disabled = false,
    active = false,
    children,
    tooltip,
    loading = false,
  }) => (
    <div className="relative group">
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className={`p-2.5 rounded-lg transition-colors duration-200 flex items-center justify-center ${
          active
            ? "bg-blue-500 text-white"
            : "bg-white text-gray-700 hover:bg-gray-100"
        } disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed`}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
        ) : (
          children
        )}
      </button>
      <div className="absolute bottom-full mb-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {tooltip}
      </div>
    </div>
  );

  return (
    <div
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 ${
        className || ""
      }`}
    >
      <Button
        onClick={onSuggestGroups}
        tooltip="그룹 추천 (AI)"
        loading={isSuggestingGroups}
        disabled={!isItemSelected || selectionCount < 2}
      >
        <Icon name="groupSparkles" className="w-5 h-5" />
      </Button>
      {isItemSelected && allInSameGroup && (
        <Button
          onClick={onGenerateGroupDraft}
          tooltip="그룹 초안 생성 (AI)"
          loading={isGeneratingGroupDraft}
        >
          <Icon name="sparkles" className="w-5 h-5" />
        </Button>
      )}
      <Button onClick={onGroup} disabled={!canGroup} tooltip="그룹화 (G)">
        <Icon name="group" className="w-5 h-5" />
      </Button>
      <Button
        onClick={onUngroup}
        disabled={!canUngroup}
        tooltip="그룹 해제 (U)"
      >
        <Icon name="ungroup" className="w-5 h-5" />
      </Button>
      <div className="w-px h-6 bg-gray-300 mx-1"></div>
      <Button
        onClick={onBringForward}
        tooltip="앞으로 가져오기"
        disabled={!isItemSelected}
      >
        <Icon name="bringForward" className="w-5 h-5" />
      </Button>
      <Button
        onClick={onBringToFront}
        tooltip="맨 앞으로 가져오기"
        disabled={!isItemSelected}
      >
        <Icon name="bringFront" className="w-5 h-5" />
      </Button>
      <Button
        onClick={onSendBackward}
        tooltip="뒤로 보내기"
        disabled={!isItemSelected}
      >
        <Icon name="sendBackward" className="w-5 h-5" />
      </Button>
      <Button
        onClick={onSendToBack}
        tooltip="맨 뒤로 보내기"
        disabled={!isItemSelected}
      >
        <Icon name="sendBack" className="w-5 h-5" />
      </Button>
      <div className="w-px h-6 bg-gray-300 mx-1"></div>
      <Button
        onClick={onToggleGridSnap}
        active={isGridSnapActive}
        tooltip="격자에 맞춤 (B)"
      >
        <Icon name="magnet" className="w-5 h-5" />
      </Button>
      {canShowDetailsButton && (
        <Button
          onClick={onToggleDetailsPanel}
          active={isDetailsPanelVisible}
          tooltip="세부 정보 패널"
        >
          <Icon name="settings" className="w-5 h-5" />
        </Button>
      )}
      <div className="w-px h-6 bg-gray-300 mx-1"></div>
      <Button
        onClick={onDelete}
        disabled={selectionCount === 0 && !selectedConnectorId}
        tooltip="삭제 (Backspace)"
      >
        <Icon name="trash" className="w-5 h-5 text-red-500" />
      </Button>
    </div>
  );
};

export default ContextualActionBar;
