import React from "react";
import Icon from "./Icon";
import type { SavedCanvas, CardCategory, CanvasItem, Connector } from "../types";

interface CardListPanelProps {
  category: CardCategory;
  canvases: SavedCanvas[];
  onClose: () => void;
  onLoadCanvas: (items: CanvasItem[], connectors: Connector[]) => void;
  onDeleteCanvas: (id: string) => void;
}

const CardListPanel: React.FC<CardListPanelProps> = ({
  category,
  canvases,
  onClose,
  onLoadCanvas,
  onDeleteCanvas,
}) => {
  const categoryLabels: Record<CardCategory, string> = {
    scrap: "스크랩",
    idea: "아이디어",
    planning: "기획/작성 중",
  };

  const categoryColors: Record<CardCategory, string> = {
    scrap: "bg-blue-500",
    idea: "bg-yellow-500",
    planning: "bg-green-500",
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "방금 전";
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString("ko-KR");
  };

  return (
    <div className="fixed top-0 right-0 h-full w-80 bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${categoryColors[category]}`}></div>
          <h2 className="text-lg font-semibold text-gray-800">
            {categoryLabels[category]}
          </h2>
          <span className="text-sm text-gray-500">({canvases.length})</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="닫기"
        >
          <Icon name="close" className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* 카드 리스트 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {canvases.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Icon name="fileX" className="w-16 h-16 mb-2" />
            <p className="text-sm">저장된 항목이 없습니다</p>
          </div>
        ) : (
          canvases.map((canvas) => (
            <div
              key={canvas.id}
              className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group relative"
              onClick={() => onLoadCanvas(canvas.items, canvas.connectors)}
            >
              {/* 썸네일 */}
              {canvas.thumbnail && (
                <div className="w-full h-32 mb-2 bg-gray-200 rounded overflow-hidden">
                  <img
                    src={canvas.thumbnail}
                    alt={canvas.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* 제목 */}
              <h3 className="font-medium text-gray-800 mb-1 line-clamp-2 group-hover:text-blue-600">
                {canvas.title}
              </h3>

              {/* 설명 */}
              {canvas.description && (
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                  {canvas.description}
                </p>
              )}

              {/* 메타 정보 */}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <span>{canvas.items.length} 항목</span>
                  <span>•</span>
                  <span>{canvas.connectors.length} 연결</span>
                </div>
                <span>{formatDate(canvas.updatedAt)}</span>
              </div>

              {/* 삭제 버튼 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm("이 항목을 삭제하시겠습니까?")) {
                    onDeleteCanvas(canvas.id);
                  }
                }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-red-500 hover:bg-red-600 rounded text-white"
                title="삭제"
              >
                <Icon name="trash" className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CardListPanel;
